class RenderFeature {
    constructor(name, device, pipelineManager, resourceManager) {
        this.name = name;
        this.device = device;
        this.pipelineManager = pipelineManager;
        this.resourceManager = resourceManager;
        this.enabled = true;
        this.renderPasses = new Map();
        this.requiredResources = new Set(); // Track resources needed by this feature
    }

    setup(renderGraph) {
        // Override in derived classes
        // Example: Setup passes and declare resources
    }

    // Add method to declare required resources
    declareResources() {
        return {
            inputs: Array.from(this.requiredResources),
            outputs: []
        };
    }

    // Add method to create render pass descriptors
    createPassDescriptor(passName) {
        const renderPass = this.renderPasses.get(passName);
        if (!renderPass) return null;

        return {
            name: `${this.name}_${passName}`,
            inputs: this.declareResources().inputs,
            outputs: this.declareResources().outputs,
            execute: (encoder, resources) => {
                renderPass.setState(this.preparePipelineState(resources));
                renderPass.execute(encoder);
            }
        };
    }

    preparePipelineState(resources) {
        // Override in derived classes to prepare specific pipeline state
        return {
            pipeline: null,
            bindGroups: []
        };
    }
}