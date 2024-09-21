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
import { Color } from "./math/Color";
import { FirstPersonControls } from "./cameras/FirstPersonControls";

import { InstancedMesh } from "./core/InstancedMesh";
import { OrbitControls } from "./cameras/OrbitControls";

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
        this.camera.setPosition(0, 1, 10);
        this.camera.lookAt(0, 0, 0);
        this.camera.name = 'MainCamera';
        
        const terrain = await new GLTFLoader(this.renderer).load('../assets/terrain.gltf');  
        terrain.material.shininess = 0;
        terrain.roughness = 1;
        this.terrain = terrain;
        this.scene.add(terrain);
        
        const tower = await new GLTFLoader(this.renderer).load('../assets/tower.glb');
        tower.material.shininess = 32;
        tower.setPosition(0, 4.9, 0);
        tower.setScale(0.03);
        this.scene.add(tower);
        
        const trees = await new GLTFLoader(this.renderer).load('../assets/tree.glb', 1000);
        const pos = new Vector3();
        for (let i = 0; i < trees.count; i++) {
            const x = randomFloat(-50, 50);
            const z = randomFloat(-50, 50);
            const y = terrain.getHeightAt(x, z);
            pos.set(x, y, z);
            trees.setPositionAt(pos, i);
            trees.rotateYAt(randomFloat(0, Math.PI * 2), i);
            trees.rotateXAt(randomFloat(-0.1, 0.1), i);
            trees.rotateZAt(randomFloat(-0.1, 0.1), i);
            trees.setScaleAt(randomFloat(0.4, 0.5), i);
        }
        this.scene.add(trees);
        // const rows = 10;
        // const cols = 100;
        // const v = new Vector3();
        // const sph = new InstancedMesh(
        //     new SphereGeometry(0.1, 8, 8),
        //     new MeshPhongMaterial({ color: '#ffffff' }),
        //     rows * cols 
        // )
        // this.scene.add(sph);



        // const floorGeometry = new PlaneGeometry(10, 10);
        // const floorMaterial = new MeshPhongMaterial({ color: '#333333', shininess: 152 });  
        // const floor = new Mesh(floorGeometry, floorMaterial);
        // floor.rotation.x = -Math.PI / 2;
        // floor.name = 'Floor';
        // this.scene.add(floor);
        
        // Shadow alpha test
        // const plane = new Mesh(new PlaneGeometry(1, 1), new MeshPhongMaterial({ diffuseMap: await new TextureLoader(this.renderer).load('../assets/leaf.png') }));
        // plane.rotation.x = -Math.PI / 2;
        // plane.setPosition(0, 1, 0);
        // this.scene.add(plane);

    
        this.controls = new OrbitControls(this.camera, canvas);
        
        
        this.light = new DirectionalLight();
        this.light.name = 'DirectionalLight';
        this.light.rotation.x = 2.2;
        this.light.rotation.y = -1;
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
        const cameraDistance = 10;
        const cameraSpeed = 0.1;
        //this.camera.setPosition(-Math.sin(this.elapsed * cameraSpeed) * cameraDistance, (Math.sin(this.elapsed * 0.5) + 1) + cameraDistance / 2, Math.cos(this.elapsed * cameraSpeed) * cameraDistance);
        this.renderer.render(this.scene, this.camera);
        this.controls.update(dt);

    }
}

const app = new App();
app.init();
