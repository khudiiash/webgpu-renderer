import { Object3D } from '@/core/Object3D';
import { Frustum } from '@/math/Frustum';
import { Matrix4 } from '@/math/Matrix4';
import { Vector3 } from '@/math/Vector3';

import { UniformData, UniformDataConfig } from '@/data/UniformData';
import { uuid } from '@/util/general';
import { Renderer } from '@/renderer/Renderer';
import { ResourceManager } from '@/engine/ResourceManager';


export class Camera extends Object3D {
    public isCamera: boolean = true;
    public type: string = 'camera';
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
        this.target = Vector3.zero;
        this.up = Vector3.up;
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
                view: this.matrixWorldInverse,
                position: this.position,
                direction: this.forward,
            }
        };
        this.uniforms = new UniformData(this, uniformConfig).onChange((data) => {
            ResourceManager.updateBuffer(this.uniforms.id);
        });

        this.aspect = 1; // Default aspect ratio

        Renderer.on('resize', this._onResize, this);
    }

    updateFrustum() {
        _projScreenMatrix.multiplyMatrices(this.projectionMatrix, this.matrixWorldInverse);
        this.frustum.setFromProjectionMatrix(_projScreenMatrix);
    }

    _onResize({ aspect }: { aspect: number }) {
        if (this.aspect === aspect) return;
        this.aspect = aspect;
        console.log('Camera aspect ratio updated:', this.aspect);
        this.updateProjectionMatrix();
    }

    copy(source: Camera) {
        super.copy(source);
        this.matrixWorldInverse.copy(source.matrixWorldInverse);
        this.projectionMatrix.copy(source.projectionMatrix);
        this.projectionMatrixInverse.copy(source.projectionMatrixInverse);
        return this;
    }

    updateMatrixWorld(fromParent: boolean = false) {
        super.updateMatrixWorld(fromParent);
        this.matrixWorldInverse.copy(this.matrixWorld).invert();
    }


    updateProjectionMatrix() {
        // Implemented in subclasses
    }

}
const _projScreenMatrix = new Matrix4();