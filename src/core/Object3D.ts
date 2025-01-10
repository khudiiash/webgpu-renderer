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
    public id: string;
    public direction = new Vector3(0, 0, -1);

    private matrixUpdateInProgress: boolean = false;

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

    lookAt(target: Vector3): void {
        Matrix4.instance.lookAt(this.position, target);
        this.quaternion.setFromRotationMatrix(Matrix4.instance);
        this.updateMatrix();
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

        this.direction.set([ this.matrixWorld[8], this.matrixWorld[9], this.matrixWorld[10] ]).normalize();

        this.matrixUpdateInProgress = false;
    }

    add(child: Object3D) {
        if (child.parent) {
            child.parent.remove(child);
        }
        child.parent = this;
        this.children.push(child);
        child.updateMatrixWorld();
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

    setScale(x: number | Vector3, y: number = 0, z: number = 0) {
        if (x instanceof Vector3) {
            this.scale.copy(x);
        } else if (num(x) && !num(y, z)) {
            this.scale.set([x, x, x]);
        } else if (num(x, y, z)) {
            this.scale.set([x, y, z]);
        }
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