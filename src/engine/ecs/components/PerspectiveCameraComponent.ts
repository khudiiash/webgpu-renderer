import { Component } from '../core/Component';
import { PerspectiveCamera } from '@/camera/PerspectiveCamera';
import { Vector3 } from '@/math/Vector3';

interface CameraAnimation {
   type: 'circular' | 'linear';
   speed: number;
   radius?: number;
   axis?: 'x' | 'y' | 'z';
}

export class PerspectiveCameraComponent extends Component {
   public camera: PerspectiveCamera;
   public animation?: CameraAnimation;

   constructor() {
       super();
       this.camera = new PerspectiveCamera();
   }

   async deserialize(data: any) {
        const cameraData = data.components?.PerspectiveCameraComponent;
        const transformData = data.components?.TransformComponent;

        if (cameraData) {
            if (cameraData.fov) this.camera.fov = cameraData.fov;
            if (cameraData.near) this.camera.near = cameraData.near;
            if (cameraData.far) this.camera.far = cameraData.far;
            if (cameraData.lookAt) {
                this.camera.lookAt(new Vector3(cameraData.lookAt[0], cameraData.lookAt[1], cameraData.lookAt[2]));
            }
            if (cameraData.animation) {
                this.animation = cameraData.animation;
            }
        }

        if (transformData?.position) {
            this.camera.position.setXYZ(
                transformData.position.x || 0,
                transformData.position.y || 0,
                transformData.position.z || 0
            );
        }

        this.camera.updateProjectionMatrix();
    }
}