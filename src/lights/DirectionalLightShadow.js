import { LightShadow } from './LightShadow.js';
import { OrthographicCamera } from '../cameras/OrthographicCamera.js';
import { Vector3 } from '../math/Vector3.js';

class DirectionalLightShadow extends LightShadow {

	constructor() {

		super( new OrthographicCamera( -50, 50, -50, 50, -50, 100) );

		this.isDirectionalLightShadow = true;

	}
	
	updateMatrices( light, aspect ) {
			// directional light does not move, it only rotates
			// so we need to update the camera's view to look at the light direction
			const shadowCamera = this.camera;
			if (aspect && aspect !== shadowCamera.aspect) {
				shadowCamera.aspect = aspect;
				shadowCamera.updateProjectionMatrix();
			}

		  // Calculate the light's direction
		  const lightDirection = light.direction.clone();
	  
		  // Set the shadow camera's position and orientation
		  const shadowCameraPosition = new Vector3();
		  shadowCameraPosition.copy(light.position);
	  
		  const shadowCameraTarget = new Vector3();
		  shadowCameraTarget.copy(lightDirection).mulScalar(-1).add(shadowCameraPosition);
	  
		  shadowCamera.position.copy(shadowCameraPosition);
		  shadowCamera.target.copy(shadowCameraTarget);
	  
		  // Update the shadow camera's view matrix
		  shadowCamera.updateMatrixWorld();
		shadowCamera
		  this.projectionViewMatrix.multiplyMatrices(shadowCamera.projectionMatrix, shadowCamera.viewMatrix);
	}

}

export { DirectionalLightShadow };