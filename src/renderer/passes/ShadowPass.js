class ShadowPass extends RenderPass {
    constructor(device, pipelineManager, resourceManager) {
        super('shadow', device);
        this.pipelineManager = pipelineManager;
        this.resourceManager = resourceManager;
        this.shadowBundle = null;
        this.needsUpdate = true;
        this.frames = 0;
    }

    setup() {
        // Create shadow map texture if it doesn't exist
        if (!this.resourceManager.textures.has('shadowMap')) {
            this.resourceManager.createTexture('shadowMap', {
                size: { width: 2048, height: 2048, depthOrArrayLayers: 1 },
                format: 'depth32float',
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
            });
        }

        // Create shadow pipeline if needed
        if (!this.pipelineManager.pipelineCache.has('shadow')) {
            this.pipelineManager.createRenderPipeline({
                name: 'shadow',
                vertex: {
                    code: /* wgsl */`
                        struct VertexInput {
                            @location(0) position: vec3f,
                        }

                        struct VertexOutput {
                            @builtin(position) position: vec4f,
                        }

                        @group(0) @binding(0) var<uniform> lightViewProj: mat4x4f;
                        @group(1) @binding(0) var<uniform> model: mat4x4f;

                        @vertex
                        fn main(input: VertexInput) -> VertexOutput {
                            var output: VertexOutput;
                            output.position = lightViewProj * model * vec4f(input.position, 1.0);
                            return output;
                        }`,
                    entryPoint: 'main'
                },
                primitive: {
                    topology: 'triangle-list',
                    cullMode: 'back'
                },
                depthStencil: {
                    format: 'depth32float',
                    depthWriteEnabled: true,
                    depthCompare: 'less'
                },
                vertex_buffers: [{
                    arrayStride: 12,
                    attributes: [{
                        format: 'float32x3',
                        offset: 0,
                        shaderLocation: 0
                    }]
                }]
            });
        }
    }

    /**
     * @param {Scene} scene
     * @param {GPURenderPassEncoder} passEncoder
     * @param {DirectionalLight[]} lights
     */
    draw(scene, passEncoder, lights) {
        // If we have a cached bundle and don't need updates, use it
        if (this.shadowBundle && !this.needsUpdate) {
            passEncoder.executeBundles([this.shadowBundle]);
            return;
        }

        // Create a new render bundle
        const bundleEncoder = this.device.createRenderBundleEncoder({
            colorFormats: [],
            depthStencilFormat: 'depth32float',
        });

        const pipeline = this.pipelineManager.pipelineCache.get('shadow');
        bundleEncoder.setPipeline(pipeline);

        // Draw each object from light's perspective
        for (const light of lights) {
            const lightViewProj = light.getViewProjectionMatrix();
            const lightBuffer = this.resourceManager.createBuffer('lightViewProj', {
                size: 64, // 4x4 matrix
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            });
            this.resourceManager.updateBuffer('lightViewProj', lightViewProj);

            const lightBindGroup = this.device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [{
                    binding: 0,
                    resource: { buffer: lightBuffer }
                }]
            });

            bundleEncoder.setBindGroup(0, lightBindGroup);

            // Traverse scene and draw shadow-casting objects
            scene.traverse(object => {
                if (!object.castShadow || !object.visible || !object.geometry) {
                    return;
                }

                // Get or create transform buffer
                const transformBuffer = this.resourceManager.createBuffer(`${object.id}_transform`, {
                    size: 64,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
                });
                this.resourceManager.updateBuffer(`${object.id}_transform`, object.modelMatrix);

                const modelBindGroup = this.device.createBindGroup({
                    layout: pipeline.getBindGroupLayout(1),
                    entries: [{
                        binding: 0,
                        resource: { buffer: transformBuffer }
                    }]
                });

                bundleEncoder.setBindGroup(1, modelBindGroup);

                // Set vertex buffers
                if (object.geometry.attributes.position) {
                    const positionBuffer = this.resourceManager.createAndUploadBuffer(
                        `${object.id}_position`,
                        object.geometry.attributes.position.array,
                        GPUBufferUsage.VERTEX
                    );
                    bundleEncoder.setVertexBuffer(0, positionBuffer);
                }

                // Draw
                if (object.geometry.index) {
                    const indexBuffer = this.resourceManager.createAndUploadBuffer(
                        `${object.id}_index`,
                        object.geometry.index.array,
                        GPUBufferUsage.INDEX
                    );
                    bundleEncoder.setIndexBuffer(indexBuffer, 'uint32');
                    bundleEncoder.drawIndexed(object.geometry.index.count);
                } else {
                    bundleEncoder.draw(object.geometry.attributes.position.count);
                }
            });
        }

        // Cache the bundle
        this.shadowBundle = bundleEncoder.finish();
        
        // Execute the bundle
        passEncoder.executeBundles([this.shadowBundle]);

        this.frames++;
        if (this.frames > 5) {
            this.needsUpdate = false;
        }
    }

    /**
     * Mark the shadow pass as needing an update
     */
    markNeedsUpdate() {
        this.needsUpdate = true;
        this.frames = 0;
    }

    /**
     * Get the shadow map texture
     * @returns {GPUTexture}
     */
    getShadowMap() {
        return this.resourceManager.textures.get('shadowMap');
    }

    /**
     * Get the shadow map texture view
     * @returns {GPUTextureView}
     */
    getShadowMapView() {
        return this.getShadowMap().createView();
    }
}

export { ShadowPass };