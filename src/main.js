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
import { InstancedMesh } from "./core/InstancedMesh";
import { OrbitControls } from "./cameras/OrbitControls";
import { Boids } from "./extra/Boids";
import { BoundingBox } from "./math/BoundingBox";
import { AnimationMixer } from "./animation/AnimationMixer";
import { SkinnedMesh } from "./animation/SkinnedMesh";

import CowModel from "../assets/cow.gltf";
import BirdModel from "../assets/bird.glb";
import TerrainModel from "../assets/terrain.gltf";
import TowerModel from "../assets/tower.glb";
import TreeModel from "../assets/tree.glb";
import CloudModel from "../assets/cloud.glb";
import FoxModel from "../assets/fox.glb";
import CubeSkinned from "../assets/cube_skinned_2.glb";
import WhaleModel from "../assets/whale.glb";
import KnightModel from "../assets/knight.glb";

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

        this.camera = new PerspectiveCamera(50, this.renderer.aspect, 0.1, 150);
        this.camera.position.z = 2;
        this.camera.position.y = 2;
        this.camera.position.x = -1;
        this.camera.lookAt(0, 0, 0);
        this.camera.name = 'MainCamera';
        this.scene.add(this.camera);
        const pos = new Vector3();
        
        const terrain = await new GLTFLoader(this.renderer).loadMesh(TerrainModel);
        terrain.material.ambientIntensity = -5;
        terrain.setPosition(0, 0, 0);
        this.terrain = terrain;
        this.scene.add(terrain);
        
        const trees = await new GLTFLoader(this.renderer).loadMesh(TreeModel, 500);
        trees.material.useWind = 1;
        trees.material.ambientIntensity = -3;
        for (let i = 0; i < trees.count; i++) {
            let xr = randomFloat(-80, 80);
            let zr = randomFloat(-80, 80);
            const distFromCenter = Math.sqrt(xr * xr + zr * zr);
            xr += distFromCenter < 10 ? randomFloat(10, 15) : 0;
            zr += distFromCenter < 10 ? randomFloat(10, 15) : 0;

            const x = xr;
            const z = zr;
            const y = terrain.getHeightAt(x, z);
            pos.set(x, y, z);
            trees.rotateYAt(randomFloat(-1, 1), i);
            trees.rotateZAt(randomFloat(-0.2, 0.2), i);
            trees.rotateXAt(randomFloat(-0.2, 0.2), i);
            const scale = randomFloat(0.6, 1.5);
            trees.setPositionAt(pos, i);
            trees.setScaleAt(scale, i);
        }
        this.scene.add(trees);

        const cloud = await new GLTFLoader(this.renderer).loadMesh(CloudModel, 100);
        cloud.material.ambientIntensity = 18;
        cloud.material.useWind = true;
        this.clouds = cloud;
        for (let i = 0; i < cloud.count; i++) {
            const x = randomFloat(-220, 220);
            const z = randomFloat(-220, 220);
            const y = randomFloat(60, 85) + this.terrain.getHeightAt(x, z);

            pos.set(x, y, z);
            const rotation = randomFloat(0, Math.PI * 2);
            const scale = randomFloat(3, 5);
            cloud.setScaleAt(scale, i);
            cloud.rotateYAt(rotation, i);
            cloud.setPositionAt(pos, i);
        }
        cloud.setPosition(0, 2, 0);
        this.scene.add(cloud);
         
    
        const bird = await new GLTFLoader(this.renderer).loadMesh(BirdModel);
        bird.material.color = new Color('#999999');
        const boids = new Boids(
            bird.geometry, 
            bird.material,
            1000,
            new BoundingBox(new Vector3(-100, 20, -100), new Vector3(100, 100, 100)),
            this.camera
        )
        this.boids = boids;
        this.scene.add(boids);
        
        const tower = await new GLTFLoader(this.renderer).loadMesh(TowerModel);
        tower.setScale(5);
        tower.rotation.y = -Math.PI / 2;
        tower.material.ambientIntensity = 2;
        // tower.setScale(0.1);
        tower.position.x = 16.4;
        this.scene.add(tower);
        
        //this.controls = new OrbitControls(this.camera, canvas);
        
        this.light = new DirectionalLight({intensity: 2 });
        this.light.name = 'MyDirectionalLight';
        this.light.rotation.set(-1.2, -0.2, 0);
        this.scene.add(this.light);

        const floorGeometry = new PlaneGeometry(200, 200);
        const floorMaterial = new MeshPhongMaterial({ color: '#ffffff' });  
        const floor = new Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = Math.PI / 2;
        floor.name = 'Floor';
        this.floor = floor;
        //this.scene.add(floor);
        
        const gltf = await new GLTFLoader(this.renderer).load(KnightModel);
        const knight = gltf.scene;
        knight.setScale(2);
        knight.position.x = tower.position.x + 1;
        knight.position.z = tower.position.z;
        knight.position.y = 26.6;
        this.skinned = knight.find((child) => child instanceof SkinnedMesh);
        this.skinned.forEach(s => s.rotation.y = Math.PI);
        this.skinned.forEach(skinned => skinned.material.ambientIntensity = 4);
        this.scene.add(knight);


        const mixer = new AnimationMixer(knight);
        this.mixer = mixer;
        for (const clip of gltf.animations) {
            mixer.addAnimation(clip);
        }

        mixer.play(gltf.animations.at(-1).name, { loop: true });

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
        const cameraDistance = 95;
        const cameraSpeed = 0.2;
        const cameraX = -Math.sin(this.elapsed * cameraSpeed) * cameraDistance;
        const cameraZ = Math.cos(this.elapsed * cameraSpeed) * cameraDistance;
        this.mixer?.update(dt);
        const currentY = this.camera.position.y;
        const cameraHeight = 46;
        this.camera.setPosition(cameraX, cameraHeight, cameraZ);
        this.camera.target.set(0, Math.sin(this.elapsed * 0.2) * 5 + 25, 0);
        for (let i = 0; i < this.clouds?.count; i++) {
            const pos = this.clouds.getPositionAt(i);
            pos.x += 1 * dt * pos.y / 100 * 5;
            if (pos.x > 200) {
                pos.x = -200;
            }

            this.clouds.setPositionAt(pos, i);
        }
        this.skinned?.forEach(s => s.update());
        this.boids?.update(dt);
        //this.controls?.update(dt);
        this.renderer.render(this.scene, this.camera);
    }
}

const app = new App();
app.init();
