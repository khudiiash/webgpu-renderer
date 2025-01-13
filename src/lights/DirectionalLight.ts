import { Light, LightOptions } from './Light';
import { Vector3 } from '@/math/Vector3';
import { UniformData } from '@/data/UniformData';
import { align4 } from '@/util';


export interface DirectionalLightOptions extends LightOptions {
    direction?: Vector3;
}

class DirectionalLight extends Light {
    public uniforms: UniformData;
    public direction: Vector3;
    static uniformSize = align4(4 + 3 + 1);

    constructor(options: DirectionalLightOptions = {}) {
        super(options);
        this.isDirectionalLight = true;
        this.direction = options.direction ?? new Vector3(0, -1, 0);

        this.uniforms = new UniformData(this, {
            name: 'directional_light',
            isGlobal: false,
            values: {
                color: this.color,
                direction: this.direction,
                intensity: this.intensity,
            }
        });
    }


}

export { DirectionalLight };