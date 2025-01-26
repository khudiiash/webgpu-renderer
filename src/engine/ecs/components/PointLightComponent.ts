import { Component } from '../core/Component';
import { Light as BaseLight } from '@/lights/Light';
import { PointLight as BasePointLight } from '@/lights/PointLight';

interface LightAnimation {
   type: 'circular' | 'rotate';
   speed: number;
   radius?: number;
   axis?: 'x' | 'y' | 'z';
}

export class LightComponent extends Component {
   public light: BaseLight;
   public animation?: LightAnimation;

   constructor() {
       super();
       this.light = new BaseLight();
   }

   async deserialize(data: any) {
       if (data.color) {
           this.light.color.set(data.color);
       }
       if (data.intensity !== undefined) {
           this.light.intensity = data.intensity;
       }
       if (data.animation) {
           this.animation = data.animation;
       }
   }
}

export class PointLightComponent extends LightComponent {
    declare public light: BasePointLight;
 
    constructor() {
        super();
        this.light = new BasePointLight();
    }
 
    async deserialize(data: any) {
        await super.deserialize(data);
        if (data.range !== undefined) {
            this.light.range = data.range;
        }
    }
 }