import { Component } from '../core/Component';
import { Scene as BaseScene } from '@/core/Scene';
import { Object3D } from '@/core/Object3D';
import { World } from '../core/World';
import { Model } from './Model';
import { PointLightComponent } from './PointLightComponent';
import { Mesh } from '@/core/Mesh';

export class SceneComponent extends Component {
   public scene: BaseScene;

   constructor() {
       super();
       this.scene = new BaseScene();
   }
   
   attachToWorld(world: World) {
    for (const entity of world.getEntities()) {
        // Handle Model components
        const model = entity.get(Model);

        if (model.object) {
            this.scene.add(model.object);
        }

        // Handle Light components
        const light = entity.get(PointLightComponent);
        if (light) {
            this.scene.add(light.light);
        }
    }
}

   async deserialize(data: any) {
       if (data.background) {
           this.scene.backgroundColor.setHex(data.background);
       }
       if (data.ambient) {
           this.scene.ambientColor.set(data.ambient);
       }
       if (data.fog) {
           if (data.fog.color) {
               this.scene.fog.color.setHex(data.fog.color);
           }
           if (data.fog.start !== undefined) {
               this.scene.fog.start = data.fog.start;
           }
           if (data.fog.end !== undefined) {
               this.scene.fog.end = data.fog.end;
           }
       }
   }
}