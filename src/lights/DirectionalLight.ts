import { Light, LightOptions } from './Light';
import { Vector3 } from '@/math/Vector3';
import { UniformData } from '@/data/UniformData';
import { align4 } from '@/util';


export interface DirectionalLightOptions extends LightOptions {
    direction?: Vector3;
}

class DirectionalLight extends Light {
    public uniforms: UniformData;
    static uniformSize = align4(4 + 3 + 1);

    constructor(options: DirectionalLightOptions = {}) {
        super(options);
        this.isDirectionalLight = true;

        this.uniforms = new UniformData(this, {
            name: 'directional_light',
            isGlobal: false,
            values: {
                color: this.color,
                direction: this.forward,
                intensity: this.intensity,
            }
        });
    }


}

export { DirectionalLight };