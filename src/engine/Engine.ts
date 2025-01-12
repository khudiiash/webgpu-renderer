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
import { DirectionalLight } from '@/lights/DirectionalLight';
import { PointLight } from '@/lights/PointLight';
import { L } from 'vitest/dist/chunks/reporters.D7Jzd9GS.js';
import { UniformData, UniformDataArray } from '@/data';
import { Color } from '@/math/Color';
import { align4, rand } from '@/util';
import { Vector3 } from '@/math';
import { SphereGeometry } from '@/geometry';

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
        camera.position.setXYZ(2, 10, 40);

        scene.add(camera);
        scene.backgroundColor.setHex(0x111111);
        scene.fog.color.setHex(0x111111);

        const floor = new Mesh(new BoxGeometry(100, 0.1, 100), new StandardMaterial({ diffuse: '#333333' }));
        scene.add(floor);

        const box = new Mesh(new BoxGeometry(1, 1, 1), new StandardMaterial({ diffuse: '#ffffff' }), 10000);
        const positions = [];
        const scales = [];
        const range = 50;
        for (let i = 0; i < box.count; i++) {
            const x = rand(-range, range);
            const z = rand(-range, range);
            const scaleX = rand(1, 3);
            const scaleY = rand(1, 2);
            const scaleZ = rand(1, 5);
            const y = scaleY / 2;
            scales.push(scaleX, scaleY, scaleZ);
            positions.push(x, y, z);
        }

        box.setAllPositions(positions);
        box.setAllScales(scales);
        scene.add(box);

        const light = new DirectionalLight({ intensity: 2 });
        light.setPosition(10, 10, 0); 

        const bulb1 = new Mesh(new SphereGeometry(1), new StandardMaterial({ diffuse: '#ffffaa', emissive: '#ffffaa', emissive_factor: 40, useLight: false, useFog: false }));
        const bulb2 = new Mesh(new SphereGeometry(1), new StandardMaterial({ diffuse: '#aaaaff', emissive: '#aaaaff', emissive_factor: 40, useLight: false, useFog: false }));
        const pointLight = new PointLight({ color: '#ffffaa', intensity: 5, range: 30 });
        const pointLight2 = new PointLight({ color: '#aaaaff', intensity: 5, range: 30 });
        pointLight.setPosition(10, 5, 10);
        pointLight2.setPosition(-10, 5, -10);
        pointLight.add(bulb1);
        pointLight2.add(bulb2);
        scene.add(pointLight);
        scene.add(pointLight2);

        let last = performance.now();
        let elapsed = 0;

        const loop = () => {
            const now = performance.now();
            const delta = (now - last) / 1000;
            last = now;
            elapsed += delta;
            //camera.position.setXYZ(40 * Math.sin(elapsed * 0.3), 40, 40 * Math.cos(elapsed * 0.3));
            pointLight.setPosition(10 * Math.sin(elapsed * 0.3), 5, 10 * Math.cos(elapsed * 0.3));
            pointLight2.setPosition(10 * Math.sin(elapsed * 0.3 + Math.PI), 5, 10 * Math.cos(elapsed * 0.3 + Math.PI));
            //console.log(bulb1.position, bulb2.position);
            //pointLight2.setPosition(-5, 5, -5);
            renderer.render(scene, camera);
            requestAnimationFrame(loop);
        }

        requestAnimationFrame(loop);

        return this;
    }

    public start() {

    }
}