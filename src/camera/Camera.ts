import { Object3D } from '@/core';
import { Frustum, Matrix4, Vector3 } from '@/math';
import { UniformData, UniformDataConfig } from '@/data';
import { uuid } from '@/util';

const _projScreenMatrix = new Matrix4();
const _vector = new Vector3();

class Camera extends Object3D {
    protected isCamera: boolean = true;
    protected type: string = 'camera';
    public target: Vector3;
    public up: Vector3;
    public matrixWorldInverse: Matrix4;
    public projectionMatrix: Matrix4;
    public viewMatrix: Matrix4;
    public projectionMatrixInverse: Matrix4;
    public projectionViewMatrix: Matrix4;
    public rightDirection: Vector3;
    public frustum: Frustum;
    public uniforms: UniformData;
    public aspect: number;

    constructor() {
        super();
        this.name = 'Camera';
        this.target = new Vector3(0, 0, 0);
        this.up = new Vector3(0, 1, 0);
        this.id = uuid('camera');

        this.matrixWorldInverse = new Matrix4();
        this.projectionMatrix = new Matrix4();
        this.viewMatrix = new Matrix4();
        this.projectionMatrixInverse = new Matrix4();
        this.projectionViewMatrix = new Matrix4();
        this.rightDirection = new Vector3();
        this.frustum = new Frustum();

        const uniformConfig: UniformDataConfig = {
            name: 'camera',
            isGlobal: true,
            values: {
                projection: this.projectionMatrix,
                view: this.viewMatrix,
                position: this.position,
                direction: this.target.clone().sub(this.position).normalize(),
            }
        };
        this.uniforms = new UniformData(this, uniformConfig);

        this.aspect = 1; // Default aspect ratio
    }

    updateFrustum() {
        _projScreenMatrix.multiplyMatrices(this.projectionMatrix, this.matrixWorldInverse);
        this.frustum.setFromProjectionMatrix(_projScreenMatrix);
    }

    _onResize({ aspect }: { aspect: number }) {
        if (this.aspect === aspect) return;
        this.aspect = aspect;
        this.updateProjectionMatrix();
    }

    copy(source: Camera, recursive: boolean = true) {
        super.copy(source);
        this.matrixWorldInverse.copy(source.matrixWorldInverse);
        this.projectionMatrix.copy(source.projectionMatrix);
        this.projectionMatrixInverse.copy(source.projectionMatrixInverse);
        return this;
    }

    setPosition(x: number | Vector3, y: number = 0, z: number = 0) {
        if (x instanceof Vector3) {
            this.target.add(_vector.copy(x).sub(this.position));
        } else {
            const diff = _vector.set(x - this.position.x, y - this.position.y, z - this.position.z);
            this.target.add(diff);
        }
        super.setPosition(x, y, z);
    }

    updateViewMatrix() {
        this.viewMatrix.lookAt(this.position, this.target, this.up);
        this.rightDirection.set([this.viewMatrix[0], this.viewMatrix[1], this.viewMatrix[2]]);
        this.projectionViewMatrix.multiplyMatrices(this.projectionMatrix, this.viewMatrix);
    }

    updateProjectionMatrix() {
        // Implemented in subclasses
    }

    updateWorldMatrix(updateParents: boolean = false, updateChildren: boolean = true) {
        super.updateWorldMatrix(updateParents, updateChildren);
        this.updateViewMatrix();
    }

    updateMatrixWorld(force: boolean = false) {
        super.updateMatrixWorld(force);
        this.updateViewMatrix();
    }

    clone() {
        return new this.constructor().copy(this);
    }
}

export { Camera };