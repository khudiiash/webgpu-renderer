import Stats from "stats.js";
import { Renderer } from "./renderer/Renderer";
import { PerspectiveCamera } from "./cameras/PerspectiveCamera";
import { OrthographicCamera } from "./cameras/OrthographicCamera";
import { TextureLoader } from "./loaders/TextureLoader";
import { Scene } from "./core/Scene";
import { BoxGeometry } from "./geometry/BoxGeometry";
import { PlaneGeometry } from "./geometry/PlaneGeometry";
import { SphereGeometry } from "./geometry/SphereGeometry";
import { Material } from "./materials/Material";
import { Mesh } from "./core/Mesh";
import { MeshBasicMaterial } from "./materials/MeshBasicMaterial";
import { MeshPhongMaterial } from "./materials/MeshPhongMaterial";
import { DirectionalLight } from "./lights/DirectionalLight";
import { modMinMax, randomFloat } from "./math/MathUtils";
import { Vector3 } from "./math/Vector3";
import { GLTFLoader } from "./loaders/GLTFLoader";
import { UniformLib } from "./renderer/shaders/UniformLib";

class App {
    constructor() {
        
    } 
    
    async init() {
        const canvas = document.getElementById('canvas');
        this.stats = new Stats();
        this.last = performance.now();
        this.elapsed = 0;
        document.body.appendChild(this.stats.dom);
        this.renderer = new Renderer(canvas);
        await this.renderer.init();
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(45, this.renderer.aspect, 0.1, 1000);
        this.camera.setPosition(8, 4, 8);
        this.camera.name = 'MainCamera';

        // const floorGeometry = new PlaneGeometry(10, 10);
        // const floorMaterial = new MeshPhongMaterial({ color: '#ffffff' });
        // const floor = new Mesh(floorGeometry, floorMaterial);
        // floor.rotation.x = -Math.PI / 2;
        // floor.name = 'Floor';
        // this.scene.add(floor);
     
        // const tree = await new GLTFLoader(this.renderer).load('../assets/tree.glb');
        // tree.position.set(3, 0, 3);
        // this.scene.add(tree);
        
        new GLTFLoader(this.renderer).load('../assets/terrain.gltf').then((gltf) => {
            this.scene.add(gltf);
        });
        new GLTFLoader(this.renderer).load('../assets/cow.gltf').then((gltf) => {
            gltf.rotation.y = Math.PI / 2;
            this.scene.add(gltf);
        });
        new GLTFLoader(this.renderer).load('../assets/tree.gltf').then((gltf) => {
            gltf.setPosition(-40, 0, 3);
            gltf.scale.set(3, 3, 3);
            this.scene.add(gltf);
        });
        new GLTFLoader(this.renderer).load('../assets/tree.gltf').then((gltf) => {
            gltf.setPosition(-30, 0, 25);
            gltf.scale.set(4, 4, 4);
            this.scene.add(gltf);
        });

        new GLTFLoader(this.renderer).load('../assets/tree.gltf').then((gltf) => {
            gltf.setPosition(-20, 0, -33);
            gltf.scale.set(3, 3, 3);
            this.scene.add(gltf);
        });
        new GLTFLoader(this.renderer).load('../assets/tree.gltf').then((gltf) => {
            gltf.setPosition(30, 0, 25);
            gltf.scale.set(4, 4, 4);
            this.scene.add(gltf);
        });
        new GLTFLoader(this.renderer).load('../assets/tree.gltf').then((gltf) => {
            gltf.setPosition(50, 0, -65);
            gltf.scale.set(4, 4, 4);
            this.scene.add(gltf);
        });

        
        new GLTFLoader(this.renderer).load('../assets/tree.gltf').then((gltf) => {
            gltf.setPosition(-20, 0, 53);
            gltf.rotation.y = Math.PI / 2;
            gltf.scale.set(3, 3, 3);
            this.scene.add(gltf);
        });
        new GLTFLoader(this.renderer).load('../assets/tree.gltf').then((gltf) => {
            gltf.setPosition(80, 0, 90);
            gltf.scale.set(4, 4, 4);
            this.scene.add(gltf);
        });

        // const cube = new BoxGeometry(1, 1, 1);
        // const basic = new MeshBasicMaterial({ color: '#ff0000' });
        // const mesh = new Mesh(cube, basic);
        // mesh.name = 'Cube';
        // this.scene.add(mesh);
        
        this.light = new DirectionalLight({ color: '#0020ff', intensity: 8.0 });
        this.light.name = 'DirectionalLight';
        this.light.rotation.x = 1;
        this.light.rotation.y = 1;
        this.scene.add(this.light);
        
        
        this.frame = 0;
        requestAnimationFrame(() => this.loop());
        
    }
    
    loop() {
        const now = performance.now();
        const dt = (now - this.last) / 1000;
        this.last = now;
        this.elapsed += dt;
        this.update(dt);
        requestAnimationFrame(() => this.loop());
    }
    
    
    update(dt) {
        this.stats.update(); 
        this.camera.setPosition(Math.sin(this.elapsed * 0.2) * 90, (Math.sin(this.elapsed * 0.5) + 1) * 10 + 15, Math.cos(this.elapsed * 0.2) * 110);
        this.renderer.render(this.scene, this.camera);
    }
}

const app = new App();
app.init();
