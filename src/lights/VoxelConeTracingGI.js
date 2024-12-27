import { UniformBuffer } from '../renderer/UniformBuffer.js';
import { UniformLibGroup } from '../renderer/shaders/UniformLibGroup.js';

class VoxelConeTracingGI {
    constructor(renderer) {
        this.renderer = renderer;
        this.voxelGridSize = 16;
        this.maxRayDistance = 500.0;
        this.debugTextureSampler = this.renderer.device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear'
        });
    }

    async init() {
        this.createTextures();
        await this.createPipelines();
        await this.createUniformBuffers();
        this.createBindGroups();
    }

    createUniformBuffers() {
        this.cameraBuffer = new UniformBuffer(this.renderer.device, UniformLibGroup.camera);
        this.lightBuffer = new UniformBuffer(this.renderer.device, UniformLibGroup.light);
        this.paramsBuffer = new UniformBuffer(this.renderer.device, UniformLibGroup.params);
        this.renderer.buffers.set(this, {
            camera: this.cameraBuffer,
            light: this.lightBuffer,
            params: this.paramsBuffer
        });
        this.renderer.buffers.write('voxelGridSize', new Uint32Array([this.voxelGridSize]), this);
        this.renderer.buffers.write('maxRayDistance', new Float32Array([this.maxRayDistance]), this);
    }

    createTextures() {
        const textureDescriptor = {
            size: [this.voxelGridSize, this.voxelGridSize, this.voxelGridSize],
            format: 'rgba16float',
            dimension: '3d',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        };

        this.voxelTextureR = this.renderer.device.createTexture(textureDescriptor);
        this.voxelTextureG = this.renderer.device.createTexture(textureDescriptor);
        this.voxelTextureB = this.renderer.device.createTexture(textureDescriptor);
        this.voxelTextureA = this.renderer.device.createTexture(textureDescriptor);

        const stagingTextureDescriptor = {
            size: [this.voxelGridSize, this.voxelGridSize, this.voxelGridSize],
            format: 'rgba32float',
            dimension: '3d',
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC,
        };

        this.voxelStagingTextureR = this.renderer.device.createTexture(stagingTextureDescriptor);
        this.voxelStagingTextureG = this.renderer.device.createTexture(stagingTextureDescriptor);
        this.voxelStagingTextureB = this.renderer.device.createTexture(stagingTextureDescriptor);
        this.voxelStagingTextureA = this.renderer.device.createTexture(stagingTextureDescriptor);

        const debugTextureDescriptor = {
            size: [this.voxelGridSize, this.voxelGridSize],
            format: 'rgba32float',
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        };
        this.debugTextureR = this.renderer.device.createTexture(debugTextureDescriptor);
        this.debugTextureG = this.renderer.device.createTexture(debugTextureDescriptor);
        this.debugTextureB = this.renderer.device.createTexture(debugTextureDescriptor);
        this.debugTextureA = this.renderer.device.createTexture(debugTextureDescriptor);
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
                    storageTexture: { format: 'rgba32float', access: 'write-only' },
                },
                {
                    binding: 5,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: { format: 'rgba32float', access: 'write-only' },
                },
                {
                    binding: 6,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: { format: 'rgba32float', access: 'write-only' },
                },
                {
                    binding: 7,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: { format: 'rgba32float', access: 'write-only' },
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
            @group(0) @binding(0) var voxelTexture: texture_storage_3d<rgba32float, write>;
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
            @group(0) @binding(4) var outputTexR: texture_storage_2d<rgba32float, write>;
            @group(0) @binding(5) var outputTexG: texture_storage_2d<rgba32float, write>;
            @group(0) @binding(6) var outputTexB: texture_storage_2d<rgba32float, write>;
            @group(0) @binding(7) var outputTexA: texture_storage_2d<rgba32float, write>;
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

    createBindGroups() {
        this.voxelizeBindGroup = this.renderer.device.createBindGroup({
            layout: this.voxelizeBindGroupLayout,
            entries: [
                { binding: 0, resource: this.voxelStagingTextureR.createView() },
                { binding: 1, resource: { buffer: this.cameraBuffer.buffer } },
            ],
        });

        this.coneTraceBindGroup = this.renderer.device.createBindGroup({
            label: "b1",
            layout: this.coneTraceBindGroupLayout,
            entries: [
                { binding: 0, resource: this.voxelTextureR.createView() },
                { binding: 1, resource: this.voxelTextureG.createView() },
                { binding: 2, resource: this.voxelTextureB.createView() },
                { binding: 3, resource: this.voxelTextureA.createView() },
                { binding: 4, resource: this.debugTextureR.createView() },
                { binding: 5, resource: this.debugTextureG.createView() },
                { binding: 6, resource: this.debugTextureB.createView() },
                { binding: 7, resource: this.debugTextureA.createView() },
                { binding: 8, resource: { buffer: this.cameraBuffer.buffer } },
                { binding: 9, resource: { buffer: this.lightBuffer.buffer } },
                { binding: 10, resource: this.debugTextureSampler }
            ]
        });
    }

    async updateBuffers(camera, light) {
        const cameraMatrixData = camera.projectionViewMatrix.data;
        const lightData = [light.position.x, light.position.y, light.position.z, light.intensity];

        await this.cameraBuffer.mapAsync(GPUMapMode.WRITE);
        const cameraBufferData = new Float32Array(this.cameraBuffer.getMappedRange());
        cameraBufferData.set(cameraMatrixData);
        this.cameraBuffer.unmap();

        await this.lightBuffer.mapAsync(GPUMapMode.WRITE);
        const lightBufferData = new Float32Array(this.lightBuffer.getMappedRange());
        lightBufferData.set(lightData);
        this.lightBuffer.unmap();
    }

    async runGI(pass, camera, light) {
        const commandEncoder = this.renderer.device.createCommandEncoder();

        await this.updateBuffers(camera, light); // Call updateBuffers here

        const voxelPass = commandEncoder.beginComputePass();
        voxelPass.setPipeline(this.voxelizePipeline);
        voxelPass.setBindGroup(0, this.voxelizeBindGroup);
        voxelPass.dispatchWorkgroups(
            Math.ceil(this.voxelGridSize / 4),
            Math.ceil(this.voxelGridSize / 4),
            Math.ceil(this.voxelGridSize / 4)
        );
        voxelPass.end();

        commandEncoder.copyTextureToTexture(
            this.voxelStagingTextureR, { mipLevel: 0 },
            this.voxelTextureR, { mipLevel: 0 },
            [this.voxelGridSize, this.voxelGridSize, this.voxelGridSize]
        );
                commandEncoder.copyTextureToTexture(
            this.voxelStagingTextureG, { mipLevel: 0 },
            this.voxelTextureG, { mipLevel: 0 },
            [this.voxelGridSize, this.voxelGridSize, this.voxelGridSize]
        );
                commandEncoder.copyTextureToTexture(
            this.voxelStagingTextureB, { mipLevel: 0 },
            this.voxelTextureB, { mipLevel: 0 },
            [this.voxelGridSize, this.voxelGridSize, this.voxelGridSize]
        );
                commandEncoder.copyTextureToTexture(
            this.voxelStagingTextureA, { mipLevel: 0 },
            this.voxelTextureA, { mipLevel: 0 },
            [this.voxelGridSize, this.voxelGridSize, this.voxelGridSize]
        );

        const conePass = commandEncoder.beginComputePass();
        conePass.setPipeline(this.coneTracePipeline);
        conePass.setBindGroup(0, this.coneTraceBindGroup);
        conePass.dispatchWorkgroups(
            Math.ceil(this.voxelGridSize / 8),
            Math.ceil(this.voxelGridSize / 8)
        );
        conePass.end();

        this.renderer.device.queue.submit([commandEncoder.finish()]);
    }
}

export { VoxelConeTracingGI };