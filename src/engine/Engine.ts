import { Renderer } from '@/renderer/Renderer';
import { EngineSettings, EngineDefaultSettings, EngineSettingsConfig } from '../settings/EngineSettings';
import { ShaderLibrary } from '@/materials/shaders/ShaderLibrary';
import { StandardMaterial } from '@/materials/StandardMaterial';
import { TextureLoader } from '@/util/loaders/TextureLoader';
import { BoxGeometry } from '@/geometry/BoxGeometry';
import { Mesh } from '@/core/Mesh';
import { Scene } from '@/core/Scene';
import { PipelineManager } from './PipelineManager';
import { ResourceManager } from './ResourceManager';
import { PerspectiveCamera } from '@/camera/PerspectiveCamera';
import { EventCallback, EventEmitter } from '@/core/EventEmitter';
import { PointLight } from '@/lights/PointLight';
import { Vector3 } from '@/math';
import { SphereGeometry } from '@/geometry';
import { rand } from '@/util';

export class Engine extends EventEmitter {
    static #instance: Engine;
    public settings: EngineSettings = { ...EngineDefaultSettings };
    public device!: GPUDevice;
    private renderer!: Renderer;
    private scene!: Scene;
    private camera!: PerspectiveCamera;

    static get settings() { return Engine.#instance?.settings || { ...EngineDefaultSettings }; }
    static get device() { return Engine.#instance?.device; }
    
    static getInstance(settings: EngineSettingsConfig = {}) {
        if (!Engine.#instance) {
            Engine.#instance = new Engine(settings);
        }
        return Engine.#instance;
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
            canvas.style.width = width;
            canvas.style.height = height;
            canvas.width = this.settings.width;
            canvas.height = this.settings.height;
            document.body.appendChild(canvas);
        }
        this.settings.canvas = canvas;
        return canvas;
    }

    private async initializeCore() {

        // Initialize core
        this.renderer = await new Renderer(this.getOrCreateCanvas()).init();
        this.device = this.renderer.device;
        
        // Initialize managers
        ShaderLibrary.init();
        TextureLoader.init(Engine.device);
        PipelineManager.init(Engine.device);
        ResourceManager.init(Engine.device);

        this.renderer.setResources(ResourceManager.getInstance());
    }

    private setupScene() {

        // Create scene
        this.scene = new Scene();
        this.scene.backgroundColor.setHex(0x111111);
        this.scene.fog.color.setHex(0x111111);

        // Setup camera
        this.camera = new PerspectiveCamera(45, this.settings.width / this.settings.height, 0.1, 500);
        this.camera.position.setXYZ(2, 10, 40);
        this.scene.add(this.camera);

        // Add floor
        const floor = new Mesh(
            new BoxGeometry(100, 0.1, 100), 
            new StandardMaterial({ diffuse: '#333333' })
        );
        this.scene.add(floor);

        this.createBuildings();

        this.createLights();
    }

    private createBuildings() {
        const box = new Mesh(
            new BoxGeometry(1, 1, 1), 
            new StandardMaterial({ diffuse: '#ffffff' }), 
            10000
        );
        
        const positions = [];
        const scales = [];
        const range = 50;
        
        for (let i = 0; i < box.count; i++) {
            const x = rand(-range, range);
            const z = rand(-range, range);
            const scaleX = rand(1, 2);
            const scaleY = rand(1, 4);
            const scaleZ = rand(1, 3);
            const y = scaleY / 2;
            scales.push(scaleX, scaleY, scaleZ);
            positions.push(x, y, z);
        }

        box.setAllPositions(positions);
        box.setAllScales(scales);
        this.scene.add(box);
    }

    private createLights() {
        // Create point lights with bulbs
        const createPointLightWithBulb = (color: string, position: Vector3) => {
            const bulb = new Mesh(
                new SphereGeometry(1), 
                new StandardMaterial({ 
                    diffuse: color, 
                    emissive: color, 
                    emissive_factor: 40, 
                    useLight: false, 
                    useFog: false 
                })
            );
            
            const pointLight = new PointLight({ 
                color: color, 
                intensity: 5, 
                range: 30 
            });
            
            pointLight.setPosition(position.x, position.y, position.z);
            pointLight.add(bulb);
            return pointLight;
        };

        const pointLight1 = createPointLightWithBulb('#ffff00', new Vector3(10, 5, 10));
        const pointLight2 = createPointLightWithBulb('#00aaff', new Vector3(-10, 5, -10));

        this.scene.add(pointLight1);
        this.scene.add(pointLight2);
    }

    async init() {
        await this.initializeCore();
        this.setupScene();

        let last = performance.now();
        let elapsed = 0;

        const animate = () => {
            const now = performance.now();
            const delta = (now - last) / 1000;
            last = now;
            elapsed += delta;

            // Animate lights
            const lightObjects = this.scene.getObjectsByType(PointLight);
            if (lightObjects.length >= 2) {
                const [light1, light2] = lightObjects;
                light1.setPosition(
                    10 * Math.sin(elapsed * 0.3), 
                    5, 
                    10 * Math.cos(elapsed * 0.3)
                );
                light2.setPosition(
                    10 * Math.sin(elapsed * 0.3 + Math.PI), 
                    5, 
                    10 * Math.cos(elapsed * 0.3 + Math.PI)
                );
            }

            // Render scene using RenderGraph
            this.renderer.render(this.scene, this.camera);
            
            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
        return this;
    }
}