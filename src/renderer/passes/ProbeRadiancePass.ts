import { RenderPass } from '../RenderPass';
import { Shader, ShaderConfig } from '@/materials/shaders';
import { BindGroupLayout } from '@/data/BindGroupLayout';
import { Binding } from '@/data/Binding';
import { UniformData } from '@/data';
import { Struct } from '@/data/Struct';

export class ProbeRadiancePass extends RenderPass {
    rayMarchingConfig!: UniformData;
    probeRadiance!: GPUBuffer;
    frame: number = 0;

    public init(): this {
        // Setup bind group layout with compute bindings.
        this.layouts = [
            new BindGroupLayout(this.renderer.device, 'ProbeRadiance', 'Global', [
                new Binding('Camera').uniform().visibility('compute').var('camera', 'Camera'),
                new Binding('PositionTexture').texture().visibility('compute').var('g_position', 'texture_2d<f32>'),
                new Binding('NormalTexture').texture().visibility('compute').var('g_normal', 'texture_2d<f32>'),
                new Binding('AlbedoTexture').texture().visibility('compute').var('g_albedo', 'texture_2d<f32>'),
                new Binding('ProbeBuffer').storage('read').visibility('compute').var('probe_buffer', 'array<Probe>'),
                new Binding('ProbeRadiance').storage('read_write').visibility('compute').var('probe_radiance', 'array<vec4f>'),
                new Binding('ProbeConfig').storage('read_write').visibility('compute').var('probe_config', 'ProbeConfig'),
                new Binding('RayConfig').uniform().visibility('compute').var('ray_config', 'RayConfig'),
            ]),
        ];

        const RAY_COUNT = 64;
        const MAX_PROBES = 1024; // Match with probe placement system

        const workgroupSize = [64, 1, 1];
        this.rayMarchingConfig = new UniformData(this, {
            isGlobal: true,
            name: 'RayConfig',
            struct: new Struct('RayConfig', {
                ray_count: 'u32',
                max_steps: 'u32',
                min_step_size: 'f32',
                max_distance: 'f32',
                frame_index: 'u32',
            }),
            values: {
                ray_count: RAY_COUNT,
                max_steps: 64,
                min_step_size: 0.01,
                max_distance: 10.0,
                frame_index: 0,
            }
        })

        this.probeRadiance = this.device.createBuffer({
            size: MAX_PROBES * RAY_COUNT * 16,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        });

        const computeShader = new Shader({
            name: 'ProbeRadiance',
            layouts: this.layouts,
            compute: `
                const PI = 3.14159265359; 

                ${Struct.get('Probe')?.toWGSL()}

                fn world_to_screen(world_pos: vec3f) -> vec2f {
                    return (camera.projection * camera.view * vec4f(world_pos, 1.0)).xy / vec2f(2.0) + vec2f(0.5);
                }

                fn get_ray_direction(ray_index: u32, total_rays: u32) -> vec3f {
                    let i = f32(ray_index);
                    let n = f32(total_rays);
                    
                    // Use uniform sphere sampling
                    let phi = acos(1.0 - 2.0 * ((i + 0.5) / n));
                    let theta = 2.0 * PI * ((i * 0.618034) % 1.0); // Golden ratio offset
                    
                    return vec3f(
                        sin(phi) * cos(theta),
                        sin(phi) * sin(theta), 
                        cos(phi)
                    );
                }

                
                fn get_adaptive_step_size(current_dist: f32, cascade_level: f32) -> f32 {
                    let base_step = max(ray_config.min_step_size, current_dist * 0.05);
                    return base_step * (cascade_level); // Linear instead of exponential
                }
                fn spherical_fibonacci(i: u32, n: u32) -> vec3f {
                    let phi = 3.14159265359 * (3.0 - sqrt(5.0));
                    let y = 1.0 - (f32(i) * 2.0 / f32(n));
                    let radius = sqrt(1.0 - y * y);
                    let theta = phi * f32(i);
                    return vec3f(
                        cos(theta) * radius,
                        y,
                        sin(theta) * radius
                    );
                }
                fn debug_ray_march(probe: Probe, ray_dir: vec3f) -> vec4f {
                    var t = 0.0;
                    let tex_size = vec2f(textureDimensions(g_position));
                    
                    for (var step = 0u; step < ray_config.max_steps; step++) {
                        let world_pos = probe.world_pos + ray_dir * t;
                        let clip = camera.view_projection * vec4f(world_pos, 1.0);
                        
                        // Early exit if behind camera
                        if (clip.w <= 0.0) {
                            return vec4f(10.0, 0.0, 0.0, 0.0); // Red for behind camera
                        }
                        
                        let ndc = clip.xyz / clip.w;
                        let screen_pos = ndc.xy * 0.5 + 0.5;
                        
                        if (any(screen_pos < vec2f(0.0)) || any(screen_pos > vec2f(1.0))) {
                            return vec4f(0.0, 10.0, 0.0, 0.0); // Green for out of screen
                        }
                        
                        let tex_coord = vec2<i32>(screen_pos * tex_size);
                        let sample_pos = textureLoad(g_position, tex_coord, 0).xyz;
                        let dist = length(sample_pos - world_pos);
                        
                        if (dist < ray_config.min_step_size) {
                            return vec4f(0.0, 0.0, 1.0, 1.0); // Blue for hit
                        }
                        
                        t += get_adaptive_step_size(t, probe.cascade_level);
                        
                        if (t > ray_config.max_distance) {
                            return vec4f(1.0, 1.0, 0.0, 0.0); // Yellow for max distance
                        }
                    }
                    
                    return vec4f(1.0, 0.0, 0.0, 0.0); // Red for max steps reached
                }
                
                @compute(input) @workgroup_size(${workgroupSize[0]}, ${workgroupSize[1]}, ${workgroupSize[2]}) {
                    let global_id = input.global_invocation_id;
                    let probe_index = global_id.x;
                    let ray_index = global_id.y;
                    
                    if (probe_index >= atomicLoad(&probe_config.probe_count)) {
                        return;
                    }
                    
                    let probe = probe_buffer[probe_index];
                    let ray_dir = get_ray_direction(ray_index, ray_config.ray_count);
                    
                    var t = ray_config.min_step_size;

                    let tex_size = vec2f(textureDimensions(g_position));
                    var step_count = 0u;
                    
                    // Ray marching loop with detailed debugging
                    for (var step = 0u; step < ray_config.max_steps; step++) {
                        step_count += 1u;
                        let world_pos = probe.world_pos + ray_dir * t;
                        let clip = camera.view_projection * vec4f(world_pos, 1.0);
                        
                        // Debug camera space check
                        if (clip.w <= 0.0) {
                            probe_radiance[probe_index * ray_config.ray_count + ray_index] = 
                                vec4f(10.0, 0.0, 0.0, 1.0); // Red for behind camera
                            atomicAdd(&probe_config.debug_steps, step_count);
                            return;
                        }
                        
                        let ndc = clip.xyz / clip.w;
                        let screen_pos = ndc.xy * 0.5 + 0.5;
                        
                        // Debug screen space check
                        if (any(screen_pos < vec2f(0.0)) || any(screen_pos > vec2f(1.0))) {
                            probe_radiance[probe_index * ray_config.ray_count + ray_index] = 
                                vec4f(0.0, 10.0, 0.0, 1.0); // Green for out of screen
                            atomicAdd(&probe_config.debug_steps, step_count);
                            return;
                        }
                        
                        let tex_coord = vec2<i32>(screen_pos * tex_size);
                        let sample_pos = textureLoad(g_position, tex_coord, 0).xyz;
                        
                        // Debug position sampling
                        if (all(sample_pos == vec3f(0.0))) {
                            probe_radiance[probe_index * ray_config.ray_count + ray_index] = 
                                vec4f(10.0, 10.0, 0.0, 1.0); // Yellow for empty position
                            atomicAdd(&probe_config.debug_steps, step_count);
                            return;
                        }
                        
                        let dist = length(sample_pos - world_pos);
                        
                        // Debug hit check
                        if (dist < ray_config.min_step_size) {
                            atomicAdd(&probe_config.debug_hits, 1u);
                            probe_radiance[probe_index * ray_config.ray_count + ray_index] = 
                                vec4f(0.0, 0.0, 10.0, 1.0); // Blue for hit
                            atomicAdd(&probe_config.debug_steps, step_count);
                            return;
                        }
                        
                        t = get_adaptive_step_size(t, probe.cascade_level);
                        
                        if (t > ray_config.max_distance) {
                            atomicAdd(&probe_config.debug_max_dist, 1u);
                            probe_radiance[probe_index * ray_config.ray_count + ray_index] = 
                                vec4f(10.0, 0.0, 10.0, 1.0); // Magenta for max distance
                            atomicAdd(&probe_config.debug_steps, step_count);
                            return;
                        }
                    }
                    
                    // If we get here, we hit max steps
                    probe_radiance[probe_index * ray_config.ray_count + ray_index] = 
                        vec4f(5.5, 5.5, 5.5, 1.0); // Gray for max steps
                    atomicAdd(&probe_config.debug_steps, step_count);
                }
            `
        });

        const pipelineLayout = this.renderer.pipelines.createPipelineLayout(this.layouts);
        const pipeline = this.renderer.pipelines.createComputePipeline({
            layout: pipelineLayout,
            shader: computeShader
        });

        this.pipeline = pipeline;
        return this;
    }

    public execute(encoder: GPUCommandEncoder): this {
        this.frame++;
        if (!this.bindGroup) {
            // The expected inputs must be provided:
            // g_position, g_normal, g_albedo textures,
            // probe_buffer, probe_radiance, probe_config, and ray_config buffers.
            this.bindGroup = this.renderer.resources.createBindGroup(this.layouts[0], {
                Camera: UniformData.getByName('Camera')!,
                PositionTexture: this.inputs.get('position_texture') as GPUTexture,
                NormalTexture: this.inputs.get('normal_texture') as GPUTexture,
                AlbedoTexture: this.inputs.get('albedo_texture') as GPUTexture,
                ProbeBuffer: this.inputs.get('probe_buffer') as GPUBuffer,
                ProbeRadiance: this.probeRadiance,
                ProbeConfig: this.inputs.get('probe_config') as GPUBuffer,
                RayMarchingConfig: this.rayMarchingConfig,
            });
        }

        this.rayMarchingConfig.set('frame_index', this.frame);
        const MAX_PROBES = 1024; // Match with probe placement system

        const pass = encoder.beginComputePass();
        pass.setPipeline(this.pipeline as GPUComputePipeline);
        pass.setBindGroup(0, this.bindGroup);

        pass.dispatchWorkgroups(
            Math.ceil(MAX_PROBES / 64),
            1,
        )
        pass.end();

        for (const input of this.inputs.entries()) {
            this.outputs.set(input[0], input[1]);
        }
        this.outputs.set('probe_radiance', this.probeRadiance);
        return this;
    }
}