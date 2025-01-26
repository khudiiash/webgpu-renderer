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
       if (data.fov) this.camera.fov = data.fov;
       if (data.near) this.camera.near = data.near;
       if (data.far) this.camera.far = data.far;
       if (data.position) {
           this.camera.position.setXYZ(
               data.position.x || 0,
               data.position.y || 0,
               data.position.z || 0
           );
       }
       if (data.target) {
           this.camera.target.setXYZ(
               data.target.x || 0,
               data.target.y || 0,
               data.target.z || 0
           );
       }
       if (data.animation) {
           this.animation = data.animation;
       }
       this.camera.updateProjectionMatrix();
   }
}