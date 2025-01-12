import { ResourceManager } from '@/engine/ResourceManager';
import { Texture } from '@/data/Texture';

type PassExecuteFn = (encoder: GPUCommandEncoder, resources: Map<string, GPUTextureView>) => void;

interface RenderPassConfig {
    name: string;
    colorAttachments?: {
        texture: string;
        resolveTarget?: string;
        clearValue?: GPUColor;
        loadOp?: GPULoadOp;
        storeOp?: GPUStoreOp;
    }[];
    depthStencilAttachment?: {
        texture: string;
        depthLoadOp?: GPULoadOp;
        depthStoreOp?: GPUStoreOp;
        depthClearValue?: number;
        stencilLoadOp?: GPULoadOp;
        stencilStoreOp?: GPUStoreOp;
        stencilClearValue?: number;
    };
    samples?: number;
}

interface TextureDesc {
    name: string;
    format: GPUTextureFormat;
    width: number;
    height: number;
    usage: GPUTextureUsageFlags;
    sampleCount?: number;
}

class RenderPass {
    name: string;
    config: RenderPassConfig;
    executeFn: PassExecuteFn;
    dependencies: Set<string> = new Set();
    writes: Set<string> = new Set();
    reads: Set<string> = new Set();

    constructor(name: string, config: RenderPassConfig, executeFn: PassExecuteFn) {
        this.name = name;
        this.config = config;
        this.executeFn = executeFn;
        this.analyzeDependencies();
    }

    private analyzeDependencies() {
        this.config.colorAttachments?.forEach(attachment => {
            this.writes.add(attachment.texture);
            if (attachment.resolveTarget) {
                this.writes.add(attachment.resolveTarget);
            }
        });

        if (this.config.depthStencilAttachment) {
            const dsAttachment = this.config.depthStencilAttachment;
            if (dsAttachment.depthLoadOp === 'load') {
                this.reads.add(dsAttachment.texture);
            }
            if (dsAttachment.depthStoreOp === 'store') {
                this.writes.add(dsAttachment.texture);
            }
        }
    }
}

export class RenderGraph {
    private device: GPUDevice;
    private passes: Map<string, RenderPass> = new Map();
    private textures: Map<string, GPUTexture> = new Map();
    private textureViews: Map<string, GPUTextureView> = new Map();
    private textureDescriptors: Map<string, TextureDesc> = new Map();
    private executionOrder: string[] = [];
    private resourceManager: ResourceManager;
    private frameNumber: number = 0;
    private enableLogging: boolean = true;
    
    constructor(device: GPUDevice) {
        this.device = device;
        this.resourceManager = ResourceManager.getInstance();
        this.log('RenderGraph initialized');
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
        //this.cleanupTransientResources();
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
                // Update descriptor dimensions
                desc.width = width;
                desc.height = height;
                
                // Clean up old resources
                const existingTexture = this.textures.get(name);
                if (existingTexture) {
                    this.log(`Destroying old texture: ${name}`);
                    existingTexture.destroy();
                    this.textures.delete(name);
                    this.textureViews.delete(name);
                }
                
                // Create new texture with updated dimensions
                this.addTexture(desc);
            }
        }
    }

    clear() {
        this.log('Clearing all resources');
        
        // Destroy all textures
        for (const [name, texture] of this.textures.entries()) {
            this.log(`Destroying texture: ${name}`);
            texture.destroy();
        }
        
        this.textures.clear();
        this.textureViews.clear();
        this.passes.clear();
        this.executionOrder = [];
        // Don't clear textureDescriptors as we might need them for recreation
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