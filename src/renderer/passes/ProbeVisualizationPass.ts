import { Camera } from '@/camera';
import { Scene } from '@/core';
import { RenderPass } from '../RenderPass';
import { Shader, ShaderConfig } from '@/materials/shaders';
import { BindGroupLayout } from '@/data/BindGroupLayout';
import { Binding } from '@/data/Binding';
import { RenderState } from '../RenderState';
import { UniformData } from '@/data';

export class ProbeVisualizationPass extends RenderPass {
    public init(): this {

        this.layouts = [
            new BindGroupLayout(this.device, 'ProbeVisualization', 'Global', [
                new Binding('Camera').uniform().visibility('vertex').var('camera', 'Camera'),
                new Binding('Probes').storage('read').visibility('vertex').var('probes', 'array<Probe>'),
            ]),
        ];

        const shaderConfig: ShaderConfig = {
            name: 'ProbeVisualization',
            layouts: this.layouts,
            varyings: [ 
            { name: 'color', type: 'vec3f', location: 0 },
            ],
            vertex: `
            struct Probe {
            world_pos: vec3<f32>,
            screen_pos: vec2<f32>,
            cascade_level: f32,
            radius: f32,
            }

            @group(Global) @binding(Camera)
            @group(Global) @binding(ProbePositions)


            fn getProbeColor(cascadeLevel: f32) -> vec3f {
            switch(u32(cascadeLevel)) {
            case 0u: { return vec3f(1.0, 0.0, 0.0); }    // Red
            case 1u: { return vec3f(0.0, 1.0, 0.0); }    // Green
            case 2u: { return vec3f(0.0, 0.0, 1.0); }    // Blue
            case 3u: { return vec3f(1.0, 1.0, 0.0); }    // Yellow
            case 4u: { return vec3f(1.0, 0.0, 1.0); }    // Magenta
            default: { return vec3f(1.0, 1.0, 1.0); }    // White
            }
            }
            @vertex(input) -> output {
            let probeData = probes[input.instance_index];
            let cascadeLevel = probeData.cascade_level;

            let points = array(
                vec2f(-1.0, -1.0),
                vec2f( 1.0, -1.0),
                vec2f(-1.0,  1.0),
                vec2f(-1.0,  1.0),
                vec2f( 1.0, -1.0),
                vec2f( 1.0,  1.0)
            );
            let vert_local_pos = points[input.vertex_index];

            let cameraForward = normalize(camera.direction);
            let worldUp = vec3f(0.0, 1.0, 0.0);
            let cameraRight = normalize(cross(cameraForward, worldUp));
            let cameraUp = cross(cameraRight, cameraForward);

            let offset = (cameraRight * vert_local_pos.x + cameraUp * vert_local_pos.y) * 0.01;
            let billBoardPos = probeData.world_pos + offset;
            
            output.clip = camera.view_projection * vec4f(billBoardPos, 1.0);
            output.color = getProbeColor(cascadeLevel);
            return output;
            }
            `,
            fragment: `
            @fragment(input) -> output {
            output.color = vec4f(input.color, 1.0);
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
    public execute(encoder: GPUCommandEncoder): this {
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: this.renderer.context.getCurrentTexture().createView(),
                loadOp: 'load',
                storeOp: 'store',
            }],
        });
        this.bindGroup = this.resources.createBindGroup(this.layouts[0], {
            Camera: UniformData.getByName('Camera')!,
            Probes: this.inputs.get('probe_buffer') as GPUBuffer,
        });

        pass.setPipeline(this.pipeline as GPURenderPipeline);
        pass.setBindGroup(0, this.bindGroup);
        const count = (this.inputs.get('probe_buffer') as GPUBuffer).size / 32;
        pass.draw(6, count, 0, 0);
        pass.end();
        return this;
    }

}