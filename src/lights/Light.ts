import { Object3D } from "@/core/Object3D";
import { Color } from "@/math";

export type LightOptions = {
    color?: number | string | Color;
    intensity?: number;
}

export class Light extends Object3D {
    public isDirectionalLight: boolean = false;
    public isPointLight: boolean = false;
    public isSpotLight: boolean = false;

    public color: Color;
    public intensity: number = 1;

    constructor(options: LightOptions = {}) {
        super();
        this.isLight = true;
        this.color = new Color(options.color || 0xffffff);
        this.intensity = options.intensity ?? this.intensity;
    }
}