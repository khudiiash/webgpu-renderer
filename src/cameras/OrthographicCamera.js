import { Matrix4 } from '../math/Matrix4.js';
import { Vector3 } from '../math/Vector3.js';
import { Camera } from './Camera.js';

class OrthographicCamera extends Camera {
    constructor(left = -1, right = 1, bottom = -1, top = 1, near = 0.1, far = 1000) {    
        super();
        this.left = left;
        this.right = right;
        this.bottom = bottom;
        this.top = top;
        this.near = near;
        this.far = far;
        this.aspect = 1;
        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();
        this.up = new Vector3(0, 1, 0);
        this.projectionViewMatrix = new Matrix4();
    }
    
    updateProjectionMatrix() {
        this.projectionMatrix.ortho(this.left * this.aspect, this.right * this.aspect, this.bottom, this.top, this.near, this.far);
        this._data.set(this.projectionMatrix.data);
    }
    
    
}

export { OrthographicCamera };