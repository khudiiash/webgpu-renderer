import { Light, LightOptions } from './Light';
import { UniformData } from '@/data/UniformData';
import { align4 } from '@/util';

export interface PointLightOptions extends LightOptions {
    range?: number; 
}

class PointLight extends Light {
    public uniforms: UniformData;
    public attenuation: number;
    public range: number;
    static uniformSize = align4(4 + 3 + 1 + 1);

    constructor(options: PointLightOptions = {}) {
        super(options);
        this.isPointLight = true;
        this.attenuation = this.calculateAttenuation();
        this.range = options.range ?? 10;

        this.uniforms = new UniformData(this, {
            name: 'point_light',
            isGlobal: false,
            values: {
                color: this.color, // 4
                position: this.position, // 4
                intensity: this.intensity, // 1
                range: this.range, // 1
            }
        })
    }

    private calculateAttenuation(): number {
        // Inverse square law: light intensity decreases with square of distance
        // At range distance, light should be 1% of original intensity
        this.attenuation = -Math.log(0.01) / (this.range * this.range);
        return this.attenuation;
    }
}

export { PointLight };