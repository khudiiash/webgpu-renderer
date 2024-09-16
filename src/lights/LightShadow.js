import { Matrix4 } from '../math/Matrix4.js';
import { Vector3 } from '../math/Vector3.js';
import { Vector2 } from '../math/Vector2.js';

class LightShadow {
    constructor(camera) {
        this.camera = camera;
        this.bias = 0;
        this.radius = 1;
        this.mapSize = 2048;
        this.blurSamples = 8;
        this.map = null;
        this.mapPass = null;
        this.autoUpdate = true;
        this.needsUpdate = false;
        this.matrix = new Matrix4();
        this.projectionViewMatrix = new Matrix4();
        this.projectionMatrixInverse = new Matrix4();
        this.camera.updateProjectionMatrix();
    } 
    
    updateMatrices( light, aspect ) {
		const shadowCamera = this.camera;
        if (aspect && aspect !== shadowCamera.aspect) {
            shadowCamera.aspect = aspect;
            shadowCamera.updateProjectionMatrix();
        }
        // 
        if (light.matrixWorld.needsUpdate) {
            shadowCamera.position.copy( light.position );
            shadowCamera.updateWorldMatrix(true, false);
            shadowCamera.updateViewMatrix();
        } 

        this.projectionViewMatrix.multiplyMatrices(shadowCamera.projectionMatrix, shadowCamera.viewMatrix);
	}
    

}

export { LightShadow };