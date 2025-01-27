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
        
        
            if (model?.object) {
                //console.log('Adding object:', model.object);

                // Apply transform if it exists
                if (transform) {
                    model.object.position.copy(transform.position);
                    model.object.scale.copy(transform.scale);
                    model.object.rotation.copy(transform.rotation);
                }
                this.scene.add(model.object);

                // Verify object was added
                //console.log('Scene meshes after add:', this.scene.meshes);
            }

            
            
            const pointLight = entity.get(PointLightComponent);
            if (pointLight?.light) {
                //console.log('Adding light:', pointLight.light);
                this.scene.add(pointLight.light);
                //console.log('Scene lights after add:', this.scene.lights);
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