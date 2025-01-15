import { ResourceManager } from '@/engine/ResourceManager';
import { RenderPassConfig } from './RenderPassConfig';
import { TextureDesc } from './TextureDesc';
import { RenderPass } from './RenderPass';

export type PassExecuteFn = (encoder: GPUCommandEncoder, resources: Map<string, GPUTextureView>) => void;

export class RenderGraph {
    private device: GPUDevice;
    private passes: Map<string, RenderPass> = new Map();
    private textures: Map<string, GPUTexture> = new Map();
    private textureViews: Map<string, GPUTextureView> = new Map();
    private textureDescriptors: Map<string, TextureDesc> = new Map();
    private executionOrder: string[] = [];
    private frameNumber: number = 0;
    private enableLogging: boolean = true;
    
    // Presentation related members
    private presentPipeline!: GPURenderPipeline;
    private presentBindGroupLayout!: GPUBindGroupLayout;
    private presentSampler!: GPUSampler;
    private context!: GPUCanvasContext;
    
    constructor(device: GPUDevice, context: GPUCanvasContext) {
        this.device = device;
        this.context = context;
        this.initializePresentationPipeline();
        this.log('RenderGraph initialized');
    }

    private initializePresentationPipeline() {
        const presentationShaderModule = this.device.createShaderModule({
            label: 'Present Shader',
            code: `
                @vertex
                fn vertexMain(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4<f32> {
                    var pos = array<vec2<f32>, 4>(
                        vec2<f32>(-1.0, -1.0),
                        vec2<f32>( 1.0, -1.0),
                        vec2<f32>(-1.0,  1.0),
                        vec2<f32>( 1.0,  1.0)
                    );
                    return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
                }

                @group(0) @binding(0) var inputTexture: texture_2d<f32>;
                @group(0) @binding(1) var texSampler: sampler;

                @fragment
                fn fragmentMain(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
                    let texCoord = vec2<f32>(pos.xy) / vec2<f32>(textureDimensions(inputTexture));
                    return textureSample(inputTexture, texSampler, texCoord);
                }
            `
        });

        this.presentBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {}
                }
            ]
        });

        this.presentPipeline = this.device.createRenderPipeline({
            layout: this.device.createPipelineLayout({
                bindGroupLayouts: [this.presentBindGroupLayout]
            }),
            vertex: {
                module: presentationShaderModule,
                entryPoint: 'vertexMain'
            },
            fragment: {
                module: presentationShaderModule,
                entryPoint: 'fragmentMain',
                targets: [{
                    format: this.context.getCurrentTexture().format
                }]
            },
            primitive: {
                topology: 'triangle-strip',
                stripIndexFormat: 'uint32'
            }
        });

        this.presentSampler = this.device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear'
        });
    }

    private log(message: string, data?: any) {
        if (!this.enableLogging) return;
        
        const prefix = `[RenderGraph][Frame ${this.frameNumber}]`;
        if (data) {
            console.log(prefix, message, data);
        } else {
            console.log(prefix, message);
        }
    }

    setLogging(enabled: boolean) {
        this.enableLogging = enabled;
        this.log(`Logging ${enabled ? 'enabled' : 'disabled'}`);
    }

    addPass(config: RenderPassConfig, executeFn: PassExecuteFn): RenderPass {
        this.log(`Adding pass: ${config.name}`, {
            colorAttachments: config.colorAttachments,
            depthStencilAttachment: config.depthStencilAttachment
        });
        
        const pass = new RenderPass(config.name, config, executeFn);
        this.passes.set(config.name, pass);
        return pass;
    }

    addPresentationPass(sourceTextureName: string) {
        this.addPass({
            name: 'presentPass',
            colorAttachments: [{
                texture: 'presentationTarget',
                loadOp: 'clear',
                storeOp: 'store',
                clearValue: { r: 0, g: 0, b: 0, a: 1 }
            }]
        }, (encoder: GPUCommandEncoder, resources: Map<string, GPUTextureView>) => {
            const sourceTextureView = resources.get(sourceTextureName);
            if (!sourceTextureView) {
                console.error(`Source texture ${sourceTextureName} not found for presentation`);
                return;
            }

            const presentBindGroup = this.device.createBindGroup({
                layout: this.presentBindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: sourceTextureView
                    },
                    {
                        binding: 1,
                        resource: this.presentSampler
                    }
                ]
            });

            const renderPass = encoder.beginRenderPass({
                colorAttachments: [{
                    view: this.context.getCurrentTexture().createView(),
                    clearValue: { r: 0, g: 0, b: 0, a: 1 },
                    loadOp: 'clear',
                    storeOp: 'store'
                }]
            });

            renderPass.setPipeline(this.presentPipeline);
            renderPass.setBindGroup(0, presentBindGroup);
            renderPass.draw(4, 1, 0, 0);
            renderPass.end();
        });
    }

    verifyRequiredTextures(names: string[]): boolean {
        for (const name of names) {
            if (!this.textures.has(name)) {
                console.error(`Required texture ${name} not found`);
                return false;
            }
        }
        return true;
    }

    addTexture(desc: TextureDesc) {
        this.log(`Adding texture: ${desc.name}`, {
            format: desc.format,
            size: `${desc.width}x${desc.height}`,
            usage: desc.usage
        });
        
        // Store the descriptor for future reference (resize, recreation, etc.)
        this.textureDescriptors.set(desc.name, desc);
        
        const texture = this.device.createTexture({
            size: {
                width: desc.width,
                height: desc.height,
                depthOrArrayLayers: 1,
            },
            format: desc.format,
            usage: desc.usage,
            sampleCount: desc.sampleCount || 1,
        });
    
        this.textures.set(desc.name, texture);
        const view = texture.createView();
        this.textureViews.set(desc.name, view);
        
        return texture;
    }
    
    private createOrUpdateTextures() {
        for (const [name, desc] of this.textureDescriptors.entries()) {
            if (!this.textures.has(name)) {
                this.addTexture(desc);
            }
        }
    }

    // Add method to get texture
    getTexture(name: string): GPUTexture | undefined {
        return this.textures.get(name);
    }
    
    execute() {
        this.frameNumber++;
        this.log(`Starting frame execution`);
        
        if (this.executionOrder.length === 0) {
            this.log('Computing execution order');
            this.computeExecutionOrder();
        }
    
        // Only create/update textures if they don't exist or need resizing
        this.createOrUpdateTextures();
        
        const commandEncoder = this.device.createCommandEncoder();
        this.log(`Executing passes in order: ${this.executionOrder.join(' -> ')}`);
    
        for (const passName of this.executionOrder) {
            this.log(`Executing pass: ${passName}`);
            const pass = this.passes.get(passName)!;
            
            const startTime = performance.now();
            pass.executeFn(commandEncoder, this.textureViews);
            const endTime = performance.now();
            
            this.log(`Pass ${passName} completed in ${(endTime - startTime).toFixed(2)}ms`);
        }
    
        const commandBuffer = commandEncoder.finish();
        this.device.queue.submit([commandBuffer]);
        
        this.log('Frame execution completed');
    
        // Clear passes but keep textures
        this.passes.clear();
        this.executionOrder = [];
    }

    private computeExecutionOrder() {
        const visited = new Set<string>();
        const order: string[] = [];

        const visit = (passName: string) => {
            if (visited.has(passName)) return;
            
            const pass = this.passes.get(passName)!;
            for (const dep of pass.dependencies) {
                visit(dep);
            }

            visited.add(passName);
            order.push(passName);
        };

        for (const passName of this.passes.keys()) {
            visit(passName);
        }

        this.executionOrder = order;
        this.log('Computed execution order', order);
    }

    resize(width: number, height: number) {
        this.log(`Resizing to ${width}x${height}`);
        
        for (const [name, desc] of this.textureDescriptors.entries()) {
            if (desc.width !== width || desc.height !== height) {
                desc.width = width;
                desc.height = height;
                
                const existingTexture = this.textures.get(name);
                if (existingTexture) {
                    this.log(`Destroying old texture: ${name}`);
                    existingTexture.destroy();
                    this.textures.delete(name);
                    this.textureViews.delete(name);
                }
                
                this.addTexture(desc);
            }
        }
    }

    clear() {
        this.log('Clearing render graph');
        this.passes.clear();
        this.executionOrder = [];
    }

    getStats() {
        return {
            frameNumber: this.frameNumber,
            passCount: this.passes.size,
            textureCount: this.textures.size,
            executionOrder: [...this.executionOrder],
            activeTextures: Array.from(this.textures.keys()),
        };
    }
}