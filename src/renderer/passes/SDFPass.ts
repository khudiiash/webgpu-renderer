import { RenderPass } from "../RenderPass";
import { BindGroupLayout } from "@/data/BindGroupLayout";
import { Binding } from "@/data/Binding";
import { UniformData } from "@/data";
import { Struct } from "@/data/Struct";
import { Vector2 } from "@/math";
import { Shader } from "@/materials/shaders/Shader";

export class SDFPass extends RenderPass {
    width: number = 0;
    height: number = 0;
    format: GPUTextureFormat = 'r32float';
    dimensions: Vector2 = new Vector2(1, 1);
    pingTexture!: GPUTexture;
    pongTexture!: GPUTexture;
    uniforms!: UniformData;
    propagationPipeline!: GPUComputePipeline;
    seedPipeline!: GPUComputePipeline;
    accumTexture!: GPUTexture;

    public init(): this {
        this.createTextures();
        this.renderer.on('resize', this.createTextures, this);

        this.uniforms = new UniformData(this, {
            name: 'SDFConfig',
            struct: new Struct('SDFConfig', {
                dimensions: 'vec2u',
                step: 'u32'
            }),
            isGlobal: true,
            values: {
                dimensions: this.dimensions,
                step: 0, 
            }
        })
        this.layouts = [
            new BindGroupLayout(this.device, 'SDF', 'Global', [
                new Binding('Uniforms').uniform().visibility('compute').var('uniforms', 'SDFConfig'),
                new Binding('InputTexture').texture({ sampleType: 'unfilterable-float' }).visibility('compute').var('input_texture', 'texture_2d<f32>'),
                new Binding('OutputTexture').storageTexture({ format: 'rgba32float', access: 'write-only' }).visibility('compute').var('output_texture', 'texture_storage_2d<rgba32float, write>'),
                new Binding('Accumulator').storageTexture({ format: 'r32float', access: 'read-write' }).visibility('compute').var('accumulator', 'texture_storage_2d<r32float, read_write>'),
            ])
        ];

        const seedShader = new Shader({
            name: 'SDFSeed',
            layouts: this.layouts,
            compute: `
                @compute @workgroup_size(16, 16)
                fn main(@builtin(global_invocation_id) global_id: vec3u) {
                    let coords = vec2i(global_id.xy);
                    let dims = vec2i(uniforms.dimensions);
                    

                    let texel = textureLoad(input_texture, coords, 0);
                    var distance = vec4f(1e7, 1e7, 0.0, 1.0);
                    
                    if (texel.a > 0.5) {
                        distance = vec4f(vec2f(coords), 0.0, 1.0);
                    }
                    
                    textureStore(output_texture, coords, distance);
                }
            `
        });

        const propagationShader = new Shader({
            name: 'SDFPropagation',
            layouts: this.layouts,
            compute: `
                fn computeDistance(seedPos: vec2<f32>, currentPos: vec2<f32>) -> f32 {
                    let diff = seedPos - currentPos;
                    return dot(diff, diff); // squared distance
                }

                @compute @workgroup_size(8, 8)
                fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
                    let coords = vec2<i32>(global_id.xy);
                    let dims = vec2<i32>(uniforms.dimensions);
                    let step = i32(uniforms.step);
                    

                    let currentPos = vec2<f32>(coords);
                    var minDistance = 1e7;
                    var closestSeedPos = vec2<f32>(0.0);

                    // Check neighboring pixels in a jump flooding pattern
                    for (var dy = -1; dy <= 1; dy += 1) {
                        for (var dx = -1; dx <= 1; dx += 1) {
                            let samplePos = coords + vec2i(dx, dy) * step;
                            

                            let seedPosData = textureLoad(input_texture, samplePos, 0);
                            let seedPos = seedPosData.xy;
                            
                            if (seedPosData.x != 0.0 && seedPosData.y != 0.0) {
                                let dist = computeDistance(seedPos, currentPos);
                                if (dist < minDistance) {
                                    minDistance = dist;
                                    closestSeedPos = seedPos;
                                }
                            }
                        }
                    }

                    let currentAccum = textureLoad(accumulator, coords).r;
                    if (currentAccum > 0.0 && closestSeedPos.x == 0.0) {
                        return;
                    }
                    else if (closestSeedPos.x != 0.0) {
                        // Store closest seed position and its distance
                        let distance = sqrt(minDistance);
                        textureStore(output_texture, coords, vec4<f32>(closestSeedPos, distance, 1.0));
                        textureStore(accumulator, coords, vec4<f32>(minDistance, 0.0, 0.0, 0.0));
                    }


                }
            `
        });

        const pipelineLayout = this.pipelines.createPipelineLayout(this.layouts);
        this.seedPipeline = this.pipelines.createComputePipeline({
            layout: pipelineLayout,
            shader: seedShader
        }); 

        this.propagationPipeline = this.pipelines.createComputePipeline({
            layout: pipelineLayout,
            shader: propagationShader
        });

        return this;
    }

    private createTextures() {
        const { width, height } = this.renderer;
        this.width = width;
        this.height = height;

        const textureDescriptor = {
            size: {
                width: this.width,
                height: this.height,
                depthOrArrayLayers: 1
            },
            format: 'rgba32float' as GPUTextureFormat,
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING
        };

        this.pingTexture = this.device.createTexture(textureDescriptor);
        this.pongTexture = this.device.createTexture(textureDescriptor);

        this.accumTexture = this.device.createTexture({
            size: {
                width: this.width,
                height: this.height,
                depthOrArrayLayers: 1
            },
            format: 'r32float',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING
        });
        this.dimensions.set(this.width, this.height);
    }
    public beforeRender(): this {
        return this;
    }
    public afterRender(): this {
        return this;
    }
    public execute(encoder: GPUCommandEncoder): this {
        const { width, height } = this;

        const bindGroup = this.resources.createBindGroup(this.layouts[0], {
            Uniforms: this.uniforms,
            InputTexture: this.inputs.get('albedo_texture') as GPUTexture,
            OutputTexture: this.pingTexture,
            Accumulator: this.accumTexture
        });
        const seedPass = encoder.beginComputePass();
        seedPass.setPipeline(this.seedPipeline);
        seedPass.setBindGroup(0, bindGroup);
        seedPass.dispatchWorkgroups(
            Math.ceil(width / 16),
            Math.ceil(height / 16),
        );
        seedPass.end();

        // Jump flooding passes
        let step = Math.ceil(Math.max(width, height) / 2);
        let pingPong = true;
        while (step > 0) {
            const bindGroup = this.resources.createBindGroup(this.layouts[0], {
                Uniforms: this.uniforms,
                InputTexture: (pingPong ? this.pingTexture : this.pongTexture),
                OutputTexture: (pingPong ? this.pongTexture : this.pingTexture),
                Accumulator: this.accumTexture
            })
            this.uniforms.set('step', step);
            const pass = encoder.beginComputePass();
            pass.setPipeline(this.propagationPipeline);
            pass.setBindGroup(0, bindGroup);
            pass.dispatchWorkgroups(
                Math.ceil(width / 16),
                Math.ceil(height / 16)
            );
            pass.end();

            step = Math.floor(step / 2);
            pingPong = !pingPong;
        }

        for (const [key, value] of this.inputs.entries()) {
            this.outputs.set(key, value);
        }

        //this.outputs.set('distance_texture', pingPong ? this.pingTexture : this.pongTexture);
        this.outputs.set('distance_texture', this.pingTexture);
        return this;
    }
}