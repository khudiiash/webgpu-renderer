import { Scene } from "@/core/Scene";
import { Mesh } from "@/core/Mesh";
import { PerspectiveCamera } from "@/camera/PerspectiveCamera";
import { StandardMaterial } from "@/materials/StandardMaterial";
import { BoxGeometry } from "@/geometry/BoxGeometry";
import { Engine } from "@/engine/Engine";
import { DirectionalLight } from "@/lights/DirectionalLight";
import { Camera, FirstPersonControls } from "@/camera";

export class CubeScene {
    private scene!: Scene;
    private camera!: Camera;
    private elapsed: number = 0;
    private last: number = performance.now();
    private engine: Engine;
    private cube!: Mesh;
    private controls!: FirstPersonControls;
    light!: DirectionalLight;

    constructor(engine: Engine) {
        this.engine = engine;
    }

    async init() {
        this.setupCamera();
        this.setupScene();
    }

    private setupCamera() {
        this.camera = new PerspectiveCamera();
        this.camera.setPosition(0, 0, 5);
        this.camera.lookAt(0, 0, 0);
    }

    private async setupScene() {
        this.scene = new Scene({
            fog: {
                start: 4,
                end: 6,
                color: 0x000000,
            },
            ambientColor: 0xffffff,
            ambientIntensity: 0.1,
        });

        this.cube = new Mesh(
            new BoxGeometry(1, 1, 1),
            new StandardMaterial({
                diffuse: 0xff0000,
            }),
        );

        this.scene.add(this.cube);

        const directionalLight = new DirectionalLight({
            intensity: 4.0,
        });
        directionalLight.setPosition(10, 10, 10);
        this.scene.add(directionalLight);
        this.light = directionalLight;
    }

    start() {
        this.animate();
    }

    private animate = () => {
        const now = performance.now();
        const delta = (now - this.last) / 1000;
        this.last = now;
        this.elapsed += delta;

        this.cube.rotation.x += delta;
        this.cube.rotation.z += delta;

        this.engine.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.animate);
    };
}
