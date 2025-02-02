import { Scene } from '@/core/Scene';
import { PerspectiveCamera } from '@/camera/PerspectiveCamera';
import { Vector3 } from '@/math';
import { Mesh } from '@/core/Mesh';
import { PlaneGeometry } from '@/geometry';
import { StandardMaterial } from '@/materials/StandardMaterial';
import { ShaderChunk } from '@/materials/shaders/ShaderChunk';
import { GLTFLoader } from '@/util/loaders/GLTFLoader';
import { PointLight } from '@/lights/PointLight';
import { rand } from '@/util';
import { Engine } from '@/engine/Engine';
import { Texture2D } from '@/data';
import { TriangleGeometry } from '@/geometry/TriangleGeometry';

import ParticleMap from '../assets/textures/particle.png';
import { FirstPersonControls } from '@/camera';

export class SponzaScene {
    private scene!: Scene;
    private camera!: PerspectiveCamera;
    private particles!: Mesh;
    private point!: PointLight;
    private redCube!: PointLight;
    private elapsed: number = 0;
    private last: number = performance.now();
    private engine : Engine;
    private controls!: FirstPersonControls;

    constructor(engine : Engine) {
        this.engine = engine;
    }

    async init() {
        this.setupScene();
        this.setupCamera();
        await this.setupSponza();
        this.setupGrass();
        this.setupParticles();
        this.setupLights();
    }

    private setupCamera() {
        this.camera = new PerspectiveCamera(40, this.engine.settings.width / this.engine.settings.height, 0.1, 1000);
        this.controls = new FirstPersonControls(this.camera, this.engine.settings.canvas!);
        this.camera.lookAt(Vector3.LEFT);
        this.controls.movementSpeed = 70;
        this.scene.add(this.camera);
    }

    private setupScene() {
        this.scene = new Scene({
            ambientIntensity: 0,
            indirectIntensity: 0.0,
        });
    }

    private async setupGrass() {
        // GRASS MATERIAL (EXTENDED STANDARD MATERIAL)
        const grassMat = new StandardMaterial({ diffuse: '#aaaa00', roughness: 0.5, metalness: 0.5,  transmission: 1.0 });

        const grassChunk = new ShaderChunk('Grass', `
            @group(Global) @binding(Scene)
            @include(Noise)

            @vertex(after:position) {{
                if (input.vertex_index == 2) {
                    // noise_patches
                    var world = output.position;
                    var local = output.local_position;
                    let noise = perlinNoise(world.xz * 0.5) * 0.5 + 0.5;
                    output.position.y += noise;

                    // wind_animation
                    let wind = perlinNoise(world.xz * 0.005) * 0.5 + 0.5;
                    let windStrength = sin(scene.time * 2.0 + wind * 100.0) * local.y * 2.0;
                    local.x += windStrength;
                    local.z += windStrength;
                    output.local_position = local;
                    output.position = transform(model, local, 1.0);
                }
            }}
            @fragment(after:gamma) {{
                let colorNoise = perlinNoise(input.position.xz * 0.1) * 0.5 + 0.5;
                let color1 = vec3(color.rgb * vec3(4.0, 4.0, 1.0));
                let color2 = vec3(color.rgb * vec3(1.0, 1.0, 0.0));
                let mixed = vec4f(mix(color1, color2, colorNoise), color.a);
                color = vec4f(mix(color.rgb, mixed.rgb, colorNoise), color.a);
                color = vec4(color.rgb * 0.5 * input.uv.y, 1.0);
            }}
        `);
        
        grassMat.addChunk(grassChunk);

        const triangleGeometry = new TriangleGeometry();
        const grass = new Mesh(triangleGeometry, grassMat, { useBillboard: true, count: 100_000 });
        const rangeX = 280;
        const rangeZ = 50;
        grass.setAllPositions(Array.from({ length: grass.count }, (_) => [rand(-rangeX, rangeX), 0, rand(-rangeZ, rangeZ)]).flat());
        grass.setAllScales(Array.from({ length: grass.count }, (_) => [rand(0.3, 0.5), rand(1, 4), 1]).flat());
        this.scene.add(grass);
    }

    private async setupSponza() {
        const sponza = await GLTFLoader.loadMesh('assets/models/sponza.glb');
        const windChunk = new ShaderChunk('Wind', `
            @group(Global) @binding(Scene)
            @include(Noise)

            @vertex(after:position) {{
                var worldPos = output.position;
                let height = 80.0;
                let heightFactor = clamp(1.0 - (worldPos.y / height), 0.0, 1.0);
                
                let time = scene.time * 1.0; // Control overall wind speed
                let baseWind = perlinNoise(vec2(
                    worldPos.x * 0.04 + time * 0.6,
                    worldPos.z * 0.04 + time * 0.4
                )) * 2.0 - 2.0;
                
                let detailWind = perlinNoise(vec2(
                    worldPos.x * 0.05 + time * 1.0,
                    worldPos.z * 0.05 + time * 0.8
                )) * 0.9;
                
                let windStrength = 5.0; // Adjust max wind displacement
                let windEffect = (baseWind + detailWind) * heightFactor * heightFactor; // Square for more dramatic falloff
                
                output.position.z += windEffect * windStrength;
                output.position.y += windEffect * windStrength * 0.2 * heightFactor;
            }}
        `);
        if (sponza) {
            sponza.setScale(0.2);
            sponza.traverse((child) => {
                if (!(child instanceof Mesh)) return;
                if (child.material && (child.material instanceof StandardMaterial)) {
                    if (['17', '18', '19'].some((id) => child.material.name.includes(id))) {
                        child.material.addChunk(windChunk);
                    }
                    child.material.alpha_test = 0.9;
                    child.material.invert_normal = true;
                }
            });
            sponza.position.z = 7;
            this.scene.add(sponza);
        }
    }

    private setupLights() {
        // flames
        const flameChunk = new ShaderChunk('Flame', `
                @group(Global) @binding(Scene)
                @include(Noise)
                @vertex(after:local_position) {{
                    let instanceIndex = f32(input.instance_index);
                    // Time variables for looping
                    let loopDuration = 2.5;
                    let timeInLoop = fract(scene.time / loopDuration) * loopDuration;
                    
                    // Base upward movement - using smoothstep for one-way movement
                    let baseHeight = 10.0;
                    let verticalOffset = instanceIndex * 0.2;
                    let heightProgress = fract((timeInLoop + verticalOffset) / loopDuration);
                    let height = baseHeight * heightProgress;  // Linear upward movement
                    
                    // Horizontal movement
                    let horizontalScale = 2.0;
                    let noiseTime = scene.time * 2.0 + instanceIndex * 0.5;
                    let horizontalOffset = vec2f(
                        perlinNoise(vec2(noiseTime * 0.5, instanceIndex)) - 0.5,
                        perlinNoise(vec2(noiseTime * 0.5 + 100.0, instanceIndex)) - 0.5
                    ) * horizontalScale;
                    
                    // Calculate scale based on height
                    let heightRatio = height / baseHeight;
                    let scaleRange = vec2f(1.0, 0.2);
                    let scale = mix(scaleRange.x, scaleRange.y, heightRatio);
                    
                    // Apply movement and scaling
                    output.local_position *= scale;
                    output.local_position.y += height;
                    output.local_position.x += horizontalOffset.x;
                    output.local_position.z += horizontalOffset.y;
                }}

                @fragment(after:declares) {{
                    let normalizedHeight = input.local_position.y / 10.0;
                    let fadeAlpha = 1.0 - smoothstep(0.3, 0.9, normalizedHeight);
                    let opacityNoise = perlinNoise(input.local_position.xz) * 0.5 + 0.5;
                    opacity *= fadeAlpha * opacityNoise;
                }}

                @fragment(last) {{
                    let center = vec2f(0.0, 0.0);
                    let distFromCenter = length(input.local_position.xz) / 3.0;
                    
                    // Create color variation
                    let baseColor = vec3f(1.0, 0.35, 0.0);      // Bright yellow core
                    let edgeColor = vec3f(1.0, 0.1, 0.0);       // Orange-red edges
                    let topColor = vec3f(0.9, 0.2, 0.0);        // Darker red for top

                    // Mix colors based on height and distance from center
                    let heightColor = mix(baseColor, topColor, normalizedHeight);
                    diffuse = mix(heightColor, edgeColor, smoothstep(0.0, 1.0, distFromCenter));
                    opacity *= fadeAlpha;
                    color = vec4f(diffuse, color.a * opacity);
                }}
        `);

        const flameGeo = new PlaneGeometry(7, 3);
        const positions = [
            new Vector3(-123, 25, 36),
            new Vector3(-123, 25, -37),
            new Vector3(98, 25, 36),
            new Vector3(98, 25, -37),
        ]
        const flameColor = '#ff5522';
        for (const pos of positions) {
            const flameMat = new StandardMaterial({ 
                diffuse: flameColor,
                emissive_factor: 10, 
                blending: 'additive-alpha',
                opacity: 1.0,
                transparent: true,
                depthWrite: false,
                useGamma: false,
                useLight: false,
                useFog: false,
                diffuse_map: Texture2D.from(ParticleMap),
            }).addChunk(flameChunk);
            const flame = new Mesh(flameGeo, flameMat, { useBillboard: true, count: 50 });
            flame.setPosition(pos);
            this.scene.add(flame);
            const flameLight = new PointLight({ intensity: 200, color: flameColor });
            flame.add(flameLight);
        }
    }

    private setupParticles() {
        const rangeX = 200;
        const rangeZ = 100;
        const particleGeometry = new PlaneGeometry(1, 1);
        const particleMaterial = new StandardMaterial({ 
            useLight: true,
            diffuse_map: Texture2D.from(ParticleMap),
            blending: 'additive-alpha',
            transmission: 1.0,
            opacity: 1.0,
            alpha_test: 0.0,
            transparent: true,
            metalness: 0.9,
            roughness: 0.1,
            specular_factor: 100000.0,
            specular: '#eeff00',
            depthWrite: false,
            cullMode: 'none',
        });
        particleMaterial.addChunk(new ShaderChunk('Particle', `
            @group(Global) @binding(Scene)
            @include(Noise)

            fn rotateModel(model: mat4x4f, v: vec3f, angle: f32) -> mat4x4f {
                let s = sin(angle);
                let c = cos(angle);
                let axis = normalize(v);
                let temp = axis * (1.0 - c);
                let rotate = mat4x4f(
                    c + temp.x * axis.x, temp.x * axis.y + s * axis.z, temp.x * axis.z - s * axis.y, 0.0,
                    temp.y * axis.x - s * axis.z, c + temp.y * axis.y, temp.y * axis.z + s * axis.x, 0.0,
                    temp.z * axis.x + s * axis.y, temp.z * axis.y - s * axis.x, c + temp.z * axis.z, 0.0,
                    0.0, 0.0, 0.0, 1.0
                );
                
                // Get world space center
                var worldPos = transform(model, vec3f(0), 1.0);
                // Create translation matrices
                let toOrigin = mat4x4f(
                    1.0, 0.0, 0.0, 0.0,
                    0.0, 1.0, 0.0, 0.0,
                    0.0, 0.0, 1.0, 0.0,
                    -worldPos.x, -worldPos.y, -worldPos.z, 1.0
                );
                let fromOrigin = mat4x4f(
                    1.0, 0.0, 0.0, 0.0,
                    0.0, 1.0, 0.0, 0.0,
                    0.0, 0.0, 1.0, 0.0,
                    worldPos.x, worldPos.y, worldPos.z, 1.0
                );
                
                // Apply rotation around world space center
                return fromOrigin * rotate * toOrigin * model;
            }

            @vertex(after:model) {{
            let instanceIndex = f32(input.instance_index);
                var worldPos = transform(model, vec3f(0), 1.0);
                var normalizedPos = normalize(worldPos) * 40.0;
                
                // Control rotation speed and direction based on position and time
                let rotationSpeed = 0.3; // Adjust this to control rotation speed
                let maxRotation = 6.283185; // Maximum rotation angle;
                
                // Generate rotation angle based on position and time, similar to movement
                let rotationAngle = perlinNoise(vec2(
                    length(normalizedPos.xy), 
                    scene.time * rotationSpeed
                )) * maxRotation;
                
                // Generate rotation axis based on position
                let rotationAxis = normalize(vec3f(
                    perlinNoise(vec2(normalizedPos.x, scene.time * rotationSpeed)),
                    perlinNoise(vec2(normalizedPos.y, scene.time * rotationSpeed)),
                    perlinNoise(vec2(normalizedPos.z, scene.time * rotationSpeed))
                ));
                
                model = rotateModel(model, rotationAxis, rotationAngle);
            }}

            @vertex(after:position) {{
                worldPos = transform(model, vec3f(0), 1.0);
                let posScale = 0.8;
                let speedFactor = 0.05;
                let maxTravel = 40.0; // Control maximum travel distance
                
                normalizedPos = normalize(worldPos) * posScale;
                
                let angleXY = perlinNoise(vec2(normalizedPos.x, normalizedPos.y + scene.time * speedFactor)) * 6.283185;
                let angleZ = perlinNoise(vec2(normalizedPos.x * 2.0, normalizedPos.z + scene.time * speedFactor)) * 6.283185;
                let speed = perlinNoise(vec2(length(normalizedPos.xy), scene.time * speedFactor)) * maxTravel;
                
                output.position += vec3(cos(angleXY), sin(angleXY), sin(angleZ)) * speed;
            }}

            @fragment(after:declares) {{
                let noise = perlinNoise(input.uv * 2.0) * 0.5 + 0.5;
                opacity = mix(opacity, 0.0, noise);
            }}
        `));

        this.particles = new Mesh(particleGeometry, particleMaterial, { count: 10_000 });
        this.particles.useBillboard = true;
        this.particles.setAllPositions(Array.from({ length: this.particles.count }, () => [rand(-rangeX, rangeX), rand(-30, 100), rand(-rangeZ, rangeZ)]).flat());
        this.particles.setAllScales(Array.from({ length: this.particles.count }, () => { const s = rand(0.5, 1); return [s, s, s]}).flat());
        this.scene.add(this.particles);
    }

    start() {
        this.animate();
    }

    private animate = () => {
        const now = performance.now();
        const delta = (now - this.last) / 1000;
        this.controls?.update(delta);
        this.camera.position.y = 30;
        this.last = now;
        this.elapsed += delta;

        // Update point light
        if (this.point) {
            this.point.position.x = Math.cos(this.elapsed * 0.3) * 200;
        }
        
        // Update camera
        this.camera.position.x = Math.cos(this.elapsed * 0.2) * 150;
        
        // Update red cube
        if (this.redCube) {
            this.redCube.rotation.x += delta;
            this.redCube.rotation.z += delta;
        }

        // Render and continue loop
        this.engine.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.animate);
    }
}