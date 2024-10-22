import { Vector3 }  from '../math/Vector3';
import { Matrix4 } from '../math/Matrix4';
import { Camera } from './Camera';
import { DEG2RAD } from '../math/MathUtils';

class PerspectiveCamera extends Camera {
    constructor(fov = 45, aspect = 1, near = 0.1, far = 1000) {
        super();
        this.isPerspectiveCamera = true;
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
        this.projectionMatrix.perspective(this.fov * DEG2RAD, this.aspect, this.near, this.far);
        this._data.set(this.projectionMatrix.data, 0);
        this.projectionViewMatrix.multiplyMatrices(this.projectionMatrix, this.viewMatrix);
        this.updateFrustum();
        this.emit('write', { data: this.projectionMatrix.data, name: 'camera' });
    }
    
}

export { PerspectiveCamera };