import { Camera } from '@/camera';
import { Scene } from '@/core';
import { RenderPass } from '../RenderPass';
import { Shader, ShaderConfig } from '@/materials/shaders';
import { BindGroupLayout } from '@/data/BindGroupLayout';
import { Binding } from '@/data/Binding';
import { RenderState } from '../RenderState';
import { UniformData } from '@/data';
import { Struct } from '@/data/Struct';
import { Vector2 } from '@/math';

export class ProbeVisualizationPass extends RenderPass {
    resolution: Vector2 = new Vector2(1, 1);
    one_over_size: Vector2 = new Vector2(1, 1);
    uniforms!: UniformData;
    init(): this {
        this.layouts = [
            new BindGroupLayout(this.device, 'ProbeVisualization', 'Global', [
                new Binding('Camera').uniform().visibility('vertex').var('camera', 'Camera'),
                new Binding('ProbeVisualization').uniform().visibility('vertex', 'fragment').var('uniforms', 'ProbeVisualization'),
                new Binding('Probes').storage('read').visibility('vertex').var('probes', 'array<Probe>'),
            ]),
        ];
        this.uniforms = new UniformData(this, {
            isGlobal: true,
            name: 'ProbeVisualization',
            struct: new Struct('ProbeVisualization', {
                resolution: 'vec2f',
                one_over_size: 'vec2f',
                aspect: 'f32',
            }),
            values: {
                resolution: this.resolution, 
                one_over_size: this.one_over_size,
                aspect: this.resolution.x / this.resolution.y,
            }
        })

        const shaderConfig: ShaderConfig = {
            name: 'ProbeVisualization',
            layouts: this.layouts,
            varyings: [ 
                { name: 'color', type: 'vec3f', location: 0 },
                { name: 'uv', type: 'vec2f', location: 1 },
                { name: 'ray_count', type: 'u32', location: 2, interpolate: { type: 'flat' } },
                { name: 'radius', type: 'f32', location: 3 },
            ],
            vertex: `
                ${Struct.get('Probe')?.toWGSL()}

                fn getProbeColor(cascadeLevel: f32) -> vec3f {
                    switch(u32(cascadeLevel)) {
                        case 0u: { return vec3f(1.0, 1.0, 0.0); }    // Yellow 
                        case 1u: { return vec3f(0.0, 1.0, 1.0); }    // Cyan
                        case 2u: { return vec3f(0.0, 0.0, 1.0); }    // Blue
                        case 3u: { return vec3f(1.0, 0.0, 1.0); }    // Magenta
                        default: { return vec3f(0.0, 1.0, 0.0); }    // Green
                    }
                }

                @vertex(input) -> output {
                    let points = array(
                        vec2f(-1.0, -1.0),
                        vec2f( 1.0, -1.0),
                        vec2f(-1.0,  1.0),
                        vec2f(-1.0,  1.0),
                        vec2f( 1.0, -1.0),
                        vec2f( 1.0,  1.0)
                    );

                    // Get probe data
                    let probe = probes[input.instance_index];
                    
                    // Determine cascade level from ray count
                    let cascade = u32(log2(f32(probe.ray_count) / 4.0) / log2(4.0));
                    
                    // Cross size based on cascade level
                    let size = probe.radius * uniforms.one_over_size.x;

                    // UV position
                    let uv = points[input.vertex_index];
                    
                    // Position in clip space
                    let position = vec4f(
                        (probe.position * 2.0 - 1.0) + (uv * 2.0 - 1.0) * size,
                        0.0,
                        1.0
                    );

                    output.clip = position;

                    // Color per cascade
                    let color = getProbeColor(f32(cascade));
                    output.color = probe.radiance;
                    let aspect = uniforms.aspect;
                    output.uv = uv * vec2f(aspect, 1.0);
                    output.ray_count = probe.ray_count;
                    output.radius = probe.radius;
                    return output;
                }
            `,
            fragment: `
                    const PI = 3.14159265359;
                    const PI2 = 6.28318530718;
                @fragment(input) -> output {
                    let dist = length(input.uv - vec2f(0.5));
                    if (dist > 0.5) {
                        discard;
                    }

                    // visualize rays
                    let center = vec2f(0.5, 0.5);
                    let dir = input.uv - center;

                    let rayCount = f32(input.ray_count);
                    let stepAngle = PI2 / rayCount;
                    let angle = atan2(dir.y, dir.x) + PI / rayCount;

                    // Calculate angular distance to nearest ray
                    let rayIndex = round(angle / stepAngle);
                    let nearestRayAngle = rayIndex * stepAngle;
                    let angleDiff = abs(angle - nearestRayAngle);

                    // Make line thickness proportional to distance from center
                    // This helps maintain consistent visual thickness
                    let thickness = 0.1 / (dist * rayCount);

                    // Sharp falloff for cleaner lines
                    if (angleDiff > thickness) {
                        discard;
                    }

                    // Optional: fade edges slightly for anti-aliasing
                    let alpha = smoothstep(thickness, thickness * 0.8, angleDiff);
                    output.color = vec4f(input.color.rgb, 1.0 - alpha);
                    return output;
                }
            `,
        }

        const shader = new Shader(shaderConfig);

        const pipelineLayout = this.pipelines.createPipelineLayout(this.layouts);
        const renderState = new RenderState({
            topology: 'triangle-list',
            depthWrite: false
        })

        this.pipeline = this.pipelines.createRenderPipeline({
            shader,
            layout: pipelineLayout,
            renderState,
            targets: [{ format: this.renderer.format }],
        });

        return this;
    }

    public beforeRender(): this {
        return this;
    }

    public afterRender(): this {
        return this;
    }

    public execute(encoder: GPUCommandEncoder): this {
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: this.renderer.context.getCurrentTexture().createView(),
                loadOp: 'load',
                storeOp: 'store',
            }],
        });
        this.uniforms.set('aspect', this.resolution.x / this.resolution.y);
        this.resolution.set(this.renderer.width, this.renderer.height);
        this.one_over_size.set(1 / this.resolution.x, 1 / this.resolution.y);
        //if (!this.bindGroup) {
            this.bindGroup = this.resources.createBindGroup(this.layouts[0], {
                Camera: UniformData.getByName('Camera')!,
                ProbeVisualization: this.uniforms,
                Probes: this.inputs.get('probe_buffer') as GPUBuffer,
            });

        //}

        pass.setPipeline(this.pipeline as GPURenderPipeline);
        pass.setBindGroup(0, this.bindGroup);
        const count = (this.inputs.get('probe_buffer') as GPUBuffer).size / Struct.get('Probe')?.size!;
        pass.draw(6, count, 0, 0);
        pass.end();
        return this;
    }

}