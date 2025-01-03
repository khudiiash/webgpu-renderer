import Stats from "stats.js";
import { Renderer } from "./renderer/Renderer";
import { PerspectiveCamera } from "./cameras/PerspectiveCamera";
import { Scene } from "./core/Scene";
import { Mesh } from "./core/Mesh";
import { BoxGeometry } from "./geometry/BoxGeometry";
import { StandardMaterial } from "./materials/StandardMaterial";
import { Texture } from "./loaders/TextureLoader";
import { RenderableObject } from "./renderer/new/RenderableObject";
import { UniformData } from "./renderer/new/UniformData";
import { Vector3 } from "./math/Vector3";
import { Matrix4 } from "./math/Matrix4";
import { Color } from "./math/Color";

//import { MeshPhongMaterial } from "./materials/MeshPhongMaterial";
import { DirectionalLight } from "./lights/DirectionalLight";
// import { modMinMax, randomFloat } from "./math/MathUtils";
// import { Vector3 } from "./math/Vector3";
// import { GLTFLoader } from "./loaders/GLTFLoader";
// import { UniformLib } from "./renderer/shaders/UniformLib";
// import { Color } from "./math/Color";
// import { InstancedMesh } from "./core/InstancedMesh";
import { OrbitControls } from "./cameras/OrbitControls";
// import { Boids } from "./extra/Boids";
// import { BoundingBox } from "./math/BoundingBox";
// import { AnimationMixer } from "./animation/AnimationMixer";
// import { SkinnedMesh } from "./animation/SkinnedMesh";

// import TerrainModel from "../assets/terrain_2.glb";
// import TreeModel from "../assets/tree_3.glb";
// import { ShaderChunk } from "./renderer/shaders/ShaderChunks";
// import { Color } from "./math/Color";
// import { ShaderLibrary } from "./renderer/new/shaders/ShaderLibrary";
// import { Shader } from "./renderer/new/shaders/Shader";
// import { ShaderChunk } from "./renderer/new/shaders/ShaderChunk";

// import { Matrix4 } from "./math/Matrix4";
// import { randomFloat } from "./math/MathUtils";
// import { PipelineManager } from "./renderer/new/PipelineManager";
// import { GPUResourceManager } from "./renderer/new/GPUResourceManager";
// import { RenderableObject } from "./renderer/new/RenderableObject";


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

        this.camera = new PerspectiveCamera(45, this.renderer.aspect, 1, 500);
        this.camera.position.z = -20;
        this.camera.position.y = 20;
        this.camera.position.x = -20;
        this.camera.lookAt(0, 0, 0);
        this.camera.target.set(0, -25, 0);
        this.camera.name = 'MainCamera';
        this.scene.add(this.camera);
        const texture = new Texture('assets/box.png');
        const cube = new Mesh(new BoxGeometry(1, 1, 1), new StandardMaterial({ diffuse: 0xff0000, diffuse_map: texture }));
        this.cube = cube;
        this.scene.add(cube);
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
        const cameraDistance = 20;
        const cameraHeight = 5;
        const cameraSpeed = 0.1;

        const cameraX = -(Math.sin(this.elapsed * cameraSpeed) + 2) * cameraDistance;
        const cameraZ = (Math.cos(this.elapsed * cameraSpeed) + 2) * cameraDistance;
        const cameraY = (Math.sin(this.elapsed * cameraSpeed) + 2) * 5 + cameraHeight;

        //this.camera.setPosition(Math.cos(this.elapsed * cameraSpeed) * cameraDistance, cameraHeight, Math.sin(this.elapsed * cameraSpeed) * cameraDistance);
        this.stats.update(); 
        this.controls?.update(dt);
        this.renderer.render(this.scene, this.camera);
    }
}

const app = new App();
app.init();
