import { RenderPass } from "../RenderPass";
import { UniformData } from "@/data";
import { Vector2 } from "@/math";
import { Struct } from "@/data/Struct";
import { Shader } from "@/materials/shaders/Shader";
import { BindGroupLayout } from "@/data/BindGroupLayout";
import { Binding } from "@/data/Binding";

export class DistanceFieldPass extends RenderPass {
    numPasses: number = 0;
    jfaTextures!: GPUTexture[];
    uniforms!: UniformData;
    seedPipeline!: GPUComputePipeline;
    distancePipeline!: GPUComputePipeline;
    jfaPipeline!: GPUComputePipeline;
    seedTexture!: GPUTexture;
    distanceTexture!: GPUTexture;
    resolution: Vector2 = new Vector2(1, 1);
    oneOverSize: Vector2 = new Vector2(1, 1);   
    jfaLayout!: BindGroupLayout;
    seedLayout!: BindGroupLayout;
    distanceLayout!: BindGroupLayout;
    width: number = 1;
    height: number = 1;
    accumulator: any;
    jfaPipelineLayout!: GPUPipelineLayout;
    jfa: { bindGroup: GPUBindGroup; pipeline: GPUComputePipeline; }[] = [];

    public init(): this {
        this.renderer.on('resize', () => this.createTextures());
        this.uniforms = new UniformData(this, {
            isGlobal: true,
            name: 'DistanceFieldConfig',
            struct: new Struct('DistanceFieldConfig', {
                oneOverSize: 'vec2f',
                resolution: 'vec2u',
                offset: 'f32',
            }),
            values: {
                oneOverSize: this.oneOverSize,
                resolution: this.resolution,
                offset: 0.0,
            }
        }) 

        this.seedLayout = new BindGroupLayout(this.device, 'Seed', 'Global', [
            new Binding('InputTexture').texture().visibility('compute').var('input_texture', 'texture_2d<f32>'),
            new Binding('OutputTexture').storageTexture({ format: 'rgba16float', access: 'write-only' }).visibility('compute').var('output_texture', 'texture_storage_2d<rgba16float, write>'),
            new Binding('Uniforms').uniform().visibility('compute').var('uniforms', 'DistanceFieldConfig'),
        ]);

        this.jfaLayout = new BindGroupLayout(this.device, 'JFA', 'Global', [
            new Binding('InputTexture').storageTexture({ format: 'rgba16float', access: 'read-only' }).visibility('compute').var('input_texture', 'texture_storage_2d<rgba16float, read>'),
            new Binding('OutputTexture').storageTexture({ format: 'rgba16float', access: 'write-only' }).visibility('compute').var('output_texture', 'texture_storage_2d<rgba16float, write>'),
        ]);

        this.distanceLayout = new BindGroupLayout(this.device, 'Distance', 'Global', [
            new Binding('InputTexture').storageTexture({ format: 'rgba16float', access: 'read-only' }).visibility('compute').var('input_texture', 'texture_storage_2d<rgba16float, read>'),
            new Binding('OutputTexture').storageTexture({ format: 'rgba16float', access: 'write-only' }).visibility('compute').var('output_texture', 'texture_storage_2d<rgba16float, write>'),
            new Binding('Uniforms').uniform().visibility('compute').var('uniforms', 'DistanceFieldConfig'),
        ]);


        const seedShader = new Shader({
            name: 'SeedShader',
            layouts: [this.seedLayout],
            compute: `
                @compute @workgroup_size(8, 8)
                fn seed_cs(@builtin(global_invocation_id) global_id: vec3u) {
                    let coords = vec2<i32>(global_id.xy);
                    let resolution = vec2f(uniforms.resolution);
                    let uv = vec2f(coords) * uniforms.oneOverSize;
                    let alpha = textureLoad(input_texture, coords, 0).a;
                    let result = vec4f(uv * ceil(alpha), 0.0, .0);
                    textureStore(output_texture, coords, result);
                }
            `
        })

        const distanceShader = new Shader({
            name: 'DistanceShader',
            layouts: [this.distanceLayout],
            compute: `
                @compute @workgroup_size(8, 8)
                fn distance_cs(@builtin(global_invocation_id) global_id: vec3<u32>) {
                    let coords = vec2i(global_id.xy);
                    let vUv: vec2f = vec2f(coords) * uniforms.oneOverSize;
                    let nearestSeed: vec2f = textureLoad(input_texture, coords).xy;
                    let d: f32 = clamp(distance(vUv, nearestSeed), 0.0, 1.0);
                    textureStore(output_texture, coords, vec4f(vec3f(d), 0.0));
                }
            `
        })



        const seedPipelineLayout = this.pipelines.createPipelineLayout([this.seedLayout]);
        this.seedPipeline = this.pipelines.createComputePipeline({
            layout: seedPipelineLayout,
            shader: seedShader,
        });
        this.jfaPipelineLayout = this.pipelines.createPipelineLayout([this.jfaLayout]);

        const distancePipelineLayout = this.pipelines.createPipelineLayout([this.distanceLayout]);
        this.distancePipeline = this.pipelines.createComputePipeline({
            layout: distancePipelineLayout,
            shader: distanceShader,
        });

        this.createTextures();

        return this;
    }

    private createTextures() {
        const { width, height } = this.renderer;
        this.width = width;
        this.height = height;
        this.numPasses = Math.ceil(Math.log2(Math.max(this.width, this.height)));
        if (this.seedTexture) {
            this.seedTexture.destroy();
        }
        this.seedTexture = this.createStorageTexture('seed');
        if (this.distanceTexture) {
            this.distanceTexture.destroy();
        }
        this.distanceTexture = this.createStorageTexture('distance');
        this.resolution.set(this.width, this.height);
        this.oneOverSize.set(1 / this.width, 1 / this.height);
        if (this.accumulator) {
            this.accumulator.destroy();
        }

        this.accumulator = this.device.createTexture({
            size: [this.width, this.height],
            format: 'r32float',
            usage: GPUTextureUsage.STORAGE_BINDING | 
                   GPUTextureUsage.TEXTURE_BINDING
        })

        if (this.jfaTextures?.length) {
            for (const texture of this.jfaTextures) {
                texture.destroy();
            }
        }
        this.jfaTextures = [
            this.createStorageTexture('jfa0'),
            this.createStorageTexture('jfa1')
        ];

        this.createJFA();
    }

    generateJFAShader(step: number) {
        const width = this.width;
        const height = this.height;

        const oneOverSize = [1 / width, 1 / height];
        const resolution = [width, height];
        return new Shader({
            name: `JFA${step}`,
            layouts: [this.jfaLayout],
            compute: `
                @compute @workgroup_size(8, 8)
                fn jfa_cs(@builtin(global_invocation_id) global_id: vec3<u32>) {
                    let coords = vec2<i32>(global_id.xy);
                    let oneOverSize = vec2f(${oneOverSize[0]}, ${oneOverSize[1]});
                    let step = f32(${step});
                    let resolution = vec2f(${resolution[0]}, ${resolution[1]});
                    let vUv = vec2f(coords) * oneOverSize;
                    var nearestSeed: vec4f = vec4f(0);
                    var nearestDist: f32 = 999999.9;

                    for (var y = -1.0; y <= 1.0; y += 1.0) {
                        for (var x = -1.0; x <= 1.0; x += 1.0) {
                            let sampleUV = vUv + vec2f(x, y) * step * oneOverSize;
                            
                            if (sampleUV.x < 0.0 || sampleUV.x > 1.0 || sampleUV.y < 0.0 || sampleUV.y > 1.0) {
                                continue;
                            }
                            
                            let sampleCoords = vec2<i32>(sampleUV * resolution);
                            let sampleValue = textureLoad(input_texture, sampleCoords);
                            let sampleSeed = sampleValue.xy;
                            
                            // Only consider valid seeds
                            if (sampleSeed.x != 0.0 || sampleSeed.y != 0.0) {
                                let diff = sampleSeed - vUv;
                                let dist = dot(diff, diff);
                                if (dist < nearestDist) {
                                    nearestDist = dist;
                                    nearestSeed = sampleValue;
                                }
                            }
                        }
                    }

                    textureStore(output_texture, coords, vec4f(0.1, 0.5, 0.0, 1.0));
                }
            `
        });
    }

    createJFA() {
        let input = this.seedTexture;
        let output = this.jfaTextures[0];
        this.jfa = [];
        for (let i = 0; i < this.numPasses; i++) {
            const offset = Math.pow(2, this.numPasses - i - 1);
            const shader = this.generateJFAShader(offset);
            const bindGroup = this.resources.createBindGroup(this.jfaLayout, {
                InputTexture: input,
                OutputTexture: output,
            });
            const pipeline = this.pipelines.createComputePipeline({
                layout: this.jfaPipelineLayout,
                shader,
            })

            this.jfa.push({
                bindGroup,
                pipeline
            });

            input = output;
            output = this.jfaTextures[(i + 1) % 2];

        }


    }


    private createStorageTexture(label: string = '') {
        return this.device.createTexture({
            size: [this.width, this.height],
            label,
            format: 'rgba16float',
            usage: GPUTextureUsage.STORAGE_BINDING | 
                   GPUTextureUsage.TEXTURE_BINDING
        });
    }


    public beforeRender(): this {
        return this;
    }

    public afterRender(): this {
        return this;
    }


    public execute(encoder: GPUCommandEncoder): this {
        // Step 1: Seed pass
        const seedPass = encoder.beginComputePass();
        seedPass.setPipeline(this.seedPipeline);
        const seedBindGroup = this.resources.createBindGroup(this.seedLayout, {
            InputTexture: this.inputs.get('albedo_texture') as GPUTexture,
            OutputTexture: this.seedTexture,
            Uniforms: this.uniforms
        });
        seedPass.setBindGroup(0, seedBindGroup);
        seedPass.dispatchWorkgroups(
            Math.ceil(this.width / 8),
            Math.ceil(this.height / 8)
        );
        seedPass.end();

        // Step 2: JFA passes
        for (const jfaPass of this.jfa) {
            const jfaPassEncoder = encoder.beginComputePass();
            jfaPassEncoder.setPipeline(jfaPass.pipeline);
            jfaPassEncoder.setBindGroup(0, jfaPass.bindGroup);
            jfaPassEncoder.dispatchWorkgroups(
                Math.ceil(this.width / 8),
                Math.ceil(this.height / 8)
            );
            jfaPassEncoder.end();
        }


        // Step 3: Final distance computation
        const distancePass = encoder.beginComputePass();
        distancePass.setPipeline(this.distancePipeline);
        const bindGroup = this.resources.createBindGroup(this.distanceLayout, {
            InputTexture: this.jfaTextures[0],
            OutputTexture: this.distanceTexture,
            Uniforms: this.uniforms
        });

        distancePass.setBindGroup(0, bindGroup);
        distancePass.dispatchWorkgroups(
            Math.ceil(this.width / 8),
            Math.ceil(this.height / 8)
        );
        distancePass.end();

        for (const [key, value] of this.inputs.entries()) {
            this.outputs.set(key, value);
        }

        this.outputs.set('distance_texture', this.jfaTextures[0]);
        return this;
    }
}