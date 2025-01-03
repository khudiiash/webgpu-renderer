import { RenderNode } from './RenderNode.js';
/**
 * @typedef {{
 *     [key: string]: GPUBuffer | GPUSampler | GPUTexture
 * }} PassResources
 * 
 * @typedef {{
 *      name: string,
 *      inputs: string[],
 *      outputs: string[],
 *      execute: (encoder: GPURenderPassEncoder, resources: PassResources) => void
 * }} RenderPassDescriptor
 */

class RenderGraph {
    constructor() {
        this.nodes = new Map();
        this.edges = new Map();
        this.resources = new Map();
        this.sortedNodes = null;
    }

    /**
     * @param {RenderPassDescriptor} descriptor
     */
    addPass(descriptor) {
        const node = new RenderNode(descriptor);
        this.nodes.set(node.name, node);

        // Create edges for resource dependencies
        for (const input of node.inputs) {
            if (!this.edges.has(input)) {
                this.edges.set(input, new Set());
            }
            this.edges.get(input).add(node.name);
        }

        // Invalidate cached sort
        this.sortedNodes = null;
    }

    /**
     * @param {string} name
     * @param {GPUTexture | GPUBuffer} resource
     */
    setResource(name, resource) {
        this.resources.set(name, resource);
    }

    /**
     * @returns {RenderNode[]}
     */
    sortPasses() {
        if (this.sortedNodes) {
            return this.sortedNodes;
        }

        const visited = new Set();
        const sorted = [];

        const visit = (nodeName) => {
            if (visited.has(nodeName)) return;

            visited.add(nodeName);
            const node = this.nodes.get(nodeName);

            // Visit all dependent nodes
            for (const output of node.outputs) {
                if (this.edges.has(output)) {
                    for (const dependent of this.edges.get(output)) {
                        visit(dependent);
                    }
                }
            }

            sorted.unshift(node);
        };

        // Visit all nodes
        for (const nodeName of this.nodes.keys()) {
            visit(nodeName);
        }

        this.sortedNodes = sorted;
        return sorted;
    }

    /**
     * @param {GPUCommandEncoder} encoder
     */
    execute(encoder) {
        const nodes = this.sortPasses();

        for (const node of nodes) {
            const resources = {};
            
            // Gather input resources
            for (const input of node.inputs) {
                const resource = this.resources.get(input);
                if (resource) {
                    resources[input] = resource;
                }
            }

            // Execute the render pass
            const passEncoder = encoder.beginRenderPass({
                colorAttachments: this.createColorAttachments(node),
                depthStencilAttachment: this.createDepthStencilAttachment(node)
            });

            node.execute(passEncoder, resources);
            passEncoder.end();
        }
    }

    /**
     * @private
     * @param {RenderNode} node
     * @returns {GPURenderPassColorAttachment[]}
     */
    createColorAttachments(node) {
        return Array.from(node.outputs)
            .filter(output => this.resources.has(output))
            .map(output => ({
                view: this.resources.get(output).createView(),
                clearValue: [0, 0, 0, 1],
                loadOp: 'clear',
                storeOp: 'store'
            }));
    }

    /**
     * @private
     * @param {RenderNode} node
     * @returns {GPURenderPassDepthStencilAttachment | undefined}
     */
    createDepthStencilAttachment(node) {
        const depthTexture = this.resources.get('depth');
        if (!depthTexture) return undefined;

        return {
            view: depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
            stencilClearValue: 0,
            stencilLoadOp: 'clear',
            stencilStoreOp: 'store'
        };
    }
}

export { RenderGraph };