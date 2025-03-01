import { Matrix4 } from "../math/Matrix4.js";
import { Vector3 } from "../math/Vector3.js";
import { Vector2 } from "../math/Vector2.js";
import { Events } from "../core/Events.js";

class LightShadow extends Events {
  constructor(camera) {
    super();
  }

  updateMatrices(light, aspect) {
    const shadowCamera = this.camera;
    if (aspect && aspect !== shadowCamera.aspect) {
      shadowCamera.aspect = aspect;
      shadowCamera.updateProjectionMatrix();
    }
    //
    if (light.matrixWorld.needsUpdate) {
      shadowCamera.position.copy(light.position);
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
