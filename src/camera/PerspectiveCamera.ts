import { Vector3 }  from '../math/Vector3';
import { Camera } from './Camera';
import { DEG2RAD } from '@/util';

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
        this.projectionMatrix.setPerspective(this.fov * DEG2RAD, this.aspect, this.near, this.far);
        console.log(this.projectionMatrix);
        this.projectionViewMatrix.multiplyMatrices(this.projectionMatrix, this.viewMatrix);
        this.updateFrustum();
    }
    
}