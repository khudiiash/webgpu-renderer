import { Camera } from "@/camera";
import { Scene } from "@/core";
import { RenderPass } from "../RenderPass";
import { UniformData } from "@/data";
import { Vector2 } from "@/math";
import { Struct } from "@/data/Struct";
import { Shader } from "@/shaders/Shader";
import { BindGroupLayout } from "@/data/BindGroupLayout";
import { Binding } from "@/data/Binding";

export class DistanceFieldPass extends RenderPass {
    numPasses: number = 0;
    jfaTextures!: GPUTexture[];
    uniforms!: UniformData;
    seedPipeline!: GPURenderPipeline;
    distancePipeline!: GPURenderPipeline;
    jfaPipeline!: GPURenderPipeline;
    seedTexture!: GPUTexture;
    distanceTexture!: GPUTexture;
    oneOverSize: Vector2 = new Vector2(1, 1);
    jfaLayout!: BindGroupLayout;
    seedLayout!: BindGroupLayout;
    distanceLayout!: BindGroupLayout;
    width: number = 1;
    height: number = 1;
    sampler!: GPUSampler;
    jfa: { bindGroup: GPUBindGroup, pipeline: GPURenderPipeline, renderPassDescriptor: GPURenderPassDescriptor }[] = [];
    jfaPipelineLayout!: GPUPipelineLayout;

    public init(): this {
        this.renderer.on('resize', () => this.createTextures());
        this.oneOverSize = new Vector2(1 / this.width, 1 / this.height);
        this.sampler = this.resources.getOrCreateSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
        });
        this.uniforms = new UniformData(this, {
            isGlobal: true,
            name: 'DistanceFieldConfig',
            struct: new Struct('DistanceFieldConfig', {
                oneOverSize: 'vec2f',
                offset: 'f32',
            }),
            values: {
                oneOverSize: this.oneOverSize,
                offset: 0.0,
            }
        })

        this.seedLayout = new BindGroupLayout(this.device, 'Seed', 'Global', [
            new Binding('InputTexture').texture().var('input_texture', 'texture_2d<f32>'),
            new Binding('Sampler').sampler().var('sampler_color', 'sampler'),
        ]);

        this.jfaLayout = new BindGroupLayout(this.device, 'JFA', 'Global', [
            new Binding('InputTexture').texture().var('input_texture', 'texture_2d<f32>'),
            new Binding('Sampler').sampler().var('sampler_color', 'sampler'),
        ]);

        this.distanceLayout = new BindGroupLayout(this.device, 'Distance', 'Global', [
            new Binding('InputTexture').texture().var('input_texture', 'texture_2d<f32>'),
            new Binding('Sampler').sampler().var('sampler_color', 'sampler'),
        ]);

        const seedShader = new Shader({
            name: 'SeedShader',
            layouts: [this.seedLayout],
            varyings: [
                { name: 'uv', type: 'vec2f', location: 0 }
            ],
            chunks: ['Quad'],
            fragment: `
                @fragment(input) -> output {
                    let uv = input.uv;
                    let a = textureSample(input_texture, sampler_color, uv).a;
                    output.color = vec4f(uv * ceil(a), 0.0, 1.0);
                    return output;
                }
            `,
        })

        const distanceShader = new Shader({
            name: 'DistanceShader',
            layouts: [this.distanceLayout],
            chunks: ['Quad'],
            varyings: [
                { name: 'uv', type: 'vec2f', location: 0 }
            ],
            fragment: `
                @fragment(input) -> output {
                    let nearestSeed: vec2f = textureSample(input_texture, sampler_color, input.uv).xy;

                    // Clamp by the size of our texture (1.0 in uv space).
                    let d = clamp(distance(input.uv, nearestSeed), 0.0, 1.0);

                    // Normalize and visualize the distance
                    output.color = vec4f(vec3f(d), 1.0);
                    return output;
                }
            `
        })

        const seedPipelineLayout = this.pipelines.createPipelineLayout([this.seedLayout]);
        this.seedPipeline = this.pipelines.createRenderPipeline({
            layout: seedPipelineLayout,
            shader: seedShader,
            targets: [{ format: this.renderer.format }]
        });
        this.jfaPipelineLayout = this.pipelines.createPipelineLayout([this.jfaLayout]);

        const distancePipelineLayout = this.pipelines.createPipelineLayout([this.distanceLayout]);
        this.distancePipeline = this.pipelines.createRenderPipeline({
            layout: distancePipelineLayout,
            shader: distanceShader,
            targets: [{ format: this.renderer.format }]
        });

        this.createTextures();

        return this;
    }

    private createTextures() {
        const { width, height } = this.renderer;
        this.width = width;
        this.height = height;
        this.numPasses = Math.ceil(Math.log2(Math.max(width, height)));
        this.seedTexture = this.createStorageTexture('seed');
        this.distanceTexture = this.createStorageTexture('distance');
        this.oneOverSize.set(1 / width, 1 / height);

        this.jfaTextures = [
            this.createStorageTexture('jfa0'),
            this.createStorageTexture('jfa1')
        ];

        this.generateJFA();
    }

    generateJFAShader(step: number) {
        const oneOverSize = this.oneOverSize;
        return new Shader({
            layouts: [this.jfaLayout],
            chunks: ['Quad'],
            varyings: [
                { name: 'uv', type: 'vec2f', location: 0 }
            ],
            fragment: `

                @fragment(input) -> output {
                    let vUv: vec2f = input.uv;
                    let currentValue = textureSample(input_texture, sampler_color, vUv);
                    var nearestSeed: vec4f = vec4f(0.0);
                    var nearestDist: f32 = 999999.9;
                    let step = f32(${step});
                    let oneOverSize = vec2f(${oneOverSize.x}, ${oneOverSize.y});

                    for (var y = -1.0; y <= 1.0; y+=1.0) {
                        for (var x = -1.0; x <= 1; x+=1.0) {
                            let sampleUV: vec2f = vUv + vec2f(x, y) * step * oneOverSize;

                            // Check bounds
                            if (sampleUV.x < 0.0 || sampleUV.x > 1.0 || sampleUV.y < 0.0 || sampleUV.y > 1.0) {
                                continue;
                            }

                            let sampleValue: vec4f = textureSampleLevel(input_texture, sampler_color, sampleUV, 0);
                            let sampleSeed: vec2f = sampleValue.xy;

                            if (sampleValue.a != 0.0) {
                                let diff: vec2f = sampleSeed - vUv;
                                let dist: f32 = dot(diff, diff);

                                if (dist < nearestDist) {
                                    nearestDist = dist;
                                    nearestSeed = vec4f(sampleSeed, 0.0, 1.0);
                                }
                            }
                        }
                    }

                    if (nearestSeed.x == 0.0 && nearestSeed.y == 0.0) {
                        discard;
                    }

                    output.color = nearestSeed;
                    return output;
                }
            `
        })
    }

    generateJFA() {
        let input = this.seedTexture;
        let output = this.jfaTextures[0];
        this.jfa = [];
        for (let i = 0; i < this.numPasses; i++) {
            const offset = Math.pow(2, this.numPasses - i - 1);
            const shader = this.generateJFAShader(offset);
            const bindGroup = this.resources.createBindGroup(this.jfaLayout, {
                InputTexture: input,
                Sampler: this.sampler,
            });
            const pipeline = this.pipelines.createRenderPipeline({
                layout: this.jfaPipelineLayout,
                shader,
                targets: [{ format: this.renderer.format }]
            });

            let loadOp = (i === 0 || i == 1) ? 'clear' : 'load';
            const renderPassDescriptor = {
                colorAttachments: [{
                    view: output.createView(),
                    loadOp: loadOp as GPULoadOp,
                    storeOp: 'store' as GPUStoreOp,
                }]
            }

            this.jfa.push({
                bindGroup,
                pipeline,
                renderPassDescriptor
            });

            input = output;
            output = output === this.jfaTextures[0] ? this.jfaTextures[1] : this.jfaTextures[0];
        }

    }


    private createStorageTexture(label: string = '') {
        return this.device.createTexture({
            size: [this.width, this.height],
            label,
            format: this.renderer.format,
            usage: GPUTextureUsage.RENDER_ATTACHMENT |
                   GPUTextureUsage.TEXTURE_BINDING |
                   GPUTextureUsage.COPY_DST,
        });
    }

    public beforeRender(): this {
        return this;
    }

    public afterRender(): this {
        return this;

    }

    public execute(encoder: GPUCommandEncoder, scene?: Scene, camera?: Camera): this {
        // Step 1: Seed pass
        const seedPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: this.seedTexture.createView(),
                clearValue: [0, 0, 0, 1],
                loadOp: 'clear',
                storeOp: 'store'
            }]
        })
        seedPass.setPipeline(this.seedPipeline);
        const seedBindGroup = this.resources.createBindGroup(this.seedLayout, {
            InputTexture: this.inputs.get('pbr_texture') as GPUTexture,
            Sampler: this.sampler,
        });
        seedPass.setBindGroup(0, seedBindGroup);
        seedPass.draw(6);
        seedPass.end();

        // Step 2: JFA passes
        for (const jfa of this.jfa) {
            const jfaPass = encoder.beginRenderPass(jfa.renderPassDescriptor);
            jfaPass.setPipeline(jfa.pipeline);
            jfaPass.setBindGroup(0, jfa.bindGroup);
            jfaPass.draw(6);
            jfaPass.end();
        }

        // Step 3: Final distance computation
        const distancePass = encoder.beginRenderPass({
            colorAttachments: [{
                view: this.distanceTexture.createView(),
                loadOp: 'clear',
                storeOp: 'store'
            }]
        });
        distancePass.setPipeline(this.distancePipeline);
        const bindGroup = this.resources.createBindGroup(this.distanceLayout, {
            InputTexture: this.jfaTextures[0],
            Sampler: this.sampler,
        });

        distancePass.setBindGroup(0, bindGroup);
        distancePass.draw(6);
        distancePass.end();

        for (const [key, value] of this.inputs.entries()) {
            this.outputs.set(key, value);
        }

        //this.outputs.set('distance_texture', this.jfaTextures[0]);
        this.outputs.set('distance_texture', this.distanceTexture);
        return this;
    }
}
