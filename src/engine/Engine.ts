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
import { Geometry, PlaneGeometry, SphereGeometry } from '@/geometry';
import { Shader, ShaderChunk } from '@/materials';
import { TemplateProcessor } from '@/materials/shaders/TemplateProcessor';
import { GLTFLoader } from '@/util/loaders/GLTFLoader';

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
        GLTFLoader.init(Engine.device);
        PipelineManager.init(Engine.device);
        ResourceManager.init(Engine.device);

        renderer.setResources(ResourceManager.getInstance());


        const scene = new Scene();
        const camera = new PerspectiveCamera(40, this.settings.width / this.settings.height, 0.1, 3000);
        camera.position.setXYZ(0, 40, 0);
        camera.lookAt(Vector3.left);

        scene.add(camera);
        scene.backgroundColor.setHex(0x111111);
        scene.ambientColor.set([0.05, 0.05, 0.05, 1]);
        scene.fog.color.setHex(0x111111);
        scene.fog.start = 300;
        scene.fog.end = 2000;

        // GRASS MATERIAL (EXTENDED STANDARD MATERIAL)
        const grassMat = new StandardMaterial({ diffuse: '#aaaa00', sheen: '#aaff00', transmission: 1.0, cullMode: 'back' });
        const grassChunk = new ShaderChunk('grass', `
            @vertex(before:model) {{
            if (input.vertex_index == 2) {
                // animate only the top vertex
                let model = model[input.instance_index];
                var worldPosition = getWorldPosition(position, model);
                let time = scene.time;

                // noise to hide grass
                let n = fbm(worldPosition.xz * 0.1);
                if (n < sin(time)) {
                    output.position = vec4(1.0, 1.0, 1.0, 0.0);
                    return output;
                }
                
                // wind animation
                let wind = fbm(worldPosition.xz * 0.001) * 0.5 + 0.5;
                let windStrength = sin(time * 4.0 + wind * 100.0) * 2.0;
                position.x += windStrength;
                position.z += windStrength * 0.5;
                position.y += n * 0.5;
            }
            }}
            @fragment(before:gamma) {{
                let n = fbm(input.vPositionW.xz * 0.01) * 0.5 + 0.5;
                let green1 = vec3f(0.05, 0.05, 0.0);
                let green2 = vec3f(0.05, 0.1, 0.0); 
                let grassColor = mix(green1, green2, n);
                color = mix(color, vec4(grassColor, 1.0), n);
                color = vec4(color.rgb * input.vUv.y, 1.0);
            }}
        `);
        
        grassMat.addChunk(grassChunk);

        // GRASS GEOMETRY
        const triangleGeometry = new Geometry();
        triangleGeometry.setFromArrays({
            positions: [ -1, 0, 0, 1, 0, 0, 0, 1, 0, ],
            normals: [ 0, 0, -1, 0, 0, -1, 0, 0, -1 ],
            uvs: [ 0, 0, 1, 0, 0.5, 1 ],
            indices: [0, 2, 1]
        });

        // GRASS MESH
        const grass = new Mesh(triangleGeometry, grassMat, 200_000);

        // GRASS TRANSFORMS
        const rangeX = 280;
        const rangeZ = 50;
        grass.setAllPositions(Array.from({ length: grass.count }, (_, i) => [rand(-rangeX, rangeX), 0, rand(-rangeZ, rangeZ)]).flat());
        grass.setAllScales(Array.from({ length: grass.count }, (_, i) => [rand(0.1, 0.3), rand(1, 5), 1]).flat());
        grass.setAllRotations(Array.from({ length: grass.count }, (_, i) => [0, -Math.PI / 2, 0]).flat());
        scene.add(grass);

        // SPONZA
        const sponza = await GLTFLoader.loadMesh('assets/models/sponza.glb');
        if (sponza) {
            sponza.setScale(0.2);
            sponza.position.z = 7;
            scene.add(sponza);
        }

        // LIGHTS
        const point = new PointLight({ intensity: 10, range: 300 });
        scene.add(point);
        point.position.setXYZ(-100, 20, 0);
        const bulb = new Mesh(new SphereGeometry(2), new StandardMaterial({ emissive: '#ffffff', emissive_factor: 100 }));
        point.add(bulb);

        // LOOP
        let last = performance.now();
        let elapsed = 0;
        const loop = () => {
            const now = performance.now();
            const delta = (now - last) / 1000;
            last = now;
            elapsed += delta;
            camera.position.x = Math.cos(elapsed * 0.2) * 150 + 120;
            point.position.x = Math.sin(elapsed * 0.6) * 250;
            point.position.y = Math.cos(elapsed * 0.6) * 80 + 100;
            renderer.render(scene, camera);
            requestAnimationFrame(loop);
        }

        requestAnimationFrame(loop);

        return this;
    }

    public start() {

    }
}