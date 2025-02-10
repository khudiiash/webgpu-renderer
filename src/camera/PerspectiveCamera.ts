import { Vector3 }  from '@/math/Vector3';
import { Camera } from './Camera';
import { DEG2RAD } from '@/util/math';

export class PerspectiveCamera extends Camera {
    protected isPerspectiveCamera: boolean = true;
    fov: number;
    aspect: number;
    near: number;
    far: number;
    up: Vector3;
    zoom: number;
    focus: number;
    view: any;
    target: Vector3;

    constructor(fov = 45, aspect = 1, near = 0.1, far = 1000) {
        super();
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        this.up = new Vector3(0, 1, 0);
        this.zoom = 1;
        this.focus = 10;
        this.view = null;
        this.target = new Vector3();
          
        this.updateProjectionMatrix();
    }
  
    updateProjectionMatrix() {
        const near = this.near;
        let top = near * Math.tan(DEG2RAD * 0.5 * this.fov) / this.zoom;
        let height = 2 * top;
        let width = this.aspect * height;
        let left = -0.5 * width;

        if (this.view !== null && this.view.enabled) {
            const fullWidth = this.view.fullWidth;
            const fullHeight = this.view.fullHeight;

            left += this.view.offsetX * width / fullWidth;
            top -= this.view.offsetY * height / fullHeight;
            width *= this.view.width / fullWidth;
            height *= this.view.height / fullHeight;
        }

        this.matrixProjection.setPerspective(left, left + width, top, top - height, near, this.far);
        this.matrixViewProjection.multiplyMatrices(this.matrixProjection, this.matrixView);
        this.matrixViewProjectionInverse.copy(this.matrixViewProjection).invert();
        this.updateFrustum();
    }

    copy(camera: PerspectiveCamera) {
        this.fov = camera.fov;
        this.zoom = camera.zoom;
        this.near = camera.near;
        this.far = camera.far;
        this.up.copy(camera.up);
        this.matrixView.copy(camera.matrixView);
        this.matrixProjection.copy(camera.matrixProjection);
        this.matrixViewProjection.copy(camera.matrixViewProjection);
        this.matrixViewProjectionInverse.copy(camera.matrixViewProjectionInverse);
        return this;
    }

    clone() {
        const camera = new PerspectiveCamera();
        camera.copy(this);
        return camera;
    }
    
}