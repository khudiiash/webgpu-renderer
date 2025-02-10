import { Object3D } from "./Object3D";
import { Fog } from '@/math/Fog';
import { Color } from '@/math/Color';
import { UniformData } from '@/data/UniformData';
import { UniformDataArray } from '@/data/UniformDataArray';
import { DirectionalLight } from "@/lights/DirectionalLight";
import { PointLight } from "@/lights/PointLight";
import { Struct } from "@/data/Struct";

interface SceneConfig {
    backgroundColor?: Color | string | number;
    ambientColor?: Color | string | number;
    groundColor?: Color | string | number;
    skyColor?: Color | string | number;
    indirectIntensity?: number;
    ambientIntensity?: number;
    fog?: { start?: number, end?: number, color?: number | string | Color, density?: number, type?: number };
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
        groundColor: 'vec4f',
        skyColor: 'vec4f',
        indirectIntensity: 'f32',
        time: 'f32',

        directionalLightsNum: 'u32',
        pointLightsNum: 'u32',
        frame: 'u32',
    })
    public readonly isScene: boolean;
    public name: string;
    public type: string;
    public cameras: Object3D[];
    public meshes: Object3D[];
    public camera?: Object3D;
    public lights: Object3D[];
    public instances: Map<unknown, unknown>;

    public ambientColor!: Color;
    public backgroundColor!: Color;
    public groundColor!: Color;
    public skyColor!: Color;
    public indirectIntensity: number = 1.0;
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

        const backgroundColor = new Color(config.backgroundColor || '#000000');
        const ambientColor = new Color(config.ambientColor || '#000000');
        const groundColor = new Color(config.groundColor || '#000000');
        const skyColor = new Color(config.skyColor || '#000000');

        if (config.ambientIntensity) {
            ambientColor.a = config.ambientIntensity;
        }

        const directionalLights = new UniformDataArray(DirectionalLight.struct, Scene.MAX_DIRECTIONAL_LIGHTS)
            .onChange(() => this.directionalLightsNum = directionalLights.size);
        
        const pointLights = new UniformDataArray(PointLight.struct, Scene.MAX_POINT_LIGHTS)
            .onChange(() => this.pointLightsNum = pointLights.size );


        const fog = new Fog({
            color: config.fog?.color ? new Color(config.fog.color) : new Color(backgroundColor),
            start: config.fog?.start || 500,
            end: config.fog?.end || 1000,
            density: config.fog?.density || 0.00025,
            type: config.fog?.type || Fog.LINEAR
        });

        this.uniforms.set('Scene', new UniformData(this, {
                name: 'Scene',
                isGlobal: true,
                struct: Scene.struct,
                values: {
                    fog,
                    ambientColor,
                    backgroundColor,
                    groundColor,
                    skyColor,
                    indirectIntensity: config.indirectIntensity || 1.0,
                    time: 0,
                    frame: 0,
                    directionalLightsNum: 0,
                    pointLightsNum: 0,
                    directionalLights,
                    pointLights,
                }
            })
        );
    }

    public add(object: Object3D): this {
        super.add(object);
        object.scene = this;

        if (object.isMesh) {
            this.meshes.push(object);
        }

        if (object.isLight) {
            this.addLight(object);
        }

        if (object.isCamera) {
            this.camera = object;
        }
        return this;
    }

    public addLight(light: Object3D): this {
        if (light.isDirectionalLight) {
            this.directionalLights.add((light as DirectionalLight).uniforms.get('DirectionalLight') as UniformData);
        }
        if (light.isPointLight) {
            this.pointLights.add((light as PointLight).uniforms.get('PointLight') as UniformData);
        }
        return this;
    }

    public remove(object: Object3D): this {
        super.remove(object);

        if (object.isMesh) {
            const i = this.meshes.indexOf(object);
            if (i >= 0) this.meshes.splice(i, 1);
        }
        if (object.isLight) {
            if (object.isDirectionalLight) {
                this.directionalLights.remove((object as DirectionalLight).uniforms.get('DirectionalLight') as UniformData);
            }
            if (object.isPointLight) {
                this.pointLights.remove((object as PointLight).uniforms.get('PointLight') as UniformData);
            }
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
        this._frame++;

        this.time = this._time;
        this.frame = this._frame; 
    }
}

export { Scene };