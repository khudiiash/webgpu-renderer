import { Light, LightOptions } from "./Light";
import { Vector3 } from "@/math/Vector3";
import { UniformData } from "@/data/UniformData";
import { Struct } from "@/data/Struct";
import { OrthographicCamera } from "@/camera/OrthographicCamera";
import { Matrix4 } from "@/math/Matrix4";

export interface DirectionalLightOptions extends LightOptions {
  direction?: Vector3;
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

  constructor(options: DirectionalLightOptions = {}) {
    super(options);
    this.shadowCamera = new OrthographicCamera();
    this.distance = 0;

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
    if (this.distance !== distance) {
      shadowCamera.leftOffset = -distance;
      shadowCamera.rightOffset = distance;
      shadowCamera.bottomOffset = -distance;
      shadowCamera.topOffset = distance;
      shadowCamera.far = distance * 1000;
      shadowCamera.near = -distance * 0.001;
      shadowCamera.updateProjectionMatrix();
    }
    shadowCamera.setPosition(this.position);
    shadowCamera.lookAt(0, 0, 0);
    this.view_projection.copy(shadowCamera.matrixViewProjection);
  }
}

export { DirectionalLight };
