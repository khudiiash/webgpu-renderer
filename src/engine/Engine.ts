import { Renderer } from '@/renderer/Renderer';
import { EngineSettings, EngineDefaultSettings, EngineSettingsConfig } from '../settings/EngineSettings';
import { ShaderLibrary } from '@/materials/shaders/ShaderLibrary';
import { StandardMaterial } from '@/materials/StandardMaterial';
import { TextureLoader } from '@/util/loaders/TextureLoader';
import { BoxGeometry } from '@/geometry/BoxGeometry';
//import { Mesh, Scene } from '@/core';
import { Mesh } from '@/core/Mesh';
import { Scene } from '@/core/Scene';
import { PipelineManager } from './PipelineManager';
import { ResourceManager } from './ResourceManager';
import { PerspectiveCamera } from '@/camera/PerspectiveCamera';
import { EventCallback, EventEmitter } from '@/core/EventEmitter';
import { rand } from '@/util';
import { ObjectMonitor } from '@/data/ObjectMonitor';
import { Texture2D } from '@/data/Texture2D';
import { Vector3 } from '@/math';
import { BufferData } from '@/data/BufferData';
import { V } from 'vitest/dist/chunks/reporters.D7Jzd9GS.js';

export class Engine extends EventEmitter {
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

    static on(event: string, listener: EventCallback, context?: any) {
        Engine.#instance?.on(event, listener, context);
    }

    static off(event: string, listener: EventCallback) {
        Engine.#instance?.off(event, listener);
    }

    static fire(event: string, data: any) {
        Engine.#instance?.fire(event, data);
    }


    constructor(settings: EngineSettingsConfig = {}) {
        if (Engine.#instance) {
            return Engine.#instance;
        }
        super();
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
            const fullscreen = this.settings.fullscreen; 
            const width = fullscreen ? '100%' : `${this.settings.width}px`;
            const height = fullscreen ? '100%' : `${this.settings.height}px`;
            canvas = document.createElement('canvas');
            canvas.style.width =  width;
            canvas.style.height = height;
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
        //GLTFLoader.init(Engine.device);
        PipelineManager.init(Engine.device);
        ResourceManager.init(Engine.device);

        renderer.setResources(ResourceManager.getInstance());


        const scene = new Scene();
        scene.backgroundColor.setHex(0x92aabb);
        const camera = new PerspectiveCamera(45, this.settings.width / this.settings.height, 0.1, 500);
        camera.position.setXYZ(2, 30, 20);
        const mesh = new Mesh(new BoxGeometry(1, 1, 1), new StandardMaterial({ 
            diffuse_map: Texture2D.from('assets/textures/grid.jpg'), 
        }), 1_000_000);

        const positions = [];
        const scales = [];
        for (let i = 0; i < mesh.count; i++) {
            const range = 400;
            const x = rand(-range, range);
            const z = rand(-range, range);
            Vector3.instance.setXYZ(x, 0, z);
            const y = -(Vector3.instance.magnitude() * 0.01) + rand(-20, 10);
            positions.push(x, y, z);
            scales.push(rand(0.2, 3), rand(0.5, 30), rand(0.2, 3));
        }
        mesh.setAllPositions(positions);
        mesh.setAllScales(scales);
        mesh.name = 'Box';
        scene.add(mesh);
        scene.add(camera);
        scene.backgroundColor.setHex(0x111111);
        scene.fog.color.setHex(0x111111);

        let last = performance.now();
        let elapsed = 0;

        const loop = () => {
            const now = performance.now();
            const delta = (now - last) / 1000;
            last = now;
            elapsed += delta;
            camera.position.setXYZ(40 * Math.sin(elapsed * 0.3), 50 * Math.sin(elapsed * 0.5) + 100, 40 * Math.cos(elapsed * 0.36));
            camera.target.set([Math.cos(elapsed * 0.8) * 100, Math.sin(elapsed * 0.5) * 10, Math.cos(elapsed * 0.1) * 100]);
            renderer.render(scene, camera);
            requestAnimationFrame(loop);
        }

        requestAnimationFrame(loop);

        return this;
    }

    public start() {

    }
}