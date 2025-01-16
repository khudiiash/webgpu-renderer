import { PassExecuteFn } from './RenderGraph';
import { RenderPassConfig } from './RenderPassConfig';

export class RenderPass {
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
