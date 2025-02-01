import { Scene } from '@/core/Scene';
import { Mesh } from '@/core/Mesh';
import { PerspectiveCamera } from '@/camera/PerspectiveCamera';
import { StandardMaterial } from '@/materials/StandardMaterial';
import { Engine } from '@/engine/Engine';
import { BoxGeometry, Geometry, PlaneGeometry, SphereGeometry } from '@/geometry';
import { Texture2D } from '@/data/Texture2D';


import StoneAlbedo from '../assets/textures/stonework/stonework_albedo.png';
import StoneNormal from '../assets/textures/stonework/stonework_normal.png';
import StoneRoughness from '../assets/textures/stonework/stonework_roughness.png';
import StoneMetalness from '../assets/textures/stonework/stonework_metallic.png';
import StoneHeight from '../assets/textures/stonework/stonework_height.png';
import StoneAO from '../assets/textures/stonework/stonework_ao.png';



import { OrbitControls } from '@/camera/controls/OrbitControls';
import { DirectionalLight } from '@/lights/DirectionalLight';
import { Light } from '@/lights/Light';


export class CubeScene {
    private scene!: Scene;
    private camera!: PerspectiveCamera;
    private last: number = performance.now();
    private engine : Engine;
    light!: Light;
    controls!: OrbitControls;
    plane!: Mesh;

    constructor(engine : Engine) {
        this.engine = engine;
    }

    async init() {
        this.setupScene();
        this.setupCamera();
    }

    private setupCamera() {
        this.camera = new PerspectiveCamera(40, this.engine.settings.width / this.engine.settings.height);
        this.camera.setPosition(10, 10, 0);
        this.camera.lookAt(0, 0, 0);
        this.scene.add(this.camera);
        this.controls = new OrbitControls(this.camera, this.engine.settings.canvas!);
    }

    async setupScene() {
        this.scene = new Scene({
            backgroundColor: '#aaffff',
            ambientColor: '#000000',
            groundColor: '#000000',
            skyColor: '#aaffff',
            indirectIntensity: 0.5, 
            fog: { color: '#aaffff', start: 10, end: 30},
        });
        // PLANE
        this.plane = new Mesh(new PlaneGeometry(10, 10).rotateX(-Math.PI/2), new StandardMaterial({
            diffuse_map: Texture2D.from(StoneAlbedo),
            normal_map: Texture2D.from(StoneNormal),
            roughness_map: Texture2D.from(StoneRoughness),
            metalness_map: Texture2D.from(StoneMetalness),
            height_map: Texture2D.from(StoneHeight),
            ao_map: Texture2D.from(StoneAO),
        }));
        this.scene.add(this.plane);
        // LIGHT
        this.light = new DirectionalLight({ intensity: 5.0 });
        this.light.position.set(0, 1, 1);
        this.light.lookAt(0, 0, 0);
        this.scene.add(this.light);
    }

    start() {
        this.animate();
    }

    private animate = () => {
        const now = performance.now();
        this.controls.update();
        this.last = now;
        this.engine.renderer.render(this.scene, this.camera);        
        requestAnimationFrame(this.animate);
    }
}