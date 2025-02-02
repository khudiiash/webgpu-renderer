import { Matrix4 } from '../math/Matrix4.js';
import { Vector3 } from '../math/Vector3.js';
import { Camera } from './Camera.js';

export class OrthographicCamera extends Camera {

    leftOffset: number;
    rightOffset: number;
    bottomOffset: number;
    topOffset: number;
    near: number;
    far: number;
    zoom: number;

    constructor(leftOffset = -1, rightOffset = 1, bottomOffset = -1, topOffset = 1, near = 0.1, far = 1000) {    
        super();
        this.leftOffset = leftOffset;
        this.rightOffset = rightOffset;
        this.bottomOffset = bottomOffset;
        this.topOffset = topOffset;
        this.near = near;
        this.far = far;
        this.aspect = 1;
        this.zoom = 1;
        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();
        this.up = new Vector3(0, 1, 0);
        this.projectionViewMatrix = new Matrix4();
    }
    
    updateProjectionMatrix() {
        const dx = (this.rightOffset - this.leftOffset) / (2 * this.zoom);
        const dy = (this.topOffset - this.bottomOffset) / (2 * this.zoom);
        const cx = (this.rightOffset + this.leftOffset) / 2;
        const cy = (this.topOffset + this.bottomOffset) / 2;

        let left = cx - dx;
        let right = cx + dx;
        let top = cy + dy;
        let bottom = cy - dy;

        this.projectionMatrix.setOrthographic(left, right, bottom, top, this.near, this.far);
    }

    copy(camera: OrthographicCamera) {
        super.copy(camera);
        this.leftOffset = camera.leftOffset;
        this.rightOffset = camera.rightOffset;
        this.bottomOffset = camera.bottomOffset;
        this.topOffset = camera.topOffset;
        this.near = camera.near;
        this.far = camera.far;
        this.zoom = camera.zoom;
        this.updateProjectionMatrix();
        return this;
    }

    clone() {
        return new OrthographicCamera().copy(this);
    }

}