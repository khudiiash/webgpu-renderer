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
        terrain.name = 'Terrain';
        this.terrain = terrain;
        this.scene.add(terrain);
        
        const tower = await new GLTFLoader(this.renderer).load('../assets/tower.glb');
        tower.name = 'Tower';
        tower.setPosition(2, 4.9 * 3.33, 2);
        tower.setScale(0.1);
        this.tower = tower;
        this.scene.add(tower);
        const bird = await new GLTFLoader(this.renderer).load('../assets/bird.glb');
        bird.material.color = new Color(0.0, 0.0, 0.0, 1);
        this.boids = new Boids(
            bird.geometry,
            bird.material,
            300, 
            new BoundingBox(new Vector3(-100, 20, -100), new Vector3(100, 50, 100))
        );
        this.scene.add(this.boids);
        
        const starsCount = 1000;
        const stars = new InstancedMesh(new SphereGeometry(0.25, 8, 8), new MeshPhongMaterial({ color: '#ffffff', emissionColor: '#ffffff', emissionIntensity: 1, useFog: false }), starsCount);
        const distanceFromCenter = 200;
        for (let i = 0; i < starsCount; i++) {
            const radius = distanceFromCenter;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = Math.abs(radius * Math.cos(phi));
            const z = radius * Math.sin(phi) * Math.sin(theta);
            stars.setPositionAt(new Vector3(x, y, z), i);
            stars.setScaleAt(randomFloat(0.1, 0.5), i);
        }
        this.scene.add(stars);

        
        const trees = await new GLTFLoader(this.renderer).load('../assets/tree.glb', 2000);
        trees.name = 'Trees';
        const pos = new Vector3();
        for (let i = 0; i < trees.count; i++) {
            const x = randomFloat(-100, 100);
            const z = randomFloat(-100, 100);
            const y = terrain.getHeightAt(x, z);
            pos.set(x, y, z);
            trees.setPositionAt(pos, i);
            trees.setScaleAt(randomFloat(0.8, 1.2), i);
            trees.rotateYAt(randomFloat(0, Math.PI * 2), i);
            trees.rotateXAt(randomFloat(-0.1, 0.1), i);
            trees.rotateZAt(randomFloat(-0.1, 0.1), i);
            trees.setScaleAt(randomFloat(0.6, 0.8), i);
        }
        this.scene.add(trees);

        // const floorGeometry = new PlaneGeometry(10, 10);
        // const floorMaterial = new MeshPhongMaterial({ color: '#333333', shininess: 152 });  
        // const floor = new Mesh(floorGeometry, floorMaterial);
        // floor.rotation.x = -Math.PI / 2;
        // floor.name = 'Floor';
        // this.scene.add(floor);
        
        // const box = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshPhongMaterial({ color: '#ff0000', shininess: 152 }), 10);
        // for (let i = 0; i < 10; i++) {
        //     box.setPositionAt(new Vector3(randomFloat(-5, 5), 0.5, randomFloat(-5, 5)), i);
        // }
        // box.name = 'Box';
        // this.scene.add(box);
        // this.box = box;

        
        // Shadow alpha test
        // const plane = new Mesh(new PlaneGeometry(1, 1), new MeshPhongMaterial({ diffuseMap: await new TextureLoader(this.renderer).load('../assets/leaf.png') }));
        // plane.rotation.x = -Math.PI / 2;
        // plane.setPosition(0, 1, 0);
        // this.scene.add(plane);

    
        //this.controls = new OrbitControls(this.camera, canvas);
        
        this.light = new DirectionalLight({ intensity: 2 });
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
        const cameraHeight = 20;
        this.boids.update(dt);
        this.light.rotation.x = this.elapsed * 0.1 % Math.PI * 2;
        this.light.rotation.y = this.elapsed * 0.1 % Math.PI * 2;
        this.scene.needsUpdate = true;
        const cameraX = -Math.sin(this.elapsed * cameraSpeed) * cameraDistance;
        const cameraZ = Math.cos(this.elapsed * cameraSpeed) * cameraDistance;
        this.camera.setPosition(cameraX, this.terrain.getHeightAt(cameraX, cameraZ) + cameraHeight, cameraZ);
        //this.controls.update(dt);
        this.renderer.render(this.scene, this.camera);
        //console.log(this.camera.direction.print())

    }
}

const app = new App();
app.init();
