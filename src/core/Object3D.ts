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
    public up: Vector3 = Vector3.UP;
    public id: string;
    readonly forward = new Vector3(0, 0, -1);
    readonly right = new Vector3(1, 0, 0);

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

    lookAt(x: number | Vector3, y?: number, z?: number): void {
        // This method does not support objects having non-uniformly-scaled parent(s)
        
        if (x instanceof Vector3) {
            _target.copy(x);
        } else {
            _target.set([x, y!, z!]);
        }

        const parent = this.parent;

        this.updateMatrixWorld(true);

        _position.setFromMatrixPosition(this.matrixWorld);

        if (this.isCamera || this.isLight) {
            _m1.lookAt(_position, _target, this.up);
        } else {
            _m1.lookAt(_target, _position, this.up);
        }

        this.quaternion.setFromRotationMatrix(_m1);

        if (parent) {
            _m1.extractRotation(parent.matrixWorld);
            _q1.setFromRotationMatrix(_m1);
            this.quaternion.premultiply(_q1.invert());
        }
    }
    updateMatrix() {
        if (this.matrixUpdateInProgress) return;
        this.matrixUpdateInProgress = true;
        this.matrix.compose(this.position, this.quaternion, this.scale);
        this.updateMatrixWorld();
        this.matrixUpdateInProgress = false;
    }

    getWorldScale(vector: Vector3 = Vector3.instance): Vector3 {
        this.matrixWorld.getScale(vector);
        return vector;
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

        if (this.isLight || this.isCamera) {
            this.forward.set([ -this.matrixWorld[8], -this.matrixWorld[9], -this.matrixWorld[10] ]).normalize();
        }  else {
            this.forward.set([ this.matrixWorld[8], this.matrixWorld[9], this.matrixWorld[10] ]).normalize();
        }
        this.right.set([ this.matrixWorld[0], this.matrixWorld[1], this.matrixWorld[2] ]).normalize();

        this.matrixUpdateInProgress = false;
    }

    add(child: Object3D) {
        if (child.parent) {
            child.parent.remove(child);
        }
        child.parent = this;
        this.children.push(child);
        child.updateMatrixWorld(true);
        return this;
    }

    remove(child: Object3D) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            child.parent = null;
            this.children.splice(index, 1);
        }
        return this;
    }

    setPosition(x: number | Vector3, y: number = 0, z: number = 0) {
        if (x instanceof Vector3) {
            this.position.copy(x);
        } else if (num(x, y, z)) {
            this.position.set([x, y, z]);
        }
        return this;
    }

    setScale(x: number | Vector3, y?: number, z?: number) {
        if (x instanceof Vector3) {
            this.scale.copy(x);
        } else if (num(x) && !num(y, z)) {
            this.scale.set([x, x, x]);
        } else if (num(x, y, z)) {
            this.scale.set([x, y as number, z as number]);
        }
        return this;
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

    find(predicate: (object: Object3D) => boolean): Object3D | null {
        const stack: Object3D[] = [this];
        while (stack.length) {
            const node = stack.pop()!;
            if (predicate(node)) {
                return node;
            }
            stack.push(...node.children);
        }
        return null;
    }

    copy( source: Object3D, recursive = true ) {

		this.name = source.name;

		this.up.copy( source.up );

		this.position.copy( source.position );
		this.rotation.order = source.rotation.order;
		this.quaternion.copy( source.quaternion );
		this.scale.copy( source.scale );

		this.matrix.copy( source.matrix );
		this.matrixWorld.copy( source.matrixWorld );

		if (recursive === true ) {
			for ( let i = 0; i < source.children.length; i ++ ) {
				const child = source.children[ i ];
				this.add( child.clone() );

			}
		}

		return this;
	}



    clone( recursive = false ) {
        return new (this.constructor as typeof Object3D)().copy( this, recursive );

    }
}

const _target = new Vector3();
const _position = new Vector3();
const _quat = new Quaternion();
const _m1 = new Matrix4();
const _q1 = new Quaternion();