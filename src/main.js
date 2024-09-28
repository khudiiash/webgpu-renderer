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
import CloudModel from "../assets/cloud.glb";

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
        const pos = new Vector3();
        
        const terrain = await new GLTFLoader(this.renderer).load(TerrainModel);
        terrain.setPosition(0, 0, 0);
        this.terrain = terrain;
        this.scene.add(terrain);
        
        const trees = await new GLTFLoader(this.renderer).load(TreeModel, 800);
        trees.material.useWind = 1;
        
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
        const floorMaterial = new MeshPhongMaterial({ color: '#222222', shininess: 152 });  
        const floor = new Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.name = 'Floor';
        this.floor = floor;
        this.scene.add(floor);
        
        // const box = new Mesh(
        //     new BoxGeometry(1, 1, 1),
        //     new MeshCloudMaterial({ color: '#ffffff' })
        // );
        
        // box.position.set(0, 1, 0);
        // box.setScale(2);
        // this.scene.add(box);
        
        const cloud = await new GLTFLoader(this.renderer).load(CloudModel, 500);
        this.clouds = cloud;
        for (let i = 0; i < cloud.count; i++) {
            const x = randomFloat(-200, 200);
            const z = randomFloat(-200, 200);
            const y = randomFloat(45, 60);
            pos.set(x, y, z);
            const rotation = randomFloat(0, Math.PI * 2);
            const scale = randomFloat(1, 5);
            cloud.setScaleAt(scale, i);
            cloud.rotateYAt(rotation, i);
            cloud.setPositionAt(pos, i);
        }
        cloud.material.useWind = 1
        cloud.setPosition(0, 2, 0);
        this.scene.add(cloud);

         
    
        const bird = await new GLTFLoader(this.renderer).load(BirdModel);
        bird.material.color = new Color('#555555');
        const boids = new Boids(
            bird.geometry, 
            bird.material,
            1000,
            new BoundingBox(new Vector3(-100, 20, -100), new Vector3(100, 100, 100))
        )
        this.boids = boids;
        this.scene.add(boids);
        
        const tower = await new GLTFLoader(this.renderer).load(TowerModel);
        tower.setScale(0.1);
        tower.position.y = 18;
        this.scene.add(tower);
        
        this.controls = new OrbitControls(this.camera, canvas);
        
        this.light = new DirectionalLight({intensity: 2 });
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
        const cameraSpeed = 0.05;
        const cameraX = -Math.sin(this.elapsed * cameraSpeed) * cameraDistance;
        const cameraZ = Math.cos(this.elapsed * cameraSpeed) * cameraDistance;
        const cameraHeight = this.terrain.getHeightAt(cameraX, cameraZ) + 15;
        //this.scene.write(this.scene.data, 'scene');
        //console.log(this.scene.data.slice(20, 28))
        this.camera.setPosition(cameraX, cameraHeight, cameraZ);
        //this.light.rotation.y += 0.01;
        for (let i = 0; i < this.clouds.count; i++) {
            const pos = this.clouds.getPositionAt(i);
            pos.x += this.scene.wind.direction.x * dt * pos.y / 100 * 10;
            if (pos.x > 200) {
                pos.x = -200;
            }
            pos.z += this.scene.wind.direction.z * dt * pos.y / 100 * 10;
            if (pos.z > 200) {
                pos.z = -200;
            }
            this.clouds.setPositionAt(pos, i);
        }
        this.boids?.update(dt);
        //this.controls.update(dt);
        this.renderer.render(this.scene, this.camera);

    }
}

const app = new App();
app.init();
