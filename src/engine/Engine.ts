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
import { DirectionalLight } from '@/lights/DirectionalLight';
import { PointLight } from '@/lights/PointLight';
import { rand, randInt } from '@/util';
import { Euler, Matrix3, Matrix4, Quaternion, Vector3 } from '@/math';
import { Geometry, PlaneGeometry, SphereGeometry } from '@/geometry';
import { ShaderChunk } from '@/materials';
import { GLTFLoader } from '@/util/loaders/GLTFLoader';
import { OrbitControls } from '@/camera';
import { CoordSystem } from '@/util/helpers/CoordSystem';
import { V } from 'vitest/dist/chunks/reporters.D7Jzd9GS.js';
import { Object3D } from '@/core/Object3D';
import { mat4, quat } from 'wgpu-matrix';
import { GridMaterial } from '@/materials/GridMaterial';

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
        const camera = new PerspectiveCamera(40, this.settings.width / this.settings.height, 0.1, 1000);

        scene.add(camera);
        scene.backgroundColor.setHex(0x111111);
        scene.ambientColor.set([0.05, 0.05, 0.05, 1]);
        scene.fog.color.setHex(0x111111);
        scene.fog.start = 300;
        scene.fog.end = 2000;

        // GRASS MATERIAL (EXTENDED STANDARD MATERIAL)
        const grassMat = new StandardMaterial({ diffuse: '#aaaa00', metalness: 0.1, roughness: 0.1,  transmission: 1.0, cullMode: 'back' });
        const grassChunk = new ShaderChunk('grass', `
            @vertex(before:model) {{
            if (input.vertex_index == 2) {
                // animate only the top vertex
                let model = model[input.instance_index];
                var worldPosition = getWorldPosition(position, model);
                let time = scene.time;

                // noise patches
                let noise = perlinNoise(worldPosition.xz * 0.1) * 0.5 + 0.5;
                position.y = noise * 2.0;

                // wind animation
                let wind = perlinNoise(worldPosition.xz * 0.005) * 0.5 + 0.5;
                let windStrength = sin(time * 2.0 + wind * 100.0);
                position.x += windStrength;
                position.z += windStrength;
            }
            }}
            @fragment(before:gamma) {{
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
        const grass = new Mesh(triangleGeometry, grassMat, 100_000);

        // GRASS TRANSFORMS
        const rangeX = 280;
        const rangeZ = 50;
        grass.setAllPositions(Array.from({ length: grass.count }, (_, i) => [rand(-rangeX, rangeX), 0, rand(-rangeZ, rangeZ)]).flat());
        grass.setAllScales(Array.from({ length: grass.count }, (_, i) => [rand(0.3, 0.5), rand(1, 4), 1]).flat());
        grass.setAllRotations(Array.from({ length: grass.count }, (_, i) => [0, -Math.PI / 2, 0]).flat());
        //scene.add(grass);


        // const dirlight = new DirectionalLight({ intensity: 3 });
        // scene.add(dirlight);

        // // SPONZA
        // const sponza = await GLTFLoader.loadMesh('assets/models/sponza.glb');
        // if (sponza) {
        //     sponza.setScale(0.2);
        //     sponza.position.z = 7;
        //     scene.add(sponza);
        // }

        const point = new PointLight({ intensity: 100 });
        point.position.setXYZ(5, 1, 0);
        scene.add(point);

        const coordSystem = new CoordSystem();
        scene.add(coordSystem);

        camera.setPosition(10, 10, 10);
        camera.lookAt(Vector3.ZERO);


        // CAMERA CONTROLS
        const controls = new OrbitControls(camera, this.settings.canvas!);


        // LOOP
        let last = performance.now();
        let elapsed = 0;

        const gridMat = new GridMaterial();
        const cubes = new Mesh(new BoxGeometry(1, 1, 1), gridMat, 50);
        const distance = 10;
        cubes.setAllScales(Array.from({ length: cubes.count }, (_, i) => [randInt(1, 2), randInt(1, 2), randInt(1, 2)]).flat());
        cubes.setAllPositions(Array.from({ length: cubes.count }, (_, i) => [randInt(-distance, distance), 0, randInt(-distance, distance)]).flat());
        scene.add(cubes);
        const sphere = new Mesh(new SphereGeometry(1, 32, 32), gridMat);
        sphere.position.setXYZ(0, 5, 0);
        scene.add(sphere);





        const loop = () => {
            controls.update();
            const now = performance.now();
            const delta = (now - last) / 1000;
            last = now;
            elapsed += delta * 0.3;
            point.position.x = Math.sin(elapsed) * 10;
            point.position.z = Math.cos(elapsed) * 10;
            point.position.y = Math.sin(elapsed) * 5 + 5;
            camera.lookAt(Vector3.ZERO);

            renderer.render(scene, camera);
            requestAnimationFrame(loop);
        }

        requestAnimationFrame(loop);

        return this;
    }

    public start() {

    }
}