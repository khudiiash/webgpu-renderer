import { LightShadow } from './LightShadow.js';
import { OrthographicCamera } from '../cameras/OrthographicCamera.js';
import { Vector3 } from '../math/Vector3.js';

class DirectionalLightShadow extends LightShadow {

	constructor() {
		super( new OrthographicCamera( -100, 100, -100, 100, -100, 200) );

		this.isDirectionalLightShadow = true;
	}
	
	updateMatrices( light, aspect ) {
		const shadowCamera = this.camera;
		if (aspect && aspect !== shadowCamera.aspect) {
			shadowCamera.aspect = aspect;
			shadowCamera.updateProjectionMatrix();
		}
		
	  	const lightDirection = light.direction;
	  	const shadowCameraTarget = new Vector3();
	  	shadowCameraTarget.copy(lightDirection).mulScalar(-1);
	  	shadowCamera.target.copy(shadowCameraTarget);
  
	  	shadowCamera.updateMatrixWorld();
	  	this.projectionViewMatrix.multiplyMatrices(shadowCamera.projectionMatrix, shadowCamera.viewMatrix);
	}

}

export { DirectionalLightShadow };