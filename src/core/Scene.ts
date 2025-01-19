import { Object3D } from "./Object3D";
import { Fog } from '@/math/Fog';
import { Color } from '@/math/Color';
import { UniformData } from '@/data/UniformData';
import { UniformDataArray } from '@/data/UniformDataArray';
import { DirectionalLight } from "@/lights/DirectionalLight";
import { PointLight } from "@/lights/PointLight";
import { Struct } from "@/data/Struct";

interface SceneConfig {
    backgroundColor?: string;
    ambientColor?: string;
}

class Scene extends Object3D {
    static MAX_DIRECTIONAL_LIGHTS = 4;
    static MAX_POINT_LIGHTS = 64;

    static struct = new Struct('Scene', {
        pointLights: [PointLight.struct, Scene.MAX_POINT_LIGHTS],
        directionalLights: [DirectionalLight.struct, Scene.MAX_DIRECTIONAL_LIGHTS],
        fog: Fog.struct,
        ambientColor: 'vec4f',
        backgroundColor: 'vec4f',
        directionalLightsNum: 'u32',
        pointLightsNum: 'u32',
        time: 'f32',
    })
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

    private _time: number = 0;
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

        const directionalLights = new UniformDataArray(DirectionalLight.struct, Scene.MAX_DIRECTIONAL_LIGHTS)
            .onChange(() => this.directionalLightsNum = directionalLights.size);
        
        const pointLights = new UniformDataArray(PointLight.struct, Scene.MAX_POINT_LIGHTS)
            .onChange(() => this.pointLightsNum = pointLights.size );


        const fog = new Fog({
            color: backgroundColor,
            start: 500, 
            end: 1000,
            density: 0.01,
            type: Fog.LINEAR
        });

        this.uniforms = new UniformData(this, {
            name: 'scene',
            isGlobal: true,
            struct: Scene.struct,
            values: {
                fog,
                ambientColor,
                backgroundColor,
                time: 0,
                directionalLightsNum: 0,
                pointLightsNum: 0,
                directionalLights,
                pointLights
            }
        })
    }

    public add(object: Object3D): this {
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
        return this;
    }

    public remove(object: Object3D): this {
        if (!(object instanceof Object3D)) {
            console.error('Scene.remove: object not an instance of Object3D.', object);
            return this;
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
        return this;
    }

    update() {
        const now = performance.now();
        this._time += (now - this._last) / 1000;
        this._last = now;

        this.time = this._time;
    }
}

export { Scene };