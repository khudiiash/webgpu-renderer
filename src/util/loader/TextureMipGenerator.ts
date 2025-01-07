export class TextureMipGenerator {
    private sampler?: GPUSampler;
    private module?: GPUShaderModule;
    private pipelineByFormat: Record<string, GPURenderPipeline> = {};

    constructor(private device: GPUDevice) {}

    generateMips(texture: GPUTexture) {
        if (!this.module) {
            this.module = this.device.createShaderModule({
                label: 'Mip Generator Shaders',
                code: `
                    struct VSOutput {
                        @builtin(position) position: vec4f,
                        @location(0) texcoord: vec2f,
                    };

                    @vertex fn vs(@builtin(vertex_index) vertexIndex: u32) -> VSOutput {
                        let pos = array(
                            vec2f(0.0, 0.0), vec2f(1.0, 0.0), vec2f(0.0, 1.0),
                            vec2f(0.0, 1.0), vec2f(1.0, 0.0), vec2f(1.0, 1.0),
                        );
                        var output: VSOutput;
                        let xy = pos[vertexIndex];
                        output.position = vec4f(xy * 2.0 - 1.0, 0.0, 1.0);
                        output.texcoord = vec2f(xy.x, 1.0 - xy.y);
                        return output;
                    }

                    @group(0) @binding(0) var ourSampler: sampler;
                    @group(0) @binding(1) var ourTexture: texture_2d<f32>;

                    @fragment fn fs(fsInput: VSOutput) -> @location(0) vec4f {
                        return textureSample(ourTexture, ourSampler, fsInput.texcoord);
                    }
                `,
            });

            this.sampler = this.device.createSampler({
                minFilter: 'linear',
                magFilter: 'linear',
                addressModeU: 'repeat',
            });
        }

        if (!this.pipelineByFormat[texture.format]) {
            this.pipelineByFormat[texture.format] = this.device.createRenderPipeline({
                label: 'Mip Generator Pipeline',
                layout: 'auto',
                vertex: { module: this.module },
                fragment: {
                    module: this.module,
                    targets: [{ format: texture.format }],
                },
            });
        }

        const pipeline = this.pipelineByFormat[texture.format];
        const encoder = this.device.createCommandEncoder({ label: 'mip gen encoder' });

        let width = texture.width;
        let height = texture.height;
        let baseMipLevel = 0;

        while (width > 1 || height > 1) {
            width = Math.max(1, width >> 1);
            height = Math.max(1, height >> 1);

            const bindGroup = this.device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: this.sampler! },
                    { binding: 1, resource: texture.createView({ baseMipLevel, mipLevelCount: 1 }) },
                ],
            });

            ++baseMipLevel;
            const renderPass = encoder.beginRenderPass({
                colorAttachments: [
                    {
                        view: texture.createView({ baseMipLevel, mipLevelCount: 1 }),
                        loadOp: 'clear',
                        storeOp: 'store',
                    },
                ],
            });

            renderPass.setPipeline(pipeline);
            renderPass.setBindGroup(0, bindGroup);
            renderPass.draw(6);
            renderPass.end();
        }

        this.device.queue.submit([encoder.finish()]);
    }
}
