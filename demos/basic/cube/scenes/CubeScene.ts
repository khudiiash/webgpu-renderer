import { Scene } from '@/core/Scene';
import { Mesh } from '@/core/Mesh';
import { PerspectiveCamera } from '@/camera/PerspectiveCamera';
import { StandardMaterial } from '@/materials/StandardMaterial';
import { BoxGeometry } from '@/geometry/BoxGeometry';
import { Engine } from '@/engine/Engine';
import { Shader, ShaderConfig } from '@/materials/shaders/Shader';
import { DirectionalLight } from '@/lights/DirectionalLight';
import { rand } from '@/util/math';
import { OrbitControls } from '@/camera/controls/OrbitControls';
import { PointLight } from '@/lights/PointLight';
import { PlaneGeometry, SphereGeometry } from '@/geometry';
import { GLTFLoader } from '@/util/loaders/GLTFLoader'
import Sponza from '../assets/models/sponza.glb?url';
import { TemplateProcessor } from '@/materials/shaders/TemplateProcessor';
import { ShaderFormatter } from '@/materials/shaders/ShaderFormatter';
import { BindGroupLayout } from '@/data/BindGroupLayout';
import { Binding } from '@/data/Binding';
import Particle from '../../../../assets/textures/particle.png';
import { Texture2D } from '@/data/Texture2D';

export class CubeScene {
    private scene!: Scene;
    private camera!: PerspectiveCamera;
    private elapsed: number = 0;
    private last: number = performance.now();
    private engine : Engine;
    private cube!: Mesh;
    private controls!: OrbitControls;
    light: DirectionalLight;

    constructor(engine : Engine) {
        this.engine = engine;
    }

    async init() {
        this.setupScene();
        this.setupCamera();
    }

    private setupCamera() {
        this.camera = new PerspectiveCamera(40, this.engine.settings.width / this.engine.settings.height);
        this.camera.position.set(0, 1, 5);
        this.camera.lookAt(0, 0, 0);
        this.controls = new OrbitControls(this.camera, this.engine.settings.canvas!);
        this.scene.add(this.camera);
    }

    private setupScene() {
        this.scene = new Scene({
            fog: {
                color: 0x948788,
                start: 10,
                end: 100,
            },
            ambientColor: 0x404040,
            backgroundColor: 0xffffff,
            
        });
        this.scene.fog.start = 1;
        this.scene.fog.end = 6;

        this.cube = new Mesh(new PlaneGeometry(1, 1, 1), new StandardMaterial({ diffuse: 0x00ff00, emissive: '#00ff00' }), { useBillboard: true });
        this.cube.setPosition(0, 0.5, 0);
        this.scene.add(this.cube);

        const cube2 = new Mesh(new PlaneGeometry(1, 1, 1), new StandardMaterial({ diffuse: 0xff0000, emissive: '#ff0000' }), { useBillboard: true});
        cube2.setPosition(2, 0.5, 0);
        this.scene.add(cube2);
        this.cube2 = cube2;

        const cube3 = new Mesh(new PlaneGeometry(1, 1, 1), new StandardMaterial({ diffuse: 0x0000ff, emissive: '#0000ff' }), { useBillboard: true });
        cube3.setPosition(4, 0.5, 0);
        this.scene.add(cube3);
        this.cube3 = cube3;

        const directionalLight = new DirectionalLight({ color: 0xffffff, intensity: 1 });
        directionalLight.setPosition(2, 2, 2);
        directionalLight.lookAt(0, 0, 0);
        this.light = directionalLight;
        this.scene.add(directionalLight);

        // const pointLight = new PointLight({ color: 0xffffff, intensity: 1, decay: 2 });
        // this.light = pointLight;
        //const bulb = new Mesh(new BoxGeometry(0.5, 0.5, 0.5), new StandardMaterial({ emissive: 0xffffff }));
        //this.light.add(bulb);
        //this.scene.add(pointLight);

        //const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
        // const pointLights = Array.from({ length: 10 }, () => {
        //     const randomColor = colors[Math.floor(Math.random() * colors.length)];
        //     const light = new PointLight({ color: randomColor, intensity: rand(1, 2), decay: rand(1, 2) });
        //     light.setPosition(rand(-5, 5), rand(2, 3), rand(-5, 5));
        //     this.scene.add(light);
        //     return light;
        // });
    }

    start() {
        this.animate();
    }

    private animate = () => {
        const now = performance.now();
        const delta = (now - this.last) / 1000;
        this.last = now;
        this.elapsed += delta;
        this.controls.update();
        // this.light.setPosition(Math.sin(this.elapsed) * 3, 1, Math.cos(this.elapsed) * 3);
        // this.light.lookAt(0, 0, 0);

        this.cube2.position.x = Math.sin(this.elapsed) * 3;
        this.cube2.position.z = Math.cos(this.elapsed) * 3;

        this.cube3.position.x = Math.cos(this.elapsed) * 6;
        this.cube3.position.z = Math.sin(this.elapsed) * 6;

        this.engine.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.animate);
    }
}