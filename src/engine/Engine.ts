import { Renderer } from '@/renderer';
import { EngineSettings, EngineDefaultSettings, EngineSettingsConfig } from '../settings';
import { ShaderLibrary } from '../materials/shaders';
import { GLTFLoader, TextureLoader } from '../util/loader';
import { BoxGeometry } from '@/geometry/BoxGeometry';
import { StandardMaterial } from '@/materials/StandardMaterial';
import { Mesh } from '@/core/Mesh';
import { Scene } from '@/core';
import { UniformData } from '@/data';
import { Color } from '@/math';

export class Engine {
    private settings: EngineSettings
    static device: GPUDevice;


    constructor(settings: EngineSettingsConfig = {}) {
        this.settings = { ...EngineDefaultSettings, ...settings };
    }

    public getOrCreateCanvas(): HTMLCanvasElement {
        let canvas;
        if (this.settings.canvas) {
            canvas = this.settings.canvas;
            canvas.width = this.settings.width;
            canvas.height = this.settings.height;
        } else {
            canvas = document.createElement('canvas');
            canvas.width = this.settings.width;
            canvas.height = this.settings.height;
            document.body.appendChild(canvas);
        }
        return canvas;
    }

    async init() {
        const renderer = await new Renderer(this.getOrCreateCanvas()).init();
        Engine.device = renderer.device;
        ShaderLibrary.init();
        TextureLoader.init(Engine.device);
        GLTFLoader.init(Engine.device);
        const scene = new Scene();

        scene.uniforms.onChange((id, name, value) => {
            console.log(name, value);
        });

        scene.ambientColor.r = 0.44;
        scene.ambientColor = new Color('#ff0000');
        console.log(scene.ambientColor);

        return this;
    }
}