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
import { MathUtils } from "./math/MathUtils";
import { Vector3 } from "./math/Vector3";
import { GLBLoader } from "./loaders/GLBLoader";

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

        const floorGeometry = new PlaneGeometry(200, 200);
        const floorMaterial = new MeshPhongMaterial({ color: '#297734' });
        const floor = new Mesh(floorGeometry, floorMaterial);
        floor.name = 'Floor';
        this.scene.add(floor);

        // const geometry = new BoxGeometry(0.2, 1.5, 0.2); 
        // const material = new MeshPhongMaterial({ color: '#ff0000' });
        // const mesh = new Mesh(geometry, material);
        // mesh.name = 'Cube';
        // mesh.position.y = 0.5;
        // this.mesh = mesh;
        // this.scene.add(mesh);

        // let angle = 0;
        // let radius = 2;
        // const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8000', '#ff0080', '#80ff00', '#0080ff'];
        // const sphereColor = '#ffffff';
        // const sphereGeometry = new BoxGeometry(0.9, 0.9, 0.9);
        // const count = 100;
        // const sphereMaterial = new MeshPhongMaterial({ color: sphereColor });
        
        //const sphereMaterials = colors.map(color => new MeshPhongMaterial({ color }));
        // for (let i = 0; i < count; i++) {
        //     const childCube = new Mesh(sphereGeometry, sphereMaterial);
        //     childCube.rotation.y = Math.random() * Math.PI * 2;
        //     childCube.rotation.x = Math.random() * Math.PI * 2;

        //     childCube.position.x = Math.sin(angle) * radius * MathUtils.randFloat(1, 2)
        //     childCube.position.y = Math.sin(i) * Math.random();
        //     childCube.position.z = Math.cos(angle) * radius * MathUtils.randFloat(1, 2);
        //     childCube.name = 'ChildCubes';
        //     childCube.randValue = MathUtils.randFloat(0.1, 0.5);
        //     childCube.scale.set(childCube.randValue, childCube.randValue, childCube.randValue);
        //     angle += Math.PI * 2 / count;
        //     this.mesh.add(childCube);
        // }
        this.glbLoader = new GLBLoader(this.renderer);
        
        // const robot = await this.glbLoader.load('../assets/robot.glb');
        // robot.rotation.x = Math.PI / 2;
        // robot.rotation.y = Math.PI / 2;
        // this.scene.add(robot);
        
        // const barn = await this.glbLoader.load('../assets/barn.glb');
        // barn.setPosition(-25, 0, 10);
        // this.scene.add(barn);
        
        // const ground = await this.glbLoader.load('../assets/ground.glb');
        // ground.position.y = 0.01;
        // this.scene.add(ground);
        
        // const glb = await this.glbLoader.load('../assets/monkey.glb');
        // glb.name = 'Monkey';
        // glb.position.y = 1.5;
        // this.scene.add(glb);
        // this.glb = glb;
        

        // const trees = await this.glbLoader.load('../assets/trees.glb');
        // trees.rotation.y = Math.PI / 2;
        // trees.position.x = 15;
        // this.scene.add(trees);
        // trees.scale.set(1, 1, 1);
        
        // const boxTexture = await new TextureLoader(this.renderer).load('../assets/box.png');
        
        this.light = new DirectionalLight({ color: '#ffffff', intensity: 1.0 });
        this.light.name = 'DirectionalLight';

        this.light.setPosition(3, 5, 3);
        this.light.lookAt(0, 0, 0);
        this.light.direction.print();
        this.scene.add(this.light);
        
        const boxesMap = [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 1, 0, 0, 0, 0, 0, 1, 0, 1,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 1, 0, 1, 0, 0, 0, 1, 0, 1,
            0, 0, 1, 0, 0, 0, 0, 0, 0, 0,
            0, 1, 0, 1, 0, 0, 0, 1, 0, 1,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 1, 0, 1, 0, 0, 0, 1, 0, 1,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 1, 0, 0, 0, 0, 0, 1, 0, 1
        ];
        
        // const walls = await this.glbLoader.load('../assets/walls.glb');
        // walls.position.y = 0.01;
        // this.scene.add(walls);
        

        // boxes
        const boxGeometry = new BoxGeometry(4, 4, 4);
        const boxMaterial = new MeshPhongMaterial({ diffuseMap: boxTexture });
        this.lightRot = new Vector3(0, 0, 0);
        
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                if (boxesMap[row * 10 + col] === 1) {
                    const box = new Mesh(boxGeometry, boxMaterial);
                    const rotation = MathUtils.randFloat(0, Math.PI * 2);
                    box.rotation.y = rotation;
                    box.position.set((col - 5 + Math.random()) * 4, 2, (row - 5 + Math.random()) * 4);
                    box.name = 'Box';
                    this.scene.add(box);

                }
            }
        }
        this.cameraMove = new Vector3(0, 0, 0);
        window.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'w':
                    this.cameraMove.z = -1;
                    break;
                case 's':
                    this.cameraMove.z = 1;
                    break;
                case 'a':
                    this.cameraMove.x = -1;
                    break;
                case 'd':
                    this.cameraMove.x = 1;
                    break;
                case 'ArrowUp':
                    this.cameraMove.y = 1;
                    break;
                case 'ArrowDown':
                    this.cameraMove.y = -1;
                    break;
                case 'ArrowLeft':
                    this.light.rotation.y += 0.1;
                    this.light.updateMatrixWorld(true, false);
                    this.light.shadow.camera.updateViewMatrix();
                    break;
                case 'ArrowRight':
                    this.light.rotation.y -= 0.1;
                    this.light.updateMatrixWorld(true, false);
                    this.light.shadow.camera.updateViewMatrix();
                    break;
            }
        });
        window.addEventListener('keyup', (e) => {
            switch (e.key) {
                case 'w':
                case 's':
                    this.cameraMove.z = 0;
                    break;
                case 'a':
                case 'd':
                    this.cameraMove.x = 0;
                    break;
                case 'ArrowUp':
                case 'ArrowDown':
                    this.cameraMove.y = 0;
                    break;
            }
        });
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
        //this.mesh.rotation.y += dt * 0.1; this.glb.rotation.x = Math.sin(this.elapsed * 5) * 0.2; this.glb.rotation.y = Math.cos(this.elapsed * 5) * 0.2;
        // move camera relative to its direction
        // if pressing w, move in the camera's direction
        // if pressing a, move left relative to the camera's direction
        //  if pressing s, move back relative to the camera's direction
        //  if pressing d, move right relative to the camera's direction
        //  if pressing up arrow, move up
        //   if pressing down arrow, move down
       
        const moveSpeed = dt * 10; // Adjust speed as necessary
        const direction = this.cameraMove.clone();
        direction.applyQuaternion(this.camera.quaternion);
        this.camera.position.add(direction.mulScalar(moveSpeed))
        
       

        //this.redCube.lookAt(this.camera.position);
        // this.light.setPosition(Math.sin(this.elapsed * 0.2) * 50, 50, Math.cos(this.elapsed * 0.2) * 50);
        // this.light.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.light.shadow.camera);

        }
}

const app = new App();
app.init();
