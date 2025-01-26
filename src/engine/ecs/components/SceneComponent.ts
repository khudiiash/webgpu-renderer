import { Component } from '../core/Component';
import { Scene as BaseScene } from '@/core/Scene';
import { Object3D } from '@/core/Object3D';
import { World } from '../core/World';
import { ModelComponent } from './ModelComponent';
import { PointLightComponent } from './PointLightComponent';
import { Mesh } from '@/core/Mesh';

export class SceneComponent extends Component {
   public scene: BaseScene;

   constructor() {
       super();
       this.scene = new BaseScene();
   }
   
   attachToWorld(world: World) {
        console.log('All entities:', world.getEntities());
        console.log('Entities with ModelComponent:', 
        
        world.getEntities().filter(e => e.has(ModelComponent)));

        for (const entity of world.getEntities()) {
            const model = entity.get(ModelComponent);
            console.log('Processing entity model:', model?.object);
            if (model?.object) {
                this.scene.add(model.object);
            }
        }
        
        console.log('Scene after adding meshes:', this.scene);
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