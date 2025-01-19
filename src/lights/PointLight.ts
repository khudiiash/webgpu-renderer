import { Struct } from '@/data/Struct';
import { Light, LightOptions } from './Light';
import { UniformData } from '@/data/UniformData';
import { GPUStruct } from '@/types';
import { StructVisualizer } from '@/util/helpers/StructVisualizer';

export interface PointLightOptions extends LightOptions {
    range?: number; 
}


class PointLight extends Light {
    public uniforms: UniformData;
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

        this.uniforms = new UniformData(this, {
            name: 'point_light',
            isGlobal: false,
            struct: PointLight.struct,
            values: {
                color: this.color,
                position: this.position,
                intensity: this.intensity,
                range: this.range,
            }
        })
    }
}

export { PointLight };