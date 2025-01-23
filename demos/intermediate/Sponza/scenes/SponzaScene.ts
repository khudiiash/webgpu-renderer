import { Scene } from '@/core/Scene';
import { PerspectiveCamera } from '@/camera/PerspectiveCamera';
import { Vector3 } from '@/math';
import { Mesh } from '@/core/Mesh';
import { Geometry, PlaneGeometry, SphereGeometry } from '@/geometry';
import { StandardMaterial } from '@/materials/StandardMaterial';
import { ShaderChunk } from '@/materials';
import { GLTFLoader } from '@/util/loaders/GLTFLoader';
import { PointLight } from '@/lights/PointLight';
import { BoxGeometry } from '@/geometry/BoxGeometry';
import { rand } from '@/util';
import { Engine } from '@/engine/Engine';

export class SponzaScene {
    private scene!: Scene;
    private camera!: PerspectiveCamera;
    private particles!: Mesh;
    private point!: PointLight;
    private redCube!: PointLight;
    private elapsed: number = 0;
    private last: number = performance.now();
    private engine : Engine;

    constructor(engine : Engine) {
        this.engine = engine;
    }

    async init() {
        this.setupScene();
        this.setupCamera();
        await this.setupSponza();
        this.setupLights();
        this.setupGrass();
        this.setupParticles();
    }

    private setupCamera() {
        this.camera = new PerspectiveCamera(40, this.engine.settings.width / this.engine.settings.height, 0.1, 1000);
        this.camera.lookAt(Vector3.left);
        this.camera.position.setXYZ(100, 30, 0);
        this.scene.add(this.camera);
    }

    private setupScene() {
        this.scene = new Scene();
        this.scene.backgroundColor.setHex(0x111111);
        this.scene.ambientColor.set([0.05, 0.05, 0.05, 1]);
        this.scene.fog.color.setHex(0x111111);
        this.scene.fog.start = 300;
        this.scene.fog.end = 2000;
    }

    private async setupGrass() {
        // GRASS MATERIAL (EXTENDED STANDARD MATERIAL)
        const grassMat = new StandardMaterial({ diffuse: '#aaaa00', metalness: 0.1, roughness: 0.1,  transmission: 1.0, cullMode: 'back' });

        const grassChunk = new ShaderChunk('Grass', `
            @group(Global) @binding(Scene)
            @include(Noise)

            @vertex(after:world_position) {{
                if (input.vertex_index == 2) {
                    // noise patches
                    worldPosition = getWorldPosition(position, model);
                    let noise = perlinNoise(worldPosition.xz * 0.15) * 0.5 + 0.5;
                    position.y += noise;

                    // wind animation
                    let wind = perlinNoise(worldPosition.xz * 0.005) * 0.5 + 0.5;
                    let windStrength = sin(scene.time * 2.0 + wind * 100.0) * position.y;
                    position.x += windStrength;
                    position.z += windStrength;
                }
            }}
            @fragment(after:gamma) {{
                let colorNoise = perlinNoise(input.vPositionW.xz * 0.1) * 0.5 + 0.5;
                let color1 = vec3(color.rgb * vec3(4.0, 4.0, 1.0));
                let color2 = vec3(color.rgb * vec3(0.8, 0.8, 0.0));
                let mixed = vec4f(mix(color1, color2, colorNoise), color.a);
                color = vec4f(mix(color.rgb, mixed.rgb, colorNoise), color.a);
                color = vec4(color.rgb * 0.5 * input.vUv.y, 1.0);
            }}
        `);
        
        grassMat.addChunk(grassChunk);

        // GRASS GEOMETRY
        const triangleGeometry = new Geometry();
        triangleGeometry.setFromArrays({
            positions: [ -1, 0, 0, 1, 0, 0, 0, 1, 0, ],
            normals: [ 0, 0, -1, 0, 0, -1, 0, 0, -1 ],
            uvs: [ 0, 0, 1, 0, 0.5, 1 ],
            indices: [0, 2, 1]
        });

        // GRASS MESH
        const grass = new Mesh(triangleGeometry, grassMat, 100_000);

        // GRASS TRANSFORMS
        const rangeX = 280;
        const rangeZ = 50;
        grass.setAllPositions(Array.from({ length: grass.count }, (_, i) => [rand(-rangeX, rangeX), 0, rand(-rangeZ, rangeZ)]).flat());
        grass.setAllScales(Array.from({ length: grass.count }, (_, i) => [rand(0.3, 0.5), rand(1, 4), 1]).flat());
        grass.setAllRotations(Array.from({ length: grass.count }, (_, i) => [0, -Math.PI / 2, 0]).flat());
        this.scene.add(grass);
    }

    private async setupSponza() {
        const sponza = await GLTFLoader.loadMesh('assets/models/sponza.glb');
        if (sponza) {
            sponza.setScale(0.2);
            sponza.position.z = 7;
            this.scene.add(sponza);
        }
    }

    private setupLights() {
        // // POINT LIGHT 
        this.point = new PointLight({ intensity: 10000, range: 2000, color: '#ffff88' });
        this.scene.add(this.point);
        this.point.position.setXYZ(-100, 20, 0);
        const bulb = new Mesh(new SphereGeometry(2), new StandardMaterial({ emissive: '#ffffff', emissive_factor: 10 }));
        this.point.add(bulb);


        // RED CUBE
        const redCube = new PointLight({ intensity: 10000, range: 200, color: '#ff0000' });
        const redCubeMesh = new Mesh(new BoxGeometry(10, 10, 10), new StandardMaterial({ emissive: '#ff3333' }));
        redCube.add(redCubeMesh);
        redCube.position.setXYZ(-180, 60, 0);
        this.scene.add(redCube);
        this.redCube = redCube;
    }

    private setupParticles() {
        const rangeX = 280;
        const rangeZ = 50;
        const particleGeometry = new PlaneGeometry(1, 1);
        const particleMaterial = new StandardMaterial({ emissive: '#ff0000', transmission: 1, blending: 'additive', transparent: true });
        particleMaterial.addChunk(new ShaderChunk('Particle', `
            @fragment(last) {{
                let dist = distance(input.vUv, vec2(0.5));
                if (dist > 0.5) {
                    discard;
                } else {
                    color = vec4(color.rgb * (0.5 - dist), 0.5 - dist);
                    let edge = smoothstep(0.0, 0.1, dist);
                    color.a *= edge;
                }
            }}
        `));

        this.particles = new Mesh(particleGeometry, particleMaterial, 3_000);
        this.particles.setAllPositions(Array.from({ length: this.particles.count }, (_, i) => [rand(-rangeX, rangeX), rand(0, 100), rand(-rangeZ, rangeZ)]).flat());
        this.particles.setAllScales(rand(0.15, 0.3));
        this.particles.setAllRotations(Array.from({ length: this.particles.count }, (_, i) => [0, -Math.PI / 2, 0]).flat());
        this.scene.add(this.particles);
    }

    start() {
        this.animate();
    }

    private animate = () => {
        const now = performance.now();
        const delta = (now - this.last) / 1000;
        this.last = now;
        this.elapsed += delta;

        // Update point light
        this.point.position.x = Math.cos(this.elapsed * 0.3) * 200;
        
        // Update camera
        this.camera.position.x = Math.sin(this.elapsed * 0.3) * 200;
        
        // Update red cube
        this.redCube.rotation.x += delta;
        this.redCube.rotation.z += delta;

        // Update particles
        const distance = 1;
        const speed = 1;
        const translations = [];
        for (let i = 0; i < this.particles.count; i++) {
            translations.push(
                Math.sin((this.elapsed + i) * speed) * distance * delta,
                Math.cos((this.elapsed + i) * speed) * distance * delta,
                Math.sin((this.elapsed + i) * speed) * distance * delta
            );
        }
        this.particles.translateAll(translations);

        // Render and continue loop
        this.engine.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.animate);
    }
}