import { Object3D } from '@/core/Object3D';
import { Frustum } from '@/math/Frustum';
import { Matrix4 } from '@/math/Matrix4';
import { Vector3 } from '@/math/Vector3';

import { UniformData } from '@/data/UniformData';
import { uuid } from '@/util/general';
import { Renderer } from '@/renderer/Renderer';
import { Struct } from '@/data/Struct';


export class Camera extends Object3D {
    public isCamera: boolean = true;
    public type: string = 'camera';
    public target: Vector3;
    public up: Vector3;
    public rightDirection: Vector3;
    public frustum: Frustum;
    public aspect: number = 1;

    matrixViewProjectionInverse: Matrix4;
    matrixViewProjection: Matrix4;
    matrixProjection: Matrix4;
    matrixView: Matrix4;

    static struct = new Struct('Camera', {
        view: 'mat4x4f',
        projection: 'mat4x4f',
        view_projection: 'mat4x4f',
        view_projection_inverse: 'mat4x4f',
        position: 'vec3f',
        direction: 'vec3f',
    });

    constructor() {
        super();
        this.name = 'Camera';
        this.target = Vector3.zero;
        this.up = Vector3.up;
        this.id = uuid('camera');

        this.rightDirection = new Vector3();
        this.frustum = new Frustum();

        this.matrixView = new Matrix4();
        this.matrixProjection = new Matrix4();
        this.matrixViewProjection= new Matrix4();
        this.matrixViewProjectionInverse = new Matrix4();

        this.uniforms = new Map<string, UniformData>();
        this.uniforms.set('Camera', new UniformData(this, {
                name: 'Camera',
                isGlobal: true,
                struct: Camera.struct,
                values: {
                    view: this.matrixView,
                    projection: this.matrixProjection,
                    view_projection: this.matrixViewProjection,
                    view_projection_inverse: this.matrixViewProjectionInverse,
                    position: this.position,
                    direction: this.forward,
                }
            }),
        );

        Renderer.on('resize', this._onResize, this);
    }

    updateFrustum() {
        this.frustum.setFromProjectionMatrix(this.matrixViewProjection);
    }

    _onResize({ aspect }: { aspect: number }) {
        if (this.aspect === aspect) return;
        this.aspect = aspect;
        this.updateProjectionMatrix();
    }

    copy(source: Camera) {
        super.copy(source);
        this.matrixView.copy(source.matrixView);
        this.matrixProjection.copy(source.matrixProjection);
        this.matrixViewProjection.copy(source.matrixViewProjection);
        this.matrixViewProjectionInverse.copy(source.matrixViewProjectionInverse);
        return this;
    }

    updateMatrixWorld(fromParent: boolean = false) {
        super.updateMatrixWorld(fromParent);
        this.matrixView.copy(this.matrixWorld).invert();
        this.matrixViewProjection.multiplyMatrices(this.matrixProjection, this.matrixView);
        this.matrixViewProjectionInverse.copy(this.matrixViewProjection).invert();
    }


    updateProjectionMatrix() {
        // Implemented in subclasses
    }

}
const _projScreenMatrix = new Matrix4();