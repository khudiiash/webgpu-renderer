export interface RenderPassConfig {
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
