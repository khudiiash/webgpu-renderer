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
import TerrainModel from "../assets/terrain_2.glb";
import TowerModel from "../assets/tower.glb";
import TreeModel from "../assets/tree_3.glb";
import LowTree1Model from "../assets/low_tree_1.glb";
import LowTree2Model from "../assets/low_tree_2.glb";
import LowTree3Model from "../assets/low_tree_3.glb";
import PineModel from "../assets/pine.glb";
import CloudModel from "../assets/cloud.glb";
import FoxModel from "../assets/fox.glb";
import CubeSkinned from "../assets/cube_skinned_2.glb";
import WhaleModel from "../assets/whale.glb";
import KnightModel from "../assets/knight.glb";
import StreetScene from "../assets/street_scene.glb";
import CastleModel from "../assets/castle_09.glb";
import GirlModel from "../assets/girl.glb";
import ZergModel from "../assets/zerg.glb";
import TrizModel from "../assets/triz.glb";
import { GrassGeometry } from "./geometry/GrassGeometry";
import { ShaderChunk } from "./renderer/shaders/ShaderChunks";

const _vec = new Vector3();

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

        this.camera = new PerspectiveCamera(50, this.renderer.aspect, 1, 100);
        this.camera.position.z = 20;
        this.camera.position.y = 20;
        this.camera.position.x = -20;
        this.camera.lookAt(0, 0, 0);
        this.camera.name = 'MainCamera';
        this.scene.add(this.camera);
        
        const grassGeometry = new GrassGeometry(3, 0.2, 1);
        
        const grassMaterial = new MeshPhongMaterial({color: '#859b45' });
        grassMaterial.chunks.fragment.push(new ShaderChunk('grass', `
            let noise = 1.0 - noise2D(input.vPositionW.xz * 0.05) + 1.0;
            // fake ao
            let ao = (1.0 - abs(2.0 * input.vUv.x - 1.0)) + 1.0;
            let r = noise2D(input.vPositionW.xz * 0.1) * 0.1;
            let g = noise2D(input.vPositionW.xz * 0.1) * 0.1;
            let c = vec3(color.r + r, color.g + g, color.b);

            
            color = vec4(c * ao * noise * (input.vUv.y * 0.3), 1.0);
        `))
        grassMaterial.useWind = true;
        grassMaterial.windStrength = 34;
        grassMaterial.windHeight = 2.5;
        grassMaterial.windDirection = new Vector3(1, 0, 1).normalize();
        const grass = new InstancedMesh(grassGeometry, grassMaterial, 150000);
        this.grass = grass;
        this.scene.add(grass);
        const pos = new Vector3();
        
        const treeScene = await new GLTFLoader(this.renderer).load(TreeModel);
        treeScene.scene.setScale(1.5);
        treeScene.scene.setPosition(3, 0, 4);
        treeScene.scene.children.forEach(child => {
            if (child.isMesh) {
                child.material.useWind = true;
                child.material.windStrength = 1; 
                child.material.windHeight = 20;
                child.material.windDirection = new Vector3(1, 0, 1).normalize();
                child.material.cullMode = 'none';
            }
        })
        this.scene.add(treeScene.scene);
        
        
        const knight = await new GLTFLoader(this.renderer).load(KnightModel);
        knight.scene.position.set(-2, 0, -5);
        knight.scene.setScale(4);
        knight.scene.rotation.y = -Math.PI / 2;
        knight.scene.traverse((child) => {
            if (child.isMesh) {
                child.material.ambientIntensity = 5;
            }
        });
        this.knightMixer = new AnimationMixer(knight.scene);
        this.knightMixer.addAnimation(knight.animations[0]).playAtIndex(0);
        this.scene.add(knight.scene);

        const zerg = await new GLTFLoader(this.renderer).load(ZergModel);
        zerg.scene.position.set(-8, 0, 5);
        zerg.scene.setScale(3);
        zerg.scene.rotation.y = -Math.PI / 2;
        zerg.scene.traverse((child) => {
            if (child.isMesh) {
                child.material.ambientIntensity = 5;
            }
        });
        this.zergMixer = new AnimationMixer(zerg.scene);
        this.zergMixer.addAnimation(zerg.animations[0]).playAtIndex(0);
        this.scene.add(zerg.scene);

        const girl = await new GLTFLoader(this.renderer).load(GirlModel);
        girl.scene.position.set(-5, 0, 9);
        girl.scene.setScale(3);
        girl.scene.rotation.y = -Math.PI / 2;
        girl.scene.traverse((child) => {
            if (child.isMesh) {
                child.material.ambientIntensity = 3;
            }
        });
        this.girlMixer = new AnimationMixer(girl.scene);
        this.girlMixer.addAnimation(girl.animations[1]).playAtIndex(0);
        this.scene.add(girl.scene);

        const triz = await new GLTFLoader(this.renderer).load(TrizModel);
        triz.scene.position.set(-8, 0, -6);
        triz.scene.setScale(3);
        triz.scene.rotation.y = Math.PI / 2;
        triz.scene.traverse((child) => {
            if (child.isMesh) {
                child.material.ambientIntensity = 3;
            }
        });
        this.trizMixer = new AnimationMixer(triz.scene);
        this.trizMixer.addAnimation(triz.animations[0]).playAtIndex(0);
        this.scene.add(triz.scene);

        const fox = await new GLTFLoader(this.renderer).load(FoxModel);
        fox.scene.position.set(-6, 0, -12);
        fox.scene.rotation.y = Math.PI / 3;
        fox.scene.setScale(4);
        fox.scene.lookAt(knight.scene.position);
        // fox.scene.traverse((child) => {
        //     if (child.isMesh) {
        //         child.material.ambientIntensity = -1;
        //     }
        // });
        
        this.scene.add(fox.scene);
        this.foxMixer = new AnimationMixer(fox.scene);
        this.foxMixer.addAnimation(fox.animations[0]).playAtIndex(0);
         


        for (let i = 0; i < grass.count; ++i) {
            pos.x = randomFloat(-25, 25);
            pos.z = randomFloat(-25, 25);
            pos.y = 0;
            const scale = randomFloat(0.5, 1);
            grass.setPositionAt(pos, i);
            grass.setScaleAt(scale, i);
            grass.rotateYAt(randomFloat(0, Math.PI * 2), i);
            grass.rotateXAt(randomFloat(-Math.PI * 0.1, Math.PI * 0.1), i);
            grass.rotateZAt(randomFloat(-Math.PI * 0.1, Math.PI * 0.1), i);
        }   
        
        const trees = [TreeModel];
        

        for (const treeModel of trees) {
            const treeScene = await new GLTFLoader(this.renderer).load(treeModel, 100);
            const rot = new Vector3();
            for (let i = 0; i < treeScene.instancedMeshes[0].count; ++i) {
                pos.x = randomFloat(-25, 25);
                pos.z = randomFloat(-25, 25);
                pos.y = 0;
                rot.y = randomFloat(0, Math.PI * 2);
                const scale = randomFloat(0.1, 0.2);

                for (let j = 0; j < treeScene.instancedMeshes.length; ++j) {
                    const inst = treeScene.instancedMeshes[j];
                    inst.setPositionAt(pos, i);
                    inst.rotateYAt(rot.y, i);
                    inst.setScaleAt(scale, i);
                }
            }
            // treeScene.instancedMeshes.forEach(inst => {
            //     this.scene.add(inst)
            //     inst.material.useWind = true;
            //     inst.material.windStrength = 15;
            //     inst.material.windHeight = 30;
            // });

        }


        const floor = new Mesh(new PlaneGeometry(50, 50), new MeshPhongMaterial({color: '#000000' }));
        floor.rotation.x = Math.PI / 2;
        this.scene.add(floor);

        this.light = new DirectionalLight({intensity: 1.5 });
        this.light.name = 'MyDirectionalLight';
        this.light.rotation.x = -Math.PI / 4; 
        this.light.rotation.y = -0.3;
        this.scene.add(this.light);
        this.controls = new OrbitControls(this.camera, canvas);
        
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
        // const cameraDistance = 10;
        // const cameraHeight = 5;
        // const cameraSpeed = 0.2;

        // const cameraX = -(Math.sin(this.elapsed * cameraSpeed) + 2) * cameraDistance;
        // const cameraZ = (Math.cos(this.elapsed * cameraSpeed) + 2) * cameraDistance;
        // const cameraY = (Math.sin(this.elapsed * cameraSpeed) + 2) * 5 + cameraHeight;
        // this.camera.setPosition(cameraX, cameraY, cameraZ);
        this.foxMixer.update(dt);
        this.knightMixer.update(dt);
        this.zergMixer.update(dt);
        this.girlMixer.update(dt);
        this.trizMixer.update(dt);
        this.stats.update(); 
        this.controls?.update(dt);
        this.renderer.render(this.scene, this.camera);
    }
}

const app = new App();
app.init();
