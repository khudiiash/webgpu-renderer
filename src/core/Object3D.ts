import { Euler } from "@/math/Euler";
import { Vector3 } from "@/math/Vector3";
import { Quaternion } from "@/math/Quaternion";
import { Matrix4 } from "@/math/Matrix4";
import { uuid, num } from "@/util/general";
import { EventEmitter } from "./EventEmitter";

export class Object3D extends EventEmitter {
    public position: Vector3;
    public rotation: Euler;
    public scale: Vector3;
    public quaternion: Quaternion;
    public matrix: Matrix4;
    public matrixWorld: Matrix4;
    public children: Object3D[];
    public parent: Object3D | null;
    public name: string = 'Object';
    public up: Vector3 = Vector3.up;
    public id: string;
    public direction = new Vector3(0, 0, -1);

    private matrixUpdateInProgress: boolean = false;
    public isCamera: boolean = false;
    public isLight: boolean = false;
    public isDirectionalLight: boolean = false;
    public isPointLight: boolean = false;
    public isSpotLight: boolean = false;
    public isMesh: boolean = false;

    constructor() {
        super();
        this.position = new Vector3().onChange(() => {
            this.updateMatrix();
        });
        this.rotation = new Euler().onChange(() => {
            Quaternion.instance.setFromEuler(this.rotation);
            this.quaternion.copySilent(Quaternion.instance);
            this.updateMatrix();
        });
        this.scale = new Vector3(1, 1, 1).onChange(() => {
            this.updateMatrix();
        });
        this.quaternion = new Quaternion().onChange(() => {
            Euler.instance.setFromQuaternion(this.quaternion, this.rotation.order);
            this.rotation.copySilent(Euler.instance);
            this.updateMatrix();
        }); 
        this.id = uuid('object');
        this.matrix = new Matrix4();
        this.matrixWorld = new Matrix4();
        this.children = [];
        this.parent = null;
    }

    lookAt(x: number | Vector3 | Object3D, y: number, z: number): void {
        if (x instanceof Object3D) {
            x.updateMatrixWorld();
            _target.copy(x.position);
        } else if (x instanceof Vector3 ) {
			_target.copy(x);
		} else if (num(x, y, z)) {
			_target.setXYZ(x, y, z);
		} else {
            console.error( `Object3D.lookAt(): Invalid target ${x}, ${y}, ${z}` );
            return;
        }

		const parent = this.parent;

		this.updateMatrixWorld();

		_position.setFromMatrixPosition( this.matrixWorld );

		if (this.isCamera || this.isLight) {
			_m1.lookAt( _position, _target, this.up );
		} else {
			_m1.lookAt( _target, _position, this.up );

		}

		this.quaternion.setFromRotationMatrix( _m1 );

		if ( parent ) {
            _m1.setFromRotationMatrix( parent.matrixWorld );
			_q1.setFromRotationMatrix( _m1 );
			this.quaternion.premultiply( _q1.inverse() );

		}
    }
    updateMatrix() {
        if (this.matrixUpdateInProgress) return;
        this.matrixUpdateInProgress = true;
        this.matrix.compose(this.position, this.quaternion, this.scale);
        this.updateMatrixWorld();
        this.matrixUpdateInProgress = false;
    }

    updateMatrixWorld(fromParent: boolean = false) {
        this.matrixUpdateInProgress = true;

        if (this.parent) {
            this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
            fromParent && this.matrixWorld.decompose(this.position, this.quaternion, this.scale);
        } else {
            this.matrixWorld.copy(this.matrix);
        }

        this.children.forEach(child => {
            child.updateMatrixWorld(true);
        });

        if (!this.isDirectionalLight) {
            this.direction.set([ this.matrixWorld[8], this.matrixWorld[9], this.matrixWorld[10] ]).normalize();
        }

        this.matrixUpdateInProgress = false;
    }

    add(child: Object3D) {
        if (child.parent) {
            child.parent.remove(child);
        }
        child.parent = this;
        this.children.push(child);
        //child.updateMatrixWorld(true);
    }

    remove(child: Object3D) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            child.parent = null;
            this.children.splice(index, 1);
        }
    }

    setPosition(x: number | Vector3, y: number = 0, z: number = 0) {
        if (x instanceof Vector3) {
            this.position.copy(x);
        } else if (num(x, y, z)) {
            this.position.set([x, y, z]);
        }
    }

    setScale(x: number | Vector3, y?: number, z?: number) {
        console.log(x, y, z, num(x, y, z));
        if (x instanceof Vector3) {
            this.scale.copy(x);
        } else if (num(x) && !num(y, z)) {
            this.scale.set([x, x, x]);
        } else if (num(x, y, z)) {
            this.scale.set([x, y as number, z as number]);
        }
    }

    traverse(callback: (object: Object3D) => void) {
        const stack: Object3D[] = [this];
        while (stack.length) {
            const current = stack.pop()!;
            callback(current);
            for (let i = 0, len = current.children.length; i < len; i++) {
                stack.push(current.children[i]);
            }
        }
    }

    findByName(name: string): Object3D | null {
        const stack: Object3D[] = [this];
        while (stack.length) {
            const current = stack.pop()!;
            if (current.name === name) {
                return current;
            }
            for (let i = 0, len = current.children.length; i < len; i++) {
                stack.push(current.children[i]);
            }
        }
        return null;
    }

    findAll(predicate: (object: Object3D) => boolean): Object3D[] {
        const result: Object3D[] = [];
        const stack: Object3D[] = [this];
        while (stack.length) {
            const node = stack.pop()!;
            if (predicate(node)) {
                result.push(node);
            }
            stack.push(...node.children);
        }
        return result;
    }

    copy(source: Object3D) {
        this.position.copy(source.position);
        this.rotation.copy(source.rotation);
        this.scale.copy(source.scale);
        this.quaternion.copy(source.quaternion);
        this.matrix.copy(source.matrix);
        this.matrixWorld.copy(source.matrixWorld);
        this.children = source.children.map(child => child.clone());
        return this;
    }

    clone(): Object3D {
        return new Object3D().copy(this);
    }
}

const _target = new Vector3();
const _position = new Vector3();
const _m1 = new Matrix4();
const _q1 = new Quaternion();