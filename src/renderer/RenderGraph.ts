export class RenderGraph {
    private device: GPUDevice;
    private commandEncoder: GPUCommandEncoder;
    private renderPassDescriptor: GPURenderPassDescriptor;

    constructor(device: GPUDevice) {
        this.device = device;
        this.commandEncoder = device.createCommandEncoder();
        this.renderPassDescriptor = {
            colorAttachments: [{
                view: undefined, // This will be set later
                clearValue: { r: 0, g: 0, b: 0, a: 1 }, // Clear color
                loadOp: 'clear',
                storeOp: 'store'
            }]
        };
    }

    beginFrame(textureView: GPUTextureView) {
        this.renderPassDescriptor.colorAttachments[0].view = textureView;
        const renderPassEncoder = this.commandEncoder.beginRenderPass(this.renderPassDescriptor);
        return renderPassEncoder;
    }

    endFrame() {
        this.commandEncoder.finish();
        this.device.queue.submit([this.commandEncoder.finish()]);
    }
}