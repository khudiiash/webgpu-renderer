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
import { Boids } from "./extra/Boids";
import { BoundingBox } from "./math/BoundingBox";

import BirdModel from "../assets/bird.glb";
import TerrainModel from "../assets/terrain.gltf";
import TowerModel from "../assets/tower.glb";
import TreeModel from "../assets/tree.glb";

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
        this.camera.setPosition(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        this.camera.name = 'MainCamera';
        this.scene.add(this.camera);
        
        const terrain = await new GLTFLoader(this.renderer).load(TerrainModel);
        terrain.setPosition(0, 0, 0);
        this.terrain = terrain;
        this.scene.add(terrain);
        
        const trees = await new GLTFLoader(this.renderer).load(TreeModel, 800);
        trees.material.useWind = 1;
        
        const pos = new Vector3();
        for (let i = 0; i < trees.count; i++) {
            const x = randomFloat(-90, 90);
            const z = randomFloat(-90, 90);
            const y = terrain.getHeightAt(x, z);
            pos.set(x, y, z);
            const scale = randomFloat(0.7, 1);
            trees.setPositionAt(pos, i);
            trees.setScaleAt(scale, i);
        }
        this.scene.add(trees);

        const floorGeometry = new PlaneGeometry(10, 10);
        const floorMaterial = new MeshPhongMaterial({ color: '#ffffff', shininess: 152 });  
        const floor = new Mesh(floorGeometry, floorMaterial);
        floor.scale.set(10, 10, 10);
        floor.rotation.x = -Math.PI / 2;
        floor.name = 'Floor';
        this.floor = floor;
        //this.scene.add(floor);
        //
    
        const bird = await new GLTFLoader(this.renderer).load(BirdModel);
        bird.material.color = new Color('#555555');
        const boids = new Boids(
            bird.geometry, 
            bird.material,
            500,
            new BoundingBox(new Vector3(-100, 20, -100), new Vector3(100, 100, 100))
        )
        this.boids = boids;
        this.scene.add(boids);
        
        const tower = await new GLTFLoader(this.renderer).load(TowerModel);
        tower.setScale(0.1);
        tower.position.y = 18;
        this.scene.add(tower);
        
        // const sphere = new Mesh(new SphereGeometry(1, 32, 32), new MeshPhongMaterial({ color: '#00ff00' }));
        // sphere.setPosition(2, 0.5, 0);
        // sphere.name = 'Sphere';
        // this.scene.add(sphere);
        
        //this.controls = new OrbitControls(this.camera, canvas);
        
        this.light = new DirectionalLight({intensity: 1 });
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
        const cameraDistance = 90;
        const cameraSpeed = 0.1;
        const cameraX = -Math.sin(this.elapsed * cameraSpeed) * cameraDistance;
        const cameraZ = Math.cos(this.elapsed * cameraSpeed) * cameraDistance;
        const cameraHeight = this.terrain.getHeightAt(cameraX, cameraZ) + 20;
        //this.scene.write(this.scene.data, 'scene');
        //console.log(this.scene.data.slice(20, 28))
        this.camera.setPosition(cameraX, cameraHeight, cameraZ);
        //this.light.rotation.y += 0.01;
        this.boids?.update(dt);
        //this.controls.update(dt);
        this.renderer.render(this.scene, this.camera);

    }
}

const app = new App();
app.init();
