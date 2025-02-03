import { Struct } from '@/data/Struct';
import { Light, LightOptions } from './Light';
import { UniformData } from '@/data/UniformData';

export interface PointLightOptions extends LightOptions {
    range?: number; 
}

class PointLight extends Light {
    public range: number;

    static struct = new Struct('PointLight', {
        color: 'vec4f',
        position: 'vec3f',
        intensity: 'f32',
        range: 'f32',
    })


    constructor(options: PointLightOptions = {}) {
        super(options);
        this.isPointLight = true;
        this.range = options.range ?? 10;

        this.uniforms.set('PointLight', new UniformData(this, {
                isGlobal: false,
                name: 'PointLight',
                struct: PointLight.struct,
                values: {
                    color: this.color,
                    position: this.position,
                    intensity: this.intensity,
                    range: this.range,
                }
            })
        );
    }
}

export { PointLight };