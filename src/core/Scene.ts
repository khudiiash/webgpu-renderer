import { Object3D } from "./Object3D";
import { Fog } from '@/math/Fog';
import { Color } from '@/math/Color';
import { UniformData } from '@/data/UniformData';
import { UniformDataArray } from '@/data/UniformDataArray';

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

        const directionalLights = new UniformDataArray(8, 8).onChange(() => {
            this.directionalLightsNum, directionalLights.size;
        });
        const pointLights = new UniformDataArray(8, 8).onChange(() => {
            this.pointLightsNum = pointLights.size;
        });

        const fog = new Fog({
            color: backgroundColor,
            start: 10,
            end: 50,
            density: 0.01,
            type: Fog.LINEAR
        });

        this.uniforms = new UniformData(this, {
            name: 'scene',
            isGlobal: true,
            values: {
                fog,
                ambientColor,
                backgroundColor,
                time: 0,
                frame: 0,
                directionalLightsNum: 0,
                pointLightsNum: 0,
                directionalLights,
                pointLights
            }
        });
    }

    public add(object: Object3D): void {
        if (!(object instanceof Object3D)) {
            console.error('Scene.add: object not an instance of Object3D.', object);
            return;
        }

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
}

export { Scene };