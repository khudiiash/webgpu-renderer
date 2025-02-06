import { Struct } from '@/data/Struct';
import { Light, LightOptions } from './Light';
import { UniformData } from '@/data/UniformData';

export interface PointLightOptions extends LightOptions {
    decay?: number;
}

class PointLight extends Light {
    public decay: number;

    static struct = new Struct('PointLight', {
        color: 'vec4f',
        position: 'vec3f',
        intensity: 'f32',
        decay: 'f32',
    })


    constructor(options: PointLightOptions = {}) {
        super(options);
        this.isPointLight = true;
        this.decay = options.decay ?? 0.0;

        this.uniforms.set('PointLight', new UniformData(this, {
                isGlobal: false,
                name: 'PointLight',
                struct: PointLight.struct,
                values: {
                    color: this.color,
                    position: this.position,
                    intensity: this.intensity,
                    decay: this.decay,
                }
            })
        );
    }
}

export { PointLight };