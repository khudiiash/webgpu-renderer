class RenderPass {
    /**
     * @typedef {{
     *    pipeline: GPURenderPipeline,
     *    bindGroups?: GPUBindGroup[],
     *    viewport?: { x: number, y: number, width: number, height: number },
     *    scissor?: { x: number, y: number, width: number, height: number }
     * }} PassState
     */

    /**
     * @param {string} name
     * @param {GPUDevice} device
     */
    constructor(name, device) {
        this.name = name;
        this.device = device;
        /** @type {PassState} */
        this.state = null;
    }

    /**
     * @param {PassState} state
     */
    setState(state) {
        this.state = state;
    }

    /**
     * @param {GPURenderPassEncoder} encoder
     */
    execute(encoder) {
        if (!this.state || !this.state.pipeline) {
            console.warn(`No pipeline set for pass ${this.name}`);
            return;
        }

        encoder.setPipeline(this.state.pipeline);

        if (this.state.viewport) {
            encoder.setViewport(
                this.state.viewport.x,
                this.state.viewport.y,
                this.state.viewport.width,
                this.state.viewport.height,
                0,
                1
            );
        }

        if (this.state.scissor) {
            encoder.setScissorRect(
                this.state.scissor.x,
                this.state.scissor.y,
                this.state.scissor.width,
                this.state.scissor.height
            );
        }

        if (this.state.bindGroups) {
            this.state.bindGroups.forEach((group, index) => {
                if (group) encoder.setBindGroup(index, group);
            });
        }
    }
}

export { RenderPass };