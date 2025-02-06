import { Scene } from '@/core/Scene';
import { PerspectiveCamera } from '@/camera/PerspectiveCamera';
import { Vector3 } from '@/math';
import { Mesh } from '@/core/Mesh';
import { BoxGeometry, PlaneGeometry } from '@/geometry';
import { StandardMaterial } from '@/materials/StandardMaterial';
import { ShaderChunk } from '@/materials/shaders/ShaderChunk';
import { GLTFLoader } from '@/util/loaders/GLTFLoader';
import { PointLight } from '@/lights/PointLight';
import { rand } from '@/util';
import { Engine } from '@/engine/Engine';
import { Texture2D } from '@/data';
import { TriangleGeometry } from '@/geometry/TriangleGeometry';
import Bistro from '../assets/models/bistro.glb?url';

import ParticleMap from '../assets/textures/particle.png';
import { FirstPersonControls } from '@/camera';
import { DirectionalLight } from '@/lights/DirectionalLight';
import { Object3D } from '@/core';

export class BistroScene {
    private scene!: Scene;
    private camera!: PerspectiveCamera;
    private particles!: Mesh;
    private point!: PointLight;
    private redCube!: PointLight;
    private elapsed: number = 0;
    private last: number = performance.now();
    private engine : Engine;
    private controls!: FirstPersonControls;

    constructor(engine : Engine) {
        this.engine = engine;
    }

    async init() {
        this.setupScene();
        this.setupCamera();
        await this.setupBistro();
        this.setupLights();
    }

    private setupCamera() {
        this.camera = new PerspectiveCamera(40, this.engine.settings.width / this.engine.settings.height, 0.1, 1000);
        this.controls = new FirstPersonControls(this.camera, this.engine.settings.canvas!);
        this.camera.setPosition(5, 5, -5);
        this.camera.lookAt(Vector3.ZERO);
        this.scene.add(this.camera);
    }

    private setupScene() {
        this.scene = new Scene({
            fog: { start: 10, end: 100, density: 0.1, color: '#ddffff' },
            skyColor: '#ddffff',
            groundColor: '#000000',
            backgroundColor: '#ddffff',
            indirectIntensity: 0.5,
        });

        const floor = new Mesh(new PlaneGeometry(100, 100).rotateX(-Math.PI / 2), new StandardMaterial({ diffuse: '#ffffff' }));
        this.scene.add(floor);
        const cube = new Mesh(new BoxGeometry(1, 1, 1), new StandardMaterial({ diffuse: '#ff0000' }));
        cube.position.set(0, 1, 0);
        this.scene.add(cube);
    }

    private async setupBistro() {
        // const glb = await GLTFLoader.load(Bistro);
        // glb!.scene.traverse((child: Object3D) => {
        //     if (!(child instanceof Mesh)) return;
        //     if (child.material) {
        //         (child.material as StandardMaterial).invert_normal = true;
        //         (child.material as StandardMaterial).alpha_test = 0.6;
        //     }

        // });
        // this.scene.add(glb!.scene);
    }

    private setupLights() {
        const directional = new DirectionalLight({ intensity: 3 });
        directional.position.set(1, 1, 1);
        directional.lookAt(Vector3.ZERO);
        this.scene.add(directional);
    }

    start() {
        this.animate();
    }

    private animate = () => {
        const now = performance.now();
        const delta = (now - this.last) / 1000;
        this.controls?.update(delta);
        this.camera.position.y = 5;
        this.last = now;
        this.elapsed += delta;

        // Update point light
        if (this.point) {
            this.point.position.x = Math.cos(this.elapsed * 0.3) * 200;
        }
        
        // Update red cube
        if (this.redCube) {
            this.redCube.rotation.x += delta;
            this.redCube.rotation.z += delta;
        }

        // Render and continue loop
        this.engine.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.animate);
    }
}