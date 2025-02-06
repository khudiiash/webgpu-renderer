import { Scene } from '@/core/Scene';
import { Mesh } from '@/core/Mesh';
import { PerspectiveCamera } from '@/camera/PerspectiveCamera';
import { StandardMaterial } from '@/materials/StandardMaterial';
import { BoxGeometry } from '@/geometry/BoxGeometry';
import { Engine } from '@/engine/Engine';
import { Shader } from '@/materials/shaders/Shader';
import { DirectionalLight } from '@/lights/DirectionalLight';
import { rand } from '@/util/math';
import { OrbitControls } from '@/camera/controls/OrbitControls';
import { PointLight } from '@/lights/PointLight';
import { SphereGeometry } from '@/geometry';

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
        this.scene = new Scene();
        this.scene.fog.start = 1;
        this.scene.fog.end = 6;

        const floor = new Mesh(new BoxGeometry(10, 0.1, 10), new StandardMaterial({ diffuse: 0xffffff}));
        this.scene.add(floor);
        this.cube = new Mesh(new BoxGeometry(1, 1, 1), new StandardMaterial({ diffuse: 0xff0000 }));
        this.cube.setPosition(0, 0.5, 0);
        this.scene.add(this.cube);

        const cube2 = new Mesh(new BoxGeometry(1, 1, 1), new StandardMaterial({ diffuse: 0x00ff00 }));
        cube2.setPosition(2, 0.5, 0);
        this.scene.add(cube2);

        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
        const pointLights = Array.from({ length: 10 }, () => {
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const light = new PointLight({ color: randomColor, intensity: rand(1, 2), decay: rand(1, 2) });
            light.setPosition(rand(-5, 5), rand(2, 3), rand(-5, 5));
            this.scene.add(light);
            return light;
        });
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

        this.engine.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.animate);
    }
}