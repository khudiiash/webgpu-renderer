import Stats from "stats.js";
import { Renderer } from "./renderer/Renderer";
import { PerspectiveCamera } from "./cameras/PerspectiveCamera";
import { Scene } from "./core/Scene";
import { PlaneGeometry } from "./geometry/PlaneGeometry";
import { SphereGeometry } from "./geometry/SphereGeometry";
import { Mesh } from "./core/Mesh";
import { MeshPhongMaterial } from "./materials/MeshPhongMaterial";
import { DirectionalLight } from "./lights/DirectionalLight";
import { VoxelConeTracingGI } from './lights/VoxelConeTracingGI';
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
import { GrassGeometry } from "./geometry/GrassGeometry";
import MountainsModel from "../assets/mountains.glb";
import TerrainModel from "../assets/terrain_2.glb";
import TreeModel from "../assets/tree.gltf";
import PineModel from "../assets/pine.glb";
import GrassModel from "../assets/grass.glb";
import CastleModel from "../assets/castle_09.glb";
import { FragmentChunk, ShaderChunk } from "./renderer/shaders/ShaderChunks";
import { BoxGeometry } from "./geometry/BoxGeometry";
import { TextureLoader } from "./loaders/TextureLoader";
import { Material } from "./materials/Material";
import { FirstPersonControls } from "./cameras/FirstPersonControls";
import { Quaternion } from "./math/Quaternion";

const _vec = new Vector3();

class App {

    createPatchesOfGrass(center, grassCount, areaToCover, terrain) {
        const grass = new InstancedMesh(new GrassGeometry(4, 0.2, 1), new MeshPhongMaterial({color: '#9DA326'}), grassCount);
        const quat = new Quaternion();
        const positions = [];
        const rotations = [];
        const scales = [];
        for (let i = 0; i < grassCount; i++) {
            const x = randomFloat(center.x - areaToCover, center.x + areaToCover);
            const z = randomFloat(center.z - areaToCover, center.z + areaToCover);
            const y = terrain.getHeightAt(x, z);
            positions.push(x, y, z);
            quat.setFromEulerAngles(randomFloat(-0.3, 0.3), randomFloat(-Math.PI, Math.PI), randomFloat(-0.3, -0.5));
            rotations.push(quat.x, quat.y, quat.z, quat.w);
            scales.push(randomFloat(0.1, 2.5));
        }
        grass.material.useWind = true;
        grass.material.windHeight = 2.5;
        grass.material.windStrength = 50;
        grass.material.ambientIntensity = 1.0;
        
        grass.setAllPositionsArray(positions);
        grass.setAllRotationsArray(rotations);
        grass.setAllScalesArray(scales);
        
        grass.material.chunks.fragment.push(new FragmentChunk('fragment_diffuse_map', `
            let noise = noise2D(input.vPositionW.xz * 0.02) * 0.3 + 1.0;
            let y = 1.0;
            color = vec4f(color.r * noise * y, color.g * noise * y, color.b * y * noise, 1.0);
        `));
        return grass;
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
        
        this.camera = new PerspectiveCamera(50, this.renderer.aspect, 0.1, 600);
        this.camera.position.z = -20;
        this.camera.position.y = 20;
        this.camera.position.x = -20;
        this.camera.lookAt(0, 0, 0);
        this.camera.target.set(0, -25, 0);
        this.camera.name = 'MainCamera';
        this.scene.add(this.camera);
        
        const terrain = await new GLTFLoader(this.renderer).loadMesh(TerrainModel);
        terrain.material.diffuseMap = this.renderer.textures.getTexture('default');
        terrain.setScale(4);
        this.terrain = terrain;
        this.scene.add(terrain);
        terrain.initializeSpatialGrid(64);
        terrain.isCulled = false;
        
        const trees = await new GLTFLoader(this.renderer).load(TreeModel, 50);
        const positions = [];
        const rotations = [];
        const scales = [];
        const quat = new Quaternion();
        for (let i = 0; i < trees.instancedMeshes[0].count; i++) {
            const x = randomFloat(-400, 400);
            const z = randomFloat(-400, 400);
            const y = terrain.getHeightAt(x, z);
            positions.push(x, y, z);
            scales.push(randomFloat(2, 3));
            quat.setFromEulerAngles(0, randomFloat(0, Math.PI * 2), 0);
            rotations.push(quat.x, quat.y, quat.z, quat.w);
        }
        trees.instancedMeshes.forEach(instancedMesh => {
            instancedMesh.material.alphaTest = 0.2;
            instancedMesh.material.ambientIntensity = 2.0;
            instancedMesh.setAllPositionsArray(positions);
            instancedMesh.setAllScalesArray(scales);
            instancedMesh.setAllRotationsArray(rotations);
            this.scene.add(instancedMesh);
        });

        const patchSize = 400;
        const area = 800;
        for (let x = -area / 2; x < area / 2; x += patchSize) {
            for (let z = -area / 2; z < area / 2; z += patchSize) {
                this.scene.add(this.createPatchesOfGrass({x: x + patchSize * 0.5, z: z + patchSize * 0.5 }, 1_000_000, patchSize / 2, terrain));
            }
        }
        
        this.light = new DirectionalLight({intensity: 1.0 });
        this.light.name = 'MyDirectionalLight';
        this.light.rotation.x = -Math.PI / 3; 
        this.light.rotation.y = -0.3;
        this.scene.add(this.light);

        // Add FirstPersonControls
        this.controls = new FirstPersonControls(this.camera, canvas);
        
        // Initialize GI system (VoxelConeTracingGI)
        this.giSystem = new VoxelConeTracingGI(this.renderer);
        this.giSystem.init();

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
        this.controls?.update(dt);
        
        // Update camera position with terrain height
        this.camera.setPosition(this.camera.position.x, this.terrain.getHeightAt(this.camera.position.x, this.camera.position.z) + 10, this.camera.position.z);
        
        // Call the GI system before rendering the scene
        this.renderer.render(this.scene, this.camera, (pass) => {
            // Add global illumination (Voxel Cone Tracing)
            this.giSystem.runGI(pass); // Perform voxelization, cone tracing, and GI integration
        });
    }
}

const app = new App();
app.init();