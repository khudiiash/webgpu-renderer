import { Texture2D } from '@/data/Texture2D';

export class RenderGraph {
    private device: GPUDevice;
    private commandEncoder: GPUCommandEncoder;
    private colorAttachments: GPURenderPassColorAttachment[];
    private renderPassDescriptor: GPURenderPassDescriptor;
    constructor(device: GPUDevice) {
        this.device = device;
        this.commandEncoder = device.createCommandEncoder();
        this.colorAttachments = [
            {
                view: Texture2D.DEFAULT.createView() as GPUTextureView,
                clearValue: { r: 0, g: 0, b: 0, a: 1 }, // Clear color
                loadOp: 'clear',
                storeOp: 'store'
            }
        ];
        this.renderPassDescriptor = {
            colorAttachments: this.colorAttachments
        };
    }
    beginFrame(textureView: GPUTextureView) {
        this.colorAttachments[0].view = textureView;
        const renderPassEncoder = this.commandEncoder.beginRenderPass(this.renderPassDescriptor);
        return renderPassEncoder;
    }

    endFrame() {
        this.commandEncoder.finish();
        this.device.queue.submit([this.commandEncoder.finish()]);
    }
}