import { StagingBuffer } from '../renderer/StagingBuffer.js';

class VoxelConeTracingGI {
    constructor(renderer, camera, light) {
        this.renderer = renderer;
        this.voxelGridSize = 8;
        this.maxRayDistance = 500.0;
        this.debugTextureSampler = this.renderer.device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear'
        });
        this.cameraBufferMapped = false;
        this.lightBufferMapped = false;
        this.paramsBufferMapped = false;
        this.cam = camera;
        this.lig = light;
        this.cb = null;
        this.lb = null;
    }

    async init() {
        this.createTextures();
        await this.createPipelines();
        this.createStagingBuffers();
    }

    createStagingBuffers() {
        // Use the StagingBuffers class CORRECTLY
        this.cameraBuffer = new StagingBuffer(this.renderer.device, { size: 64 }, 'cameraStaging');
        this.lightBuffer = new StagingBuffer(this.renderer.device, { size: 16 }, 'lightStaging');
        this.paramsBuffer = new StagingBuffer(this.renderer.device, { size: 8 }, 'paramsStaging');
    }

    createTextures() {
        const textureDescriptor = {
            size: [this.voxelGridSize, this.voxelGridSize, this.voxelGridSize],
            format: 'rgba16float',
            dimension: '3d',
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC,
        };

        this.voxelTextureR = this.renderer.device.createTexture(textureDescriptor);
        this.voxelTextureG = this.renderer.device.createTexture(textureDescriptor);
        this.voxelTextureB = this.renderer.device.createTexture(textureDescriptor);
        this.voxelTextureA = this.renderer.device.createTexture(textureDescriptor);

        const stagingTextureDescriptor = {
            size: [this.voxelGridSize, this.voxelGridSize, this.voxelGridSize],
            format: 'rgba16float',
            dimension: '3d',
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST,
        };

        this.voxelStagingTextureR = this.renderer.device.createTexture(stagingTextureDescriptor);
        this.voxelStagingTextureG = this.renderer.device.createTexture(stagingTextureDescriptor);
        this.voxelStagingTextureB = this.renderer.device.createTexture(stagingTextureDescriptor);
        this.voxelStagingTextureA = this.renderer.device.createTexture(stagingTextureDescriptor);

        const debugTextureDescriptor = {
            size: [this.voxelGridSize, this.voxelGridSize],
            format: 'rgba16float', // Good format for rendering
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC, // Add RENDER_ATTACHMENT
        };

        this.debugTextureR = this.renderer.device.createTexture(debugTextureDescriptor);
        this.debugTextureG = this.renderer.device.createTexture(debugTextureDescriptor);
        this.debugTextureB = this.renderer.device.createTexture(debugTextureDescriptor);
        this.debugTextureA = this.renderer.device.createTexture(debugTextureDescriptor);

        // *** CREATE THE VIEWS HERE! ***
        const viewDescriptor3D = { dimension: '3d' };
        const viewDescriptor2D = { dimension: '2d' };

        this.voxelTextureViewR = this.voxelTextureR.createView(viewDescriptor3D);
        this.voxelTextureViewG = this.voxelTextureG.createView(viewDescriptor3D);
        this.voxelTextureViewB = this.voxelTextureB.createView(viewDescriptor3D);
        this.voxelTextureViewA = this.voxelTextureA.createView(viewDescriptor3D);

        this.voxelStagingTextureViewR = this.voxelStagingTextureR.createView(viewDescriptor3D);
        this.voxelStagingTextureViewG = this.voxelStagingTextureG.createView(viewDescriptor3D);
        this.voxelStagingTextureViewB = this.voxelStagingTextureB.createView(viewDescriptor3D);
        this.voxelStagingTextureViewA = this.voxelStagingTextureA.createView(viewDescriptor3D);

        this.debugTextureViewR = this.debugTextureR.createView(viewDescriptor2D);
        this.debugTextureViewG = this.debugTextureG.createView(viewDescriptor2D);
        this.debugTextureViewB = this.debugTextureB.createView(viewDescriptor2D);
        this.debugTextureViewA = this.debugTextureA.createView(viewDescriptor2D);

    }


    createConeTraceBindGroupLayout () {
        return this.renderer.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'float', viewDimension: '3d' },
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'float', viewDimension: '3d' },
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'float', viewDimension: '3d' },
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'float', viewDimension: '3d' },
                },
                {
                    binding: 4,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: { format: 'rgba16float', access: 'write-only' },
                },
                {
                    binding: 5,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: { format: 'rgba16float', access: 'write-only' },
                },
                {
                    binding: 6,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: { format: 'rgba16float', access: 'write-only' },
                },
                {
                    binding: 7,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: { format: 'rgba16float', access: 'write-only' },
                },
                {
                    binding: 8,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform' },
                },
                {
                    binding: 9,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform' },
                },
                {
                    binding: 10,
                    visibility: GPUShaderStage.COMPUTE,
                    sampler: { type: 'filtering' },
                },
            ],
        });
    }

    async createPipelines() {
        const voxelizeShader = `
            @group(0) @binding(0) var voxelTexture: texture_storage_3d<rgba16float, write>;
            @group(0) @binding(1) var<uniform> camera: mat4x4<f32>;

            @compute @workgroup_size(4, 4, 4)
            fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
                let dims = textureDimensions(voxelTexture);
                if (global_id.x >= dims.x || global_id.y >= dims.y || global_id.z >= dims.z) {
                    return;
                }
                let voxelPos = vec3<f32>(global_id) / vec3<f32>(dims);
                let worldPos = (camera * vec4<f32>(voxelPos * 2.0 - 1.0, 1.0)).xyz;
                let encodedValue = vec4<f32>(worldPos, 1.0);
                textureStore(voxelTexture, global_id, encodedValue);
            }
        `;

        const coneTraceShader = `
            @group(0) @binding(0) var voxelTextureR: texture_3d<f32>;
            @group(0) @binding(1) var voxelTextureG: texture_3d<f32>;
            @group(0) @binding(2) var voxelTextureB: texture_3d<f32>;
            @group(0) @binding(3) var voxelTextureA: texture_3d<f32>;
            @group(0) @binding(4) var outputTexR: texture_storage_2d<rgba16float, write>;
            @group(0) @binding(5) var outputTexG: texture_storage_2d<rgba16float, write>;
            @group(0) @binding(6) var outputTexB: texture_storage_2d<rgba16float, write>;
            @group(0) @binding(7) var outputTexA: texture_storage_2d<rgba16float, write>;
            @group(0) @binding(8) var<uniform> camera: mat4x4<f32>;
            @group(0) @binding(9) var<uniform> light: vec4<f32>;
            @group(0) @binding(10) var voxelGrid_sampler: sampler;

            @compute @workgroup_size(8, 8, 1)
            fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
                let dims = textureDimensions(outputTexR);
                if (global_id.x >= dims.x || global_id.y >= dims.y) {
                    return;
                }

                let uv = vec2<f32>(global_id.xy) / vec2<f32>(dims);
                var color = vec4<f32>(0.0);

                for (var i = 0; i < 8; i++) {
                    let depth = f32(i) / 8.0;
                    let uvw = vec3<f32>(uv, depth);

                    let sampledValueR = textureSampleLevel(voxelTextureR, voxelGrid_sampler, uvw, 0.0);
                    let sampledValueG = textureSampleLevel(voxelTextureG, voxelGrid_sampler, uvw, 0.0);
                    let sampledValueB = textureSampleLevel(voxelTextureB, voxelGrid_sampler, uvw, 0.0);
                    let sampledValueA = textureSampleLevel(voxelTextureA, voxelGrid_sampler, uvw, 0.0);

                    let worldPosX = sampledValueR.r;
                    let worldPosY = sampledValueG.g;
                    let worldPosZ = sampledValueB.b;
                    let worldPosA = sampledValueA.a;

                    color += vec4<f32>(worldPosX, worldPosY, worldPosZ, worldPosA) * (1.0 - depth);
                }

                textureStore(outputTexR, global_id.xy, vec4<f32>(color.r, 0.0, 0.0, 1.0));
                textureStore(outputTexG, global_id.xy, vec4<f32>(0.0, color.g, 0.0, 1.0));
                textureStore(outputTexB, global_id.xy, vec4<f32>(0.0, 0.0, color.b, 1.0));
                textureStore(outputTexA, global_id.xy, vec4<f32>(0.0, 0.0, 0.0, color.a));
            }
        `;

        const voxelizeShaderModule = this.renderer.device.createShaderModule({ code: voxelizeShader });
        const coneTraceShaderModule = this.renderer.device.createShaderModule({ code: coneTraceShader });

        this.voxelizePipeline = await this.renderer.device.createComputePipeline({
            layout: 'auto',
            compute: { module: voxelizeShaderModule, entryPoint: 'main' }
        });

        const conePipelineLayout = this.createConeTraceBindGroupLayout();

        this.coneTracePipeline = await this.renderer.device.createComputePipeline({
            layout: this.renderer.device.createPipelineLayout({ bindGroupLayouts: [conePipelineLayout] }), // Correct way to set the layout
            compute: { module: coneTraceShaderModule, entryPoint: 'main' }
        });
    
        this.voxelizeBindGroupLayout = this.voxelizePipeline.getBindGroupLayout(0);
        this.coneTraceBindGroupLayout = this.coneTracePipeline.getBindGroupLayout(0);
    }

    createBindGroups(cb, lb) {
        this.voxelizeBindGroup = this.renderer.device.createBindGroup({
            layout: this.voxelizeBindGroupLayout,
            entries: [
                { binding: 0, resource: this.voxelStagingTextureViewR },
                { binding: 1, resource: { buffer: cb } },
            ],
        });

        this.coneTraceBindGroup = this.renderer.device.createBindGroup({
            label: "b1",
            layout: this.coneTraceBindGroupLayout,
            entries: [
                { binding: 0, resource: this.voxelTextureViewR },
                { binding: 1, resource: this.voxelTextureG.createView() },
                { binding: 2, resource: this.voxelTextureB.createView() },
                { binding: 3, resource: this.voxelTextureA.createView() },
                { binding: 4, resource: this.debugTextureViewR },
                { binding: 5, resource: this.debugTextureG.createView() },
                { binding: 6, resource: this.debugTextureB.createView() },
                { binding: 7, resource: this.debugTextureA.createView() },
                { binding: 8, resource: { buffer: cb } }, // Use the uniform buffer!
                { binding: 9, resource: { buffer: lb } }, // Use the uniform buffer!
                { binding: 10, resource: this.debugTextureSampler }
            ]
        });
    }

    async updateBuffers(camera, light) {
        const cameraMatrixData = camera.projectionViewMatrix.data;
        const lightData = [light.position.x, light.position.y, light.position.z, light.intensity];
        //const paramsData = new Float32Array([this.voxelGridSize, this.maxRayDistance]);

                await this.cameraBuffer.update(cameraMatrixData);
                await this.lightBuffer.update(lightData);
                //await this.paramsBuffer.update(paramsData);
    }


    async runGI(renderTargetView, camera, light) {

        //ONLY ONE
        if(this.cb == null) {
            this.cb = this.renderer.buffers.get('camera');
            this.lb =  this.renderer.buffers.get('lightProjViewMatrix');
            this.createBindGroups(this.cb, this.lb);
        }
        //else
        //    await this.updateBuffers(this.cb, this.lb); // Update buffers ONCE, at the beginning

        const commandEncoder = this.renderer.device.createCommandEncoder();

        commandEncoder.copyBufferToBuffer(this.cameraBuffer.getBuffer(), 0, this.cb, 0, 64);
        commandEncoder.copyBufferToBuffer(this.lightBuffer.getBuffer(), 0, this.lb, 0, 16);
        //commandEncoder.copyBufferToBuffer(this.paramsBuffer.getBuffer(), 0, this.paramsUniformBuffer, 0, 8);
  
        // Voxelization Pass
        const voxelPass = commandEncoder.beginComputePass();
        voxelPass.setPipeline(this.voxelizePipeline);
        voxelPass.setBindGroup(0, this.voxelizeBindGroup);
        voxelPass.dispatchWorkgroups(
            Math.ceil(this.voxelGridSize / 4),
            Math.ceil(this.voxelGridSize / 4),
            Math.ceil(this.voxelGridSize / 4)
        );
        voxelPass.end();
    
        // Copy Texture
            const midSlice = Math.floor(this.voxelGridSize / 2);
        commandEncoder.copyTextureToTexture(
            { texture: this.voxelStagingTextureR, origin: [0, midSlice, 0] },
            { texture: this.debugTextureR, origin: [0, 0, 0] },
            { width: this.voxelGridSize, height: midSlice, depthOrArrayLayers: 1 }
        );
    
        // Cone Tracing Pass
        const conePass = commandEncoder.beginComputePass();
        conePass.setPipeline(this.coneTracePipeline);
        conePass.setBindGroup(0, this.coneTraceBindGroup);
        conePass.dispatchWorkgroups(
            Math.ceil(this.voxelGridSize / 8),
            Math.ceil(this.voxelGridSize / 8)
        );
        conePass.end();
    
        // Render Pass
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: renderTargetView,
                    loadValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    loadOp: 'load',
                    storeOp: 'store'
                },
            ],
        });
        renderPass.end();
    
        // Submit the command buffer ONLY ONCE
        this.renderer.device.queue.submit([commandEncoder.finish()]);
    }
}

export { VoxelConeTracingGI };