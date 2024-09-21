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
        this._shadowIntensity = 1;
        this._shadowBias = 0.1;
        this._shadowNormalBias = 0;
        this._shadowRadius = 1;
        this.camera.isShadowCamera = true;

        this._data = new Float32Array([
            this._shadowIntensity,
            this._shadowBias,
            this._shadowNormalBias,
            this._shadowRadius
        ]);
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
    
    get data() {
        return this._data;
    }
    

}

export { LightShadow };