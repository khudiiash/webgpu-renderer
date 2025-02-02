import { Scene } from '@/core/Scene';
import { Mesh } from '@/core/Mesh';
import { PerspectiveCamera } from '@/camera/PerspectiveCamera';
import { StandardMaterial } from '@/materials/StandardMaterial';
import { BoxGeometry } from '@/geometry/BoxGeometry';
import { Engine } from '@/engine/Engine';

export class CubeScene {
    private scene!: Scene;
    private camera!: PerspectiveCamera;
    private elapsed: number = 0;
    private last: number = performance.now();
    private engine : Engine;
    private cube!: Mesh;

    constructor(engine : Engine) {
        this.engine = engine;
    }

    async init() {
        this.setupScene();
        this.setupCamera();
    }

    private setupCamera() {
        this.camera = new PerspectiveCamera(40, this.engine.settings.width / this.engine.settings.height);
        this.camera.position.set(0, 0, 5);
        this.scene.add(this.camera);
    }

    private setupScene() {
        this.scene = new Scene();
        this.scene.fog.start = 1;
        this.scene.fog.end = 6;
        this.cube = new Mesh(new BoxGeometry(1, 1, 1), new StandardMaterial({ useLight: false, diffuse: 0xff0000}));
        this.scene.add(this.cube);
    }

    start() {
        this.animate();
    }

    private animate = () => {
        const now = performance.now();
        const delta = (now - this.last) / 1000;
        this.last = now;
        this.elapsed += delta;
        this.cube.rotation.set(this.elapsed, this.elapsed, 0);

        this.engine.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.animate);
    }
}