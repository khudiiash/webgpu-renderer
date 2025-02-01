import { Renderer } from '@/renderer/Renderer';
import { EngineSettings, EngineDefaultSettings, EngineSettingsConfig } from '../settings/EngineSettings';
import { ShaderLibrary } from '@/materials/shaders/ShaderLibrary';
import { TextureLoader } from '@/util/loaders/TextureLoader';
import { GLTFLoader } from '@/util/loaders/GLTFLoader';
import { PipelineManager } from './PipelineManager';
import { ResourceManager } from './ResourceManager';
import { EventCallback, EventEmitter } from '@/core/EventEmitter';

export class Engine extends EventEmitter {
    static #instance: Engine;
    public settings: EngineSettings = { ...EngineDefaultSettings };
    public device!: GPUDevice;
    public renderer!: Renderer;

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

    private getOrCreateCanvas(): HTMLCanvasElement {
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

    async init() {
        this.renderer = await new Renderer(this.getOrCreateCanvas()).init();
        this.device = this.renderer.device;
        
        // Initialize core systems
        PipelineManager.init(Engine.device);
        ResourceManager.init(Engine.device);
        ShaderLibrary.init();
        TextureLoader.init(Engine.device);
        GLTFLoader.init(Engine.device);

        this.renderer.setResources(ResourceManager.getInstance());
        
        return this;
    }
}