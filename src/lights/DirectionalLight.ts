import { Light, LightOptions } from "./Light";
import { Vector3 } from "@/math/Vector3";
import { UniformData } from "@/data/UniformData";
import { Struct } from "@/data/Struct";
import { OrthographicCamera } from "@/camera/OrthographicCamera";
import { Matrix4 } from "@/math/Matrix4";

export interface DirectionalLightOptions extends LightOptions {
  direction?: Vector3;
  castShadow?: boolean;
}

class DirectionalLight extends Light {
  public isDirectionalLight: boolean = true;
  view_projection!: Matrix4;

  static struct = new Struct("DirectionalLight", {
    view_projection: "mat4x4f",
    color: "vec4f",
    direction: "vec3f",
    intensity: "f32",
  });

  shadowCamera: OrthographicCamera;
  distance: number;
    center: Vector3;

  constructor(options: DirectionalLightOptions = {}) {
    super(options);
    this.shadowCamera = new OrthographicCamera();
    this.distance = 0;
    this.center = options.center ?? Vector3.ZERO;
    this.castShadow = options.castShadow ?? true;

    this.uniforms.set(
      "DirectionalLight",
      new UniformData(this, {
        name: "DirectionalLight",
        isGlobal: false,
        struct: DirectionalLight.struct,
        values: {
          view_projection: this.shadowCamera.matrixViewProjection,
          color: this.color,
          direction: this.forward,
          intensity: this.intensity,
        },
      }),
    );
  }

  updateMatrixWorld(fromParent?: boolean): void {
    super.updateMatrixWorld(fromParent);
    const shadowCamera = this.shadowCamera;
    const distance = this.position.magnitude();
    // make sure light is looking at the center of the scene
    const m = Matrix4.instance.lookAt(this.position, this.center, Vector3.UP);
    this.quaternion.setFromRotationMatrix(m);


      if (this.distance !== distance) {
        this.distance = distance; // Store the current distance for comparison next time

        // Scale the shadow camera's orthographic frustum based on distance
        // Using larger values for far-away lights and smaller values for close lights
        const frustumSize = distance * 2; // Scale frustum with distance

        shadowCamera.leftOffset = -frustumSize;
        shadowCamera.rightOffset = frustumSize;
        shadowCamera.bottomOffset = -frustumSize;
        shadowCamera.topOffset = frustumSize;

        // Adjust near and far planes
        // Near plane should be close to the scene when light is far away
        // Far plane should extend beyond the scene in the light direction
        shadowCamera.near = -frustumSize; // Keep a small fixed near value
        shadowCamera.far = frustumSize + frustumSize; // Scale with both distance and frustum size

        shadowCamera.updateProjectionMatrix();
      }

      // Position and orient the shadow camera
      shadowCamera.setPosition(this.position);
      shadowCamera.lookAt(this.center);

      // Update the view-projection matrix
      this.view_projection.copy(shadowCamera.matrixViewProjection);
  }
}

export { DirectionalLight };
