import { Component } from '../core/Component';
import { Light as BaseLight } from '@/lights/Light';
import { PointLight as BasePointLight } from '@/lights/PointLight';

interface LightAnimation {
   type: 'circular' | 'rotate';
   speed: number;
   mode: 'path' | 'self';
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
        const lightData = data;
        if (lightData) {
            if (lightData.color) {
                this.light.color.setHex(lightData.color);
            }
            if (lightData.intensity !== undefined) {
                this.light.intensity = lightData.intensity;
            }
            if (lightData.animation) {
                this.animation = lightData.animation;
            }
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
        const lightData = data;
        if (lightData) {
            if (lightData.color) {
                this.light.color.setHex(lightData.color); 
            }
            if (lightData.intensity !== undefined) {
                this.light.intensity = lightData.intensity;
            }
            if (lightData.range !== undefined) {
                this.light.range = lightData.range;
            }
            if (lightData.animation) {
                this.animation = lightData.animation;
            }
        }
 
        const transformData = data.components?.TransformComponent;
        if (transformData?.position) {
            this.light.position.setXYZ(
                transformData.position.x || 0,
                transformData.position.y || 0,
                transformData.position.z || 0
            );
        }
    }
 }