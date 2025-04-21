import { Object3D } from "./Object3D";
import { Fog } from "@/math/Fog";
import { Color } from "@/math/Color";
import { UniformData } from "@/data/UniformData";
import { UniformDataArray } from "@/data/UniformDataArray";
import { DirectionalLight } from "@/lights/DirectionalLight";
import { PointLight } from "@/lights/PointLight";
import { Struct } from "@/data/Struct";
import { TextureCube } from "@/data/TextureCube";
import { Vector2 } from "@/math";
import { Renderer } from "@/renderer";

interface SceneConfig {
    backgroundColor?: Color | string | number;
    ambientColor?: Color | string | number;
    ambientIntensity?: number;
    fog?: {
        start?: number;
        end?: number;
        color?: number | string | Color;
        density?: number;
        type?: number;
    };
    environment?: TextureCube;
}

class Scene extends Object3D {
    static MAX_DIRECTIONAL_LIGHTS = 4;
    static MAX_POINT_LIGHTS = 64;

    static struct = new Struct("Scene", {
        pointLights: [PointLight.struct, Scene.MAX_POINT_LIGHTS],
        directionalLights: [
            DirectionalLight.struct,
            Scene.MAX_DIRECTIONAL_LIGHTS,
        ],
        fog: Fog.struct,
        ambient: "vec4f",
        background: "vec4f",
        resolution: "vec2f",
        time: "f32",

        directionalLightsNum: "u32",
        pointLightsNum: "u32",
        frame: "u32",
    });
    public readonly isScene: boolean;
    public name: string;
    public type: string;
    public cameras: Object3D[];
    public meshes: Object3D[];
    public camera?: Object3D;
    public lights: Object3D[];
    public instances: Map<unknown, unknown>;

    public ambient!: Color;
    public background!: Color;
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
    resolution: Vector2;

    constructor(config: SceneConfig = {}) {
        super();
        this.isScene = true;
        this.name = "Scene";
        this.type = "scene";
        this.cameras = [];
        this.meshes = [];
        this.lights = [];
        this.resolution = new Vector2(0, 0);
        this.instances = new Map();

        const background = new Color(config.backgroundColor || "#000000");
        const ambient = new Color(config.ambientColor || "#000000");
        const environment = config.environment ?? TextureCube.DEFAULT;

        if (typeof config.ambientIntensity === "number") {
            ambient.a = config.ambientIntensity;
        }

        const directionalLights = new UniformDataArray(
            DirectionalLight.struct,
            Scene.MAX_DIRECTIONAL_LIGHTS,
        ).onChange(() => (this.directionalLightsNum = directionalLights.size));

        const pointLights = new UniformDataArray(
            PointLight.struct,
            Scene.MAX_POINT_LIGHTS,
        ).onChange(() => (this.pointLightsNum = pointLights.size));

        const fog = new Fog({
            color:
                config.fog?.color === undefined
                    ? new Color(background)
                    : new Color(config.fog.color),
            start: config.fog?.start || 500,
            end: config.fog?.end || 1000,
            density: config.fog?.density || 0.00025,
            type: config.fog?.type || Fog.LINEAR,
        });

        this.uniforms.set(
            "Scene",
            new UniformData(this, {
                name: "Scene",
                isGlobal: true,
                struct: Scene.struct,
                values: {
                    fog,
                    ambient,
                    background,
                    resolution: this.resolution,
                    time: 0,
                    frame: 0,
                    directionalLightsNum: 0,
                    pointLightsNum: 0,
                    directionalLights,
                    pointLights,
                    environment,
                },
            }),
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
            this.directionalLights.add(
                (light as DirectionalLight).uniforms.get(
                    "DirectionalLight",
                ) as UniformData,
            );
        }
        if (light.isPointLight) {
            this.pointLights.add(
                (light as PointLight).uniforms.get("PointLight") as UniformData,
            );
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
                this.directionalLights.remove(
                    (object as DirectionalLight).uniforms.get(
                        "DirectionalLight",
                    ) as UniformData,
                );
            }
            if (object.isPointLight) {
                this.pointLights.remove(
                    (object as PointLight).uniforms.get(
                        "PointLight",
                    ) as UniformData,
                );
            }
            const i = this.lights.indexOf(object);
            if (i >= 0) this.lights.splice(i, 1);
        }
        if (object.isCamera) {
            this.camera = undefined;
        }
        return this;
    }

    update(renderer: Renderer) {
        const now = performance.now();
        this._time += (now - this._last) / 1000;
        this._last = now;
        this._frame++;
        this.resolution.set(renderer.width, renderer.height);

        this.time = this._time;
        this.frame = this._frame;
    }
}

export { Scene };
