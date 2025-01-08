import { Renderer, Renderable } from '@/renderer';
import { EngineSettings, EngineDefaultSettings, EngineSettingsConfig } from '../settings';
import { ShaderLibrary, StandardMaterial } from '@/materials';
import { GLTFLoader, TextureLoader } from '@/util/loader';
import { BoxGeometry } from '@/geometry';
import { Mesh, Scene } from '@/core';
import { PipelineManager } from './PipelineManager';
import { ResourceManager } from './ResourceManager';
import { PerspectiveCamera } from '@/camera';

export class Engine {
    static #instance: Engine;

    public settings: EngineSettings = { ...EngineDefaultSettings };
    public device!: GPUDevice;


    static get settings() { return Engine.#instance?.settings || { ...EngineDefaultSettings }; }
    static get device() { return Engine.#instance?.device; }
    
    static getInstance(settings: EngineSettingsConfig = {}) {
        if (!Engine.#instance) {
            Engine.#instance = new Engine(settings);
        }
        return Engine.#instance
    }


    constructor(settings: EngineSettingsConfig = {}) {
        if (Engine.#instance) {
            return Engine.#instance;
        }
        Engine.#instance = this;
        this.settings = { ...EngineDefaultSettings, ...settings };
        if (this.settings.fullscreen) {
            this.settings.width = window.innerWidth;
            this.settings.height = window.innerHeight;
        }
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
        this.settings.canvas = canvas;
        return canvas;
    }

    async init() {
        const renderer = await new Renderer(this.getOrCreateCanvas()).init();
        this.device = renderer.device;
        ShaderLibrary.init();
        TextureLoader.init(Engine.device);
        GLTFLoader.init(Engine.device);
        PipelineManager.init(Engine.device);
        ResourceManager.init(Engine.device);

        renderer.setResources(ResourceManager.getInstance());

        const scene = new Scene();
        const camera = new PerspectiveCamera(45, this.settings.width / this.settings.height, 0.1, 1000);
        const mesh = new Mesh(new BoxGeometry(1, 1, 1), new StandardMaterial());
        scene.add(mesh);
        scene.add(camera);
        camera.position.z = 5;

        let last = performance.now();
        let elapsed = 0;
        const loop = () => {
            const now = performance.now();
            const delta = (now - last) / 1000;
            last = now;
            elapsed += delta;
            mesh.position.y = Math.sin(elapsed)
            renderer.render(scene, camera);
            requestAnimationFrame(loop);
        }

        requestAnimationFrame(loop);

        return this;
    }

    public start() {

    }
}