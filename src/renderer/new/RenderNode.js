class RenderNode {
    constructor(descriptor) {
        this.name = descriptor.name;
        this.inputs = new Set(descriptor.inputs);
        this.outputs = new Set(descriptor.outputs);
        this.execute = descriptor.execute;
        this.active = true;
        this.priority = 0;
    }

    setActive(active) {
        this.active = active;
    }

    setPriority(priority) {
        this.priority = priority;
    }
}

export { RenderNode };