import Stats from "stats.js";
import { Renderer } from "./renderer/Renderer";
import { PerspectiveCamera } from "./cameras/PerspectiveCamera";
import { Scene } from "./core/Scene";
import { PlaneGeometry } from "./geometry/PlaneGeometry";
import { Mesh } from "./core/Mesh";
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

import TerrainModel from "../assets/terrain_2.glb";
import TreeModel from "../assets/tree_3.glb";
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

        this.camera = new PerspectiveCamera(50, this.renderer.aspect, 1, 80);
        this.camera.position.z = -20;
        this.camera.position.y = 20;
        this.camera.position.x = -20;
        this.camera.lookAt(0, 0, 0);
        this.camera.target.set(0, -25, 0);
        this.camera.name = 'MainCamera';
        this.scene.add(this.camera);
        

        const floor = new Mesh(new PlaneGeometry(80, 80), new MeshPhongMaterial({color: '#ffffff' }));
        floor.rotation.x = Math.PI / 2;
        //this.scene.add(floor);
        
        const terrain = await new GLTFLoader(this.renderer).loadMesh(TerrainModel);
        terrain.isCulled = false;
        terrain.material.ambientIntensity = 2.0;
        this.scene.add(terrain);
        
        
        const trees = await new GLTFLoader(this.renderer).load(TreeModel, 4000);
        const pos = new Vector3();
        
        for (let i = 0; i < trees.instancedMeshes[0].count; i++) {
            pos.set(randomFloat(-100, 100), 0, randomFloat(-100, 100));
            pos.y = terrain.getHeightAt(pos.x, pos.z);
            let scale = randomFloat(0.1, 0.3);
            let rotation = randomFloat(0, Math.PI * 2);

            for (let j = 0; j < trees.instancedMeshes.length; j++) {
                if (pos.y > 15) {
                    scale = 0;  
                }
                trees.instancedMeshes[j].setPositionAt(pos, i);
                trees.instancedMeshes[j].setScaleAt(scale, i);
                trees.instancedMeshes[j].rotateYAt(rotation, i);
            }
        }
        
        // const clouds = await new GLTFLoader(this.renderer).loadMesh(CloudModel, 100);
        // clouds.material.ambientIntensity = 20.0;
        // clouds.isCulled = false;

        // for (let i = 0; i < clouds.count; i++) {
        //     pos.set(randomFloat(-100, 100), randomFloat(30, 50), randomFloat(-100, 100));
        //     clouds.setPositionAt(pos, i);
        //     clouds.setScaleAt(randomFloat(3, 5), i); 
        //     clouds.rotateYAt(randomFloat(0, Math.PI * 2), i);
        //     clouds.rotateXAt(randomFloat(0, Math.PI * 2), i);

        // }
        
        // this.scene.add(clouds);

        trees.instancedMeshes.forEach((tree, i) => {
            // tree.material.useWind = true;
            // tree.material.windHeight = 35;
            // tree.material.windStrength = 40;
            if (i === 1) {
                tree.material.chunks.fragment.splice(4, 0, new ShaderChunk('color_variation', `
                    let worldNoise = noise2D(input.vPositionW.xz * 0.1);
                    // slightly vary between yellow and green based on noise
                    let new_color = vec4f(mix(vec3(0.8, 0.5, 0.2), vec3(0.3, 0.5, 0.2), worldNoise), color.a);
                    color = vec4f(color.rgb * new_color.rgb, color.a);
                `));
                tree.material.ambientIntensity = 8.0;
            }
            this.scene.add(tree)
        });
        
        
        this.light = new DirectionalLight({intensity: 1.0 });
        this.light.name = 'MyDirectionalLight';
        this.light.rotation.x = -Math.PI / 4; 
        this.light.rotation.y = -0.3;
        this.scene.add(this.light);
        //this.controls = new OrbitControls(this.camera, canvas);
        
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
        const cameraDistance = 35;
        const cameraHeight = 40;
        const cameraSpeed = 0.2;

        const cameraX = -(Math.sin(this.elapsed * cameraSpeed) + 2) * cameraDistance;
        const cameraZ = (Math.cos(this.elapsed * cameraSpeed) + 2) * cameraDistance;
        const cameraY = (Math.sin(this.elapsed * cameraSpeed) + 2) * 5 + cameraHeight;
        this.camera.setPosition(Math.cos(this.elapsed * cameraSpeed) * cameraDistance, cameraHeight, Math.sin(this.elapsed * cameraSpeed) * cameraDistance);
        this.stats.update(); 
        //this.controls?.update(dt);
        this.renderer.render(this.scene, this.camera);
    }
}

const app = new App();
app.init();
