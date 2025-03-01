import { Scene } from "@/core/Scene";
import { Mesh } from "@/core/Mesh";
import { PerspectiveCamera } from "@/camera/PerspectiveCamera";
import { StandardMaterial } from "@/materials/StandardMaterial";
import { BoxGeometry } from "@/geometry/BoxGeometry";
import { Engine } from "@/engine/Engine";
import { DirectionalLight } from "@/lights/DirectionalLight";
import { Camera, FirstPersonControls } from "@/camera";
import { PlaneGeometry, SphereGeometry } from "@/geometry";
import { GLTFLoader } from "@/util/loaders";
import { PointLight } from "@/lights/PointLight";
import PX from "../assets/textures/bluecloud_posX.jpg";
import NX from "../assets/textures/bluecloud_negX.jpg";
import PY from "../assets/textures/bluecloud_posY.jpg";
import NY from "../assets/textures/bluecloud_negY.jpg";
import PZ from "../assets/textures/bluecloud_posZ.jpg";
import NZ from "../assets/textures/bluecloud_negZ.jpg";

import { rand } from "@/util/math";
import { TextureCube } from "@/data/TextureCube";

export class CubeScene {
    private scene!: Scene;
    private camera!: Camera;
    private elapsed: number = 0;
    private last: number = performance.now();
    private engine: Engine;
    private cube!: Mesh;
    private controls!: FirstPersonControls;
    light!: DirectionalLight;
    terrain!: Mesh;

    constructor(engine: Engine) {
        this.engine = engine;
    }

    async init() {
        this.setupScene();
        this.setupCamera();
        //this.loadModel();
    }

    async loadModel() {
        const mesh = (await GLTFLoader.loadMesh(Terrain)) as Mesh;
        mesh.initializeSpatialGrid(80);
        this.terrain = mesh;
        this.scene.add(mesh);
        const pine = (await GLTFLoader.loadMesh(Pine, 500)) as Mesh;
        this.scene.add(pine);
        const range = [-1000, 1000];
        pine.setAllPositions(
            Array.from({ length: pine.count }, (_) => {
                let x = 0,
                    y = Infinity,
                    z = 0;
                while (y > 5 || y < 2) {
                    x = rand(range[0], range[1]);
                    z = rand(range[0], range[1]);
                    y = mesh.getHeightAt(x, z);
                }
                return [x, y, z];
            }).flat(),
        );
        pine.setAllScales(
            Array.from({ length: pine.count }, (_) => {
                const s = rand(1.0, 3);
                return [s, s, s];
            }).flat(),
        );

        pine.setAllRotations(Array.from({ length: pine.count }, (_) => [0, rand(-Math.PI, Math.PI), 0]).flat());
    }

    private setupCamera() {
        this.camera = new PerspectiveCamera(40, this.engine.settings.width / this.engine.settings.height, 0.1, 10000);
        this.camera.position.set(2, 2, 2);
        this.camera.lookAt(0, 0, 0);
        this.controls = new FirstPersonControls(this.camera, this.engine.settings.canvas!);
        this.controls.movementSpeed = 100;
        this.scene.add(this.camera);
    }

    private setupScene() {
        this.scene = new Scene({
            fog: {
                color: 0xcceeff,
                start: 30,
                end: 150,
            },
            ambientColor: 0x404040,
            ambientIntensity: 0.5,
            backgroundColor: 0xcceeff,
        });

        const floor = new Mesh(
            new PlaneGeometry(60, 60).rotateX(-Math.PI / 2),
            new StandardMaterial({ diffuse: 0xffffff, roughness: 1.0 }),
        );
        this.scene.add(floor);

        // RED CUBE
        this.cube = new Mesh(
            new BoxGeometry(5, 10, 5),
            new StandardMaterial({ diffuse: 0xff0000 }),
        );
        this.cube.setPosition(0, 0.5, 0);
        this.scene.add(this.cube);


        const directionalLight = new DirectionalLight({ color: 0xffffff, intensity: 10 });
        directionalLight.setPosition(20, 20, 20);
        directionalLight.lookAt(0, 0, 0);
        this.light = directionalLight;
        this.scene.add(directionalLight);
    }

    start() {
        this.animate();
    }

    private animate = () => {
        const now = performance.now();
        const delta = (now - this.last) / 1000;
        this.last = now;
        this.elapsed += delta;
        this.controls.update(delta);

        //this.light.setPosition(Math.sin(this.elapsed) * 10, 1, Math.cos(this.elapsed) * 10);
        //this.light.setPosition(this.camera.position);

        // this.cube2.position.x = Math.sin(this.elapsed) * 3;
        // this.cube2.position.z = Math.cos(this.elapsed) * 3;

        // this.cube3.position.x = Math.cos(this.elapsed) * 6;
        // this.cube3.position.z = Math.sin(this.elapsed) * 6;

        if (this.terrain) {
            this.camera.position.y = this.terrain.getHeightAt(this.camera.position.x, this.camera.position.z) + 15;
        }

        this.engine.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.animate);
    };
}
