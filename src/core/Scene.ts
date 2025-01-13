import { Object3D } from "./Object3D";
import { Fog } from '@/math/Fog';
import { Color } from '@/math/Color';
import { UniformData } from '@/data/UniformData';
import { UniformDataArray } from '@/data/UniformDataArray';
import { DirectionalLight } from "@/lights/DirectionalLight";
import { PointLight } from "@/lights/PointLight";

interface SceneConfig {
    backgroundColor?: string;
    ambientColor?: string;
}

class Scene extends Object3D {
    public readonly isScene: boolean;
    public name: string;
    public type: string;
    public cameras: Object3D[];
    public meshes: Object3D[];
    public camera?: Object3D;
    public lights: Object3D[];
    public instances: Map<unknown, unknown>;
    public uniforms: UniformData;


    public ambientColor!: Color;
    public backgroundColor!: Color;
    public pointLights!: UniformDataArray;
    public directionalLights!: UniformDataArray;
    public directionalLightsNum!: number;
    public pointLightsNum!: number;
    public fog!: Fog;
    public time: number = 0;
    public frame: number = 0;

    private _time: number = 0;
    private _frame: number = 0;
    private _last: number = performance.now();

    constructor(config: SceneConfig = {}) {
        super();
        this.isScene = true;
        this.name = 'Scene';
        this.type = 'scene';
        this.cameras = [];
        this.meshes = [];
        this.lights = [];
        this.instances = new Map();

        const backgroundColor = new Color(config.backgroundColor || '#111111');
        const ambientColor = new Color(config.ambientColor || '#111111');
        const MAX_DIRECTIONAL_LIGHTS = 8;
        const MAX_POINT_LIGHTS = 64;

        const directionalLights = new UniformDataArray(
            MAX_DIRECTIONAL_LIGHTS,
            DirectionalLight.uniformSize, 
        ).onChange(() => { 
            if (directionalLights.size !== this.directionalLightsNum) {
                this.directionalLightsNum = directionalLights.size; 
            }
        });

        const pointLights = new UniformDataArray(
            MAX_POINT_LIGHTS,
            PointLight.uniformSize,
        ).onChange(() => { 
            if (pointLights.size !== this.pointLightsNum) {
                this.pointLightsNum = pointLights.size; 
            }
        });

        const fog = new Fog({
            color: backgroundColor,
            start: 500, 
            end: 3000,
            density: 0.01,
            type: Fog.LINEAR
        });

        this.uniforms = new UniformData(this, {
            name: 'scene',
            isGlobal: true,
            values: {
                fog, // offset: 0
                ambientColor, // offset: 8
                backgroundColor, // offset: 12
                time: 0, // offset: 16
                frame: 0, // offset: 17 
                directionalLightsNum: 0, // offset: 24
                pointLightsNum: 0, // offset: 28
                directionalLights,
                pointLights
            }
        })
    }

    public add(object: Object3D): void {
        super.add(object);

        if (object.isMesh) {
            this.meshes.push(object);
        }
        if (object.isLight) {
            if (object.isDirectionalLight) {
                this.directionalLights.add(object.uniforms);
            }
            if (object.isPointLight) {
                this.pointLights.add(object.uniforms);
            }
            this.lights.push(object);
        }
        if (object.isCamera) {
            this.camera = object;
        }
    }

    public remove(object: Object3D): void {
        if (!(object instanceof Object3D)) {
            console.error('Scene.remove: object not an instance of Object3D.', object);
            return;
        }
        super.remove(object);
        if (object.isMesh) {
            const i = this.meshes.indexOf(object);
            if (i >= 0) this.meshes.splice(i, 1);
        }
        if (object.isLight) {
            const i = this.lights.indexOf(object);
            if (i >= 0) this.lights.splice(i, 1);
        }
        if (object.isCamera) {
            this.camera = undefined;
        }
    }

    update() {
        const now = performance.now();
        this._time += (now - this._last) / 1000;
        this._last = now;

        this.time = this._time;
    }
}

export { Scene };