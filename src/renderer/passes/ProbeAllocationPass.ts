import { Camera } from '@/camera';
import { Scene } from '@/core';
import { Renderer } from '../Renderer';
import { RenderPass } from '../RenderPass';
import { BindGroupLayout } from '@/data/BindGroupLayout';
import { Binding } from '@/data/Binding';
import { UniformData } from '@/data/UniformData';
import { Struct } from '@/data/Struct';
import { Shader, ShaderConfig } from '@/materials/shaders/Shader';
import { Vector2, Vector3 } from '@/math';
import { BufferData } from '@/data/BufferData';
import { debug } from 'console';


export class ProbeAllocationPass extends RenderPass {
    probeBuffer!: GPUBuffer;
    layouts: BindGroupLayout[] = [];
    workgroupSize!: number[];
    probeGridUniform!: UniformData;
    probeConfig!: UniformData;


    init(): this {
        // Create buffer for probe positions
        // Format: x, y, z, cascadeLevel for each probe
        const device = this.renderer.device;
        const resources = this.renderer.resources;
        const pipelines = this.renderer.pipelines;
        const MAX_PROBES = 1024;

        this.probeBuffer = device.createBuffer({
            size: MAX_PROBES * 32,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        // this.probeConfig = device.createBuffer({
        //     size: 32,
        //     usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        // });

        // Initialize config data
        const screenWidth = this.renderer.width;
        const screenHeight = this.renderer.height;

        const layout = new BindGroupLayout(device, 'ProbeAllocation', 'Global', [
            new Binding('PositionTexture').texture().visibility('compute').var('g_position', 'texture_2d<f32>'),
            new Binding('ProbeBuffer').storage('read_write').visibility('compute').var('probe_buffer', 'array<Probe>'),
            new Binding('ProbeConfig').storage('read_write').visibility('compute').var('probe_config', 'ProbeConfig'),
            new Binding('Camera').uniform().visibility('compute').var('camera', 'Camera'),
        ])
        this.layouts = [layout];
        const struct = new Struct('ProbeConfig', {
            probe_count: 'atomic<u32>',
            base_probe_spacing: 'f32',
            base_world_spacing: 'f32',
            cascade_count: 'u32',
            screen_size: 'vec2f',
            temporal_factor: 'f32',
            max_probe_count: 'u32', 
            debug_steps: 'atomic<u32>',    // Track how many steps we're taking
            debug_hits: 'atomic<u32>',     // Track how many hits we get
            debug_max_dist: 'atomic<u32>', // Track max distance exits
        });

        this.probeConfig = new UniformData(this, {
            name: 'ProbeConfig',
            isGlobal: true,
            struct,
            values: {
                probe_count: 0,
                base_probe_spacing: 8.0,
                base_world_spacing: 1.0,
                cascade_count: 1,
                screen_size: new Vector2(screenWidth, screenHeight),
                temporal_factor: 0.1,
                max_probe_count: MAX_PROBES,
                debug_steps: 0,
                debug_hits: 0,
                debug_max_dist: 0,
            }
        });




        this.workgroupSize = [16, 16];
        const probeStruct = new Struct('Probe', {
            world_pos: 'vec3f',
            screen_pos: 'vec2f',
            cascade_level: 'f32',
            radius: 'f32',
        });

        const shaderConfig: ShaderConfig = {
            name: 'ProbeAllocation',
            layouts: this.layouts,
            compute: `
                ${probeStruct.toWGSL()}

                fn calculate_cascade_level(screen_pos: vec2f, world_pos: vec3f) -> u32 {
                    let screen_center = probe_config.screen_size * 0.5;
                    let screen_dist = length(screen_pos - screen_center);
                    let world_dist = length(world_pos - camera.position);
                    
                    // Consider both screen and world space distance
                    let base_level = log2(max(screen_dist / probe_config.base_probe_spacing, 1.0));
                    let world_level = log2(max(world_dist / probe_config.base_world_spacing, 1.0));
                    
                    return u32(min(max(base_level, world_level), f32(probe_config.cascade_count - 1)));
                }


                @compute(input) @workgroup_size(${this.workgroupSize[0]}, ${this.workgroupSize[1]}) {
                    let global_id = input.global_invocation_id;
                    let pixel = vec2<i32>(global_id.xy);
                    let tex_size = textureDimensions(g_position);
                    
                    
                    let tex_coords = vec2f(pixel) / vec2f(tex_size);
                    let world_pos = textureLoad(g_position, pixel, 0).xyz;
                    
                    // Calculate cascade level
                    let cascade_level = calculate_cascade_level(tex_coords, world_pos);
                    let probe_spacing = probe_config.base_probe_spacing * pow(2.0, f32(cascade_level));
                    
                    // Check if this pixel should host a probe
                    if (all(vec2<f32>(pixel) % vec2<f32>(probe_spacing) < vec2<f32>(1.0))) {
                        let probe_index = atomicAdd(&probe_config.probe_count, 1u);
                        
                        // Don't exceed max probe count
                        if (probe_index >= probe_config.max_probe_count) {
                            atomicSub(&probe_config.probe_count, 1u);
                            return;
                        }
                        
                        // Calculate probe radius based on cascade level
                        let radius = probe_spacing * 2.0;
                        
                        // Store probe data
                        probe_buffer[probe_index] = Probe(
                            world_pos,
                            tex_coords,
                            f32(cascade_level),
                            radius
                        );
                    }
                }
            `
        }

        const shader = new Shader(shaderConfig);

        const pipelineLayout = pipelines.createPipelineLayout(this.layouts);

        const pipeline = pipelines.createComputePipeline({
            layout: pipelineLayout,
            shader 
        });
        this.pipeline = pipeline;
        return this;
    }

    execute(encoder: GPUCommandEncoder): this {
        if (!this.bindGroup) {
            this.bindGroup = this.renderer.resources.createBindGroup(this.layouts[0], {
                PositionTexture: this.inputs.get('position_texture') as GPUTexture, 
                ProbeBuffer: this.probeBuffer,
                ProbeConfig: this.probeConfig,
            })
        }

        const pass = encoder.beginComputePass();
        pass.setPipeline(this.pipeline as GPUComputePipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.dispatchWorkgroups(
            Math.ceil(this.renderer.width / this.workgroupSize[0]),
            Math.ceil(this.renderer.height / this.workgroupSize[1]),
        );

        pass.end();

        for (const [key, value] of this.inputs.entries()) {
            this.outputs.set(key, value);
        }

        this.outputs.set('probe_buffer', this.probeBuffer);
        this.outputs.set('probe_config', this.resources.getBufferByName('ProbeConfig')!);

        return this;
    }
}