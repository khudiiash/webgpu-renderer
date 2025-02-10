import { RenderPass } from '../RenderPass';
import { Renderer } from '@/renderer/Renderer';
import { Scene } from '@/core/Scene';
import { Camera } from '@/camera/Camera';
import { Shader, ShaderChunk, ShaderConfig } from '@/materials/shaders';
import { BindGroupLayout } from '@/data/BindGroupLayout';
import { Binding } from '@/data/Binding';
import { Texture2D, UniformData } from '@/data';
import { Struct } from '@/data/Struct';
import Circles from '../../../assets/textures/circles.png';

export class ShadingPass extends RenderPass {
    private renderPassDescriptor!: GPURenderPassDescriptor;
    private shadingUniforms!: UniformData;
    circlesTexture!: Texture2D;

    public init(): this {
        // Create shader modules for a fullscreen quad
        const device = this.renderer.device;
        this.circlesTexture = Texture2D.from(Circles);

        this.layouts = [
            new BindGroupLayout(device, 'Shading', 'Global', [
                new Binding('PositionTexture').texture().var('position_texture', 'texture_2d<f32>'),
                new Binding('NormalTexture').texture().var('normal_texture', 'texture_2d<f32>'),
                new Binding('AlbedoTexture').texture().var('albedo_texture', 'texture_2d<f32>'),
                new Binding('ProbeBuffer').storage('read').visibility('fragment').var('probe_buffer', 'array<Probe>'),
                new Binding('ProbeRadiance').storage('read').visibility('fragment').var('probe_radiance', 'array<vec4f>'),
                new Binding('ShadingUniforms').uniform().visibility('fragment').var('shading_config', 'ShadingUniforms'),
                new Binding('Scene').uniform().visibility('fragment').var('scene', 'Scene'),
                new Binding('Camera').uniform().visibility('fragment').var('camera', 'Camera'),
                new Binding('Sampler').sampler().var('sampler_color', 'sampler'),
            ]),
        ];

        this.shadingUniforms = new UniformData(this, {
            isGlobal: true,
            name: 'ShadingUniforms',
            struct: new Struct('ShadingUniforms', {
                probe_count: 'u32',
                ray_count: 'u32',
                probe_blend_distance: 'f32',
                probe_importance_sampling: 'u32',
                temporal_blend: 'f32',
            }),
            values: {
                probe_count: 1024,
                ray_count: 4,
                probe_blend_distance: 10.0,
                probe_importance_sampling: 1,
                temporal_blend: 0.1,
            }
        });

        const shaderConfig: ShaderConfig = {
            name: 'ScreenSpaceShading',
            chunks: ['Noise', 'Common', 'Quad'],
            fragment: `
                ${Struct.get('Probe')?.toWGSL()}


                fn get_probe_contribution(world_pos: vec3f, screen_pos: vec2f, normal: vec3f) -> vec3f {
                    var total_radiance = vec3f(0.0);
                    var total_weight = 0.0;
                    
                    // Find and weight nearby probes
                    for (var i = 0u; i < shading_config.probe_count; i++) {
                        let probe = probe_buffer[i];
                        
                        // Calculate probe influence
                        let to_probe = probe.world_pos - world_pos;
                        let dist = length(to_probe);
                        
                        if (dist > probe.radius) {
                            continue;
                        }
                        
                        // Calculate weights
                        let direction_weight = max(dot(normalize(to_probe), normal), 0.0);
                        let distance_weight = 1.0 - smoothstep(0.0, probe.radius, dist);
                        let cascade_weight = 1.0 - smoothstep(0.8, 1.0, dist / probe.radius);
                        
                        let weight = direction_weight * distance_weight * cascade_weight;
                        
                        if (weight <= 0.0) {
                            continue;
                        }
                        
                        // Accumulate probe radiance
                        var probe_total = vec3f(0.0);
                        for (var ray = 0u; ray < shading_config.ray_count; ray++) {
                            let radiance = probe_radiance[i * shading_config.ray_count + ray];
                            if (radiance.a > 0.0) {
                                probe_total += radiance.rgb;
                            }
                        }
                        
                        probe_total /= f32(shading_config.ray_count);
                        total_radiance += probe_total * weight;
                        total_weight += weight;
                    }
                    
                    return select(vec3f(0.1), total_radiance / total_weight, total_weight > 0.0);
                }

                fn raymarch(uv: vec2f) -> vec3f {
                    let lightSample = textureSample(albedo_texture, sampler_color, uv);
                    var light = vec3f(lightSample.rgb * 0.1);
                    if (lightSample.a > 0.1) {
                        return lightSample.rgb;
                    }
                    let oneOverRayCount = 1.0 / f32(shading_config.ray_count);
                    let tauOverRayCount = TAU * oneOverRayCount;
                    let noise = rand(uv);
                    let size = vec2f(textureDimensions(albedo_texture));
                    let max_dist = 30.0;
                    let radiance_intensity = 2.0;
                    var radiance = vec3f(0.0);

                    for (var i = 0u; i < shading_config.ray_count; i++) {
                        let angle = tauOverRayCount * (f32(i) + noise);
                        let ray_dir_uv = vec2f(cos(angle), -sin(angle)) / size * max_dist;
                        var sample_uv = uv + ray_dir_uv;

                        for (var step = 0u; step < 64u; step++) {
                            if (out_bounds(sample_uv)) { break; }
                            let sample = textureSampleLevel(albedo_texture, sampler_color, sample_uv, 0);
                            if (sample.a > 0.1) {
                                radiance += sample.rgb * radiance_intensity;
                                break;
                            }
                            sample_uv += ray_dir_uv;
                        }
                    }
                    return radiance * oneOverRayCount;
                }

                fn calculate_attenuation(distance: f32) -> f32 {
                    return 1.0 / (1.0 + 0.1 * distance + 0.01 * distance * distance);
                }

                fn calc_direct(albedo: vec3f, position: vec3f, normal: vec3f) -> vec3f {
                    // Direct lighting calculation
                    var direct = vec3f(0.0);
                    for (var i = 0u; i < scene.directionalLightsNum; i += 1u) {
                        let light = scene.directionalLights[i];
                        let light_dir = -light.direction;
                        let n_dot_l = max(dot(normal, light_dir), 0.0);
                        let diffuse = albedo.rgb * n_dot_l * light.color.rgb;
                        
                        let view_dir = normalize(camera.position - position.xyz);
                        let half_dir = normalize(view_dir + light_dir);
                        let n_dot_h = max(dot(normal, half_dir), 0.0);
                        let specular = pow(n_dot_h, 32.0) * light.color.rgb * light.intensity;
                        
                        direct += diffuse + specular;
                    }

                    // Point lights
                    for (var i = 0u; i < scene.pointLightsNum; i += 1u) {
                        let light = scene.pointLights[i];
                        let light_dir = light.position - position.xyz;
                        let light_distance = length(light_dir);
                        let light_dir_normalized = normalize(light_dir);
                        let attenuation = calculate_attenuation(light_distance);
                        let n_dot_l = max(dot(normal, light_dir_normalized), 0.0);
                        let diffuse = albedo.rgb * n_dot_l * light.color.rgb * attenuation;
                        
                        let view_dir = normalize(camera.position - position.xyz);
                        let half_dir = normalize(view_dir + light_dir_normalized);
                        let n_dot_h = max(dot(normal, half_dir), 0.0);
                        let specular = pow(n_dot_h, 32.0) * light.color.rgb * attenuation * light.intensity;
                        
                        direct += diffuse + specular;
                    }

                    return clamp(direct, vec3f(0.0), vec3f(1.0));
                }

                @fragment(input) -> output {
                    // Sample G-buffer data
                    let world_pos = textureSample(position_texture, sampler_color, input.uv).xyz;
                    let normal = textureSample(normal_texture, sampler_color, input.uv).xyz; 
                    let albedo = textureSample(albedo_texture, sampler_color, input.uv);
                    let direct = calc_direct(albedo.rgb, world_pos, normal);
                    let indirect = vec3f(0.0);
                    let final_color = albedo.rgb * (direct.rgb + indirect.rgb);
                    output.color = vec4f(final_color, 1.0);
                    return output;
                }
            `,
            layouts: this.layouts,
            varyings: [
                { name: 'uv', type: 'vec2f', location: 0 },
            ]
        };


        const shader = new Shader(shaderConfig);

        // Create pipeline layout
        const pipelineLayout = this.pipelines.createPipelineLayout(this.layouts);

        this.pipeline = this.pipelines.createRenderPipeline({
            shader,
            layout: pipelineLayout,
            targets: [
                { format: this.renderer.format },
            ]
        });

        return this;
    }

    createBindGroup() {
        this.bindGroup = this.resources.createBindGroup(this.layouts[0], {
            PositionTexture: this.inputs.get('position_texture') as GPUTexture,
            NormalTexture: this.inputs.get('normal_texture') as GPUTexture,
            AlbedoTexture: this.inputs.get('albedo_texture') as GPUTexture,
            ProbeBuffer: this.inputs.get('probe_buffer') as GPUBuffer,
            ProbeConfig: this.resources.getBufferByName('ProbeConfig')!,
            ProbeRadiance: this.inputs.get('probe_radiance') as GPUBuffer,
            ShadingUniforms: this.shadingUniforms,
            Camera: UniformData.getByName('Camera')!,
            Sampler: this.resources.getOrCreateSampler({}),
        })
    }

    createRenderPassDescriptor() {
        this.renderPassDescriptor = {
            label: 'ShadingPass',
            colorAttachments: [
                {
                    view: this.renderer.context.getCurrentTexture().createView(),
                    clearValue: [0, 0, 0, 1],
                    loadOp: 'clear',
                    storeOp: 'store'
                },
            ],
        };
    }

    /**
     * Render a fullscreen quad using the color texture produced in the GeometryPass.
     */
    public execute(encoder: GPUCommandEncoder): this {
        // Assume the second texture (index 1) of previous pass is our colorTexture.
        // const colorTexture = this.inputs.get('albedo_texture') as GPUTexture;
        // if (!colorTexture) {
        //     console.warn('ShadingPass: No color texture found in inputs.');
        //     return this;
        // }

        //if (!this.bindGroup) {
            this.createBindGroup();
        //}

        this.createRenderPassDescriptor();

        this.shadingUniforms.set('probe_count', (this.inputs.get('probe_buffer') as GPUBuffer).size / 32);

        const pass = encoder.beginRenderPass(this.renderPassDescriptor);
        pass.setPipeline(this.pipeline as GPURenderPipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.draw(6);
        pass.end();

        for (const [key, value] of this.inputs.entries()) {
            this.outputs.set(key, value);
        }

        return this;
    }
}