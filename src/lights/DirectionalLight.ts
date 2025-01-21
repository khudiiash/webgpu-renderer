import { Light, LightOptions } from './Light';
import { Vector3 } from '@/math/Vector3';
import { UniformData } from '@/data/UniformData';
import { Struct } from '@/data/Struct';


export interface DirectionalLightOptions extends LightOptions {
    direction?: Vector3;
}


class DirectionalLight extends Light {
    public isDirectionalLight: boolean = true;

    static struct = new Struct('DirectionalLight', {
        color: 'vec4f',
        direction: 'vec3f',
        intensity: 'f32',
    })

    constructor(options: DirectionalLightOptions = {}) {
        super(options);
        this.uniforms.set('DirectionalLight', new UniformData(this, {
                name: 'DirectionalLight',
                isGlobal: false,
                struct: DirectionalLight.struct,
                values: {
                    color: this.color,
                    direction: this.forward,
                    intensity: this.intensity,
                }
            })
        );
    }
}

export { DirectionalLight };