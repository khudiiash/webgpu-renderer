import { Component } from '../core/Component';
import { Scene as BaseScene } from '@/core/Scene';
import { World } from '../core/World';
import { ModelComponent } from './ModelComponent';
import { PointLightComponent } from './PointLightComponent';
import { TransformComponent } from './TransformComponent';

export class SceneComponent extends Component {
   public scene: BaseScene;

   constructor() {
       super();
       this.scene = new BaseScene();
   }
   
   attachToWorld(world: World) {
        //console.log('Before attaching:', this.scene.meshes.length);
        
        for (const entity of world.getEntities()) {
            const model = entity.get(ModelComponent);
            const transform = entity.get(TransformComponent);
            const pointLight = entity.get(PointLightComponent);
        
        
            // If this entity has both a light and a model, add the model to the light
            if (pointLight && model?.object) {
                pointLight.light.add(model.object);
                if (transform) {
                    model.object.position.copy(transform.position);
                    model.object.scale.copy(transform.scale);
                    model.object.rotation.copy(transform.rotation);
                }
                this.scene.add(pointLight.light);
            } 
            // If it only has a model, add it directly to the scene
            else if (model?.object) {
                if (transform) {
                    model.object.position.copy(transform.position);
                    model.object.scale.copy(transform.scale);
                    model.object.rotation.copy(transform.rotation);
                }
                this.scene.add(model.object);
            }
            // If it only has a light, add it to the scene
            else if (pointLight) {
                this.scene.add(pointLight.light);
            }
        }
        
        /*console.log('After attaching all:',
            'Meshes:', this.scene.meshes.length,
            'Lights:', this.scene.lights.length
        );*/
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