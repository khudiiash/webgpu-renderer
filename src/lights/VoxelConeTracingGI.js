import { Texture2D } from "/src/renderer/Texture2D.js?t=1735242331540";
import { UniformBuffer } from "/src/renderer/UniformBuffer.js";

class VoxelConeTracingGI {
    constructor(renderer) {
        this.renderer = renderer;
        this.voxelTexture = null;
        this.voxelGridSize = 64; // Default voxel grid size, can be adjusted
        this.maxRayDistance = 50.0; // Max distance for cone tracing (can be adjusted)
    }

    // Initialize the GI system
    init() {
        this.createVoxelTexture();
        this.createVoxelizationPipeline();
        this.createConeTracingPipeline();
        this.createUniformBuffers();
    }

    createVoxelTexture() {
        this.voxelTexture = new Texture2D(this.renderer.device, 
            this.voxelGridSize,
            this.voxelGridSize,
            'rgba32float', // Using 32-bit float RGBA for storing voxel data
            GPUTextureUsage.STORAGE | GPUTextureUsage.SAMPLED,
        );
    }

    createVoxelizationPipeline() {
        const bindGroupLayout = this.renderer.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage' }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform' }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform' }
                },
            ]
        });

        const pipelineLayout = this.renderer.device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        });

        this.voxelizationPipeline = this.renderer.device.createComputePipeline({
            layout: pipelineLayout,
            compute: {
                module: this.renderer.device.createShaderModule({
                    code: `
                        struct GridParams {
                            size: u32,
                            padding: vec3<u32>
                        }

                        struct VertexInput {
                            @location(0) position: vec3<f32>,
                            @location(1) normal: vec3<f32>
                        }

                        @group(0) @binding(0) var<storage, read_write> voxelGrid: array<vec4<f32>>;
                        @group(0) @binding(1) var<uniform> cameraParams: mat4x4<f32>;
                        @group(0) @binding(2) var<uniform> gridParams: GridParams;

                        @compute @workgroup_size(1)
                        fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
                            let gridSize = gridParams.size;
                            let voxelIdx = global_id.x + 
                                        global_id.y * gridSize + 
                                        global_id.z * gridSize * gridSize;
                            
                            let voxelPos = vec3<f32>(
                                f32(global_id.x) / f32(gridSize),
                                f32(global_id.y) / f32(gridSize),
                                f32(global_id.z) / f32(gridSize)
                            );
                            
                            voxelGrid[voxelIdx] = vec4<f32>(voxelPos.x, voxelPos.y, voxelPos.z, 1.0);
                        }
                    `
                }),
                entryPoint: 'main'
            }
        });
    }

    createConeTracingPipeline() {
        const bindGroupLayout = this.renderer.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage' }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform' }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform' }
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform' }
                },
            ]
        });

        const pipelineLayout = this.renderer.device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        });

        this.coneTracingPipeline = this.renderer.device.createComputePipeline({
            layout: pipelineLayout,
            compute: {
                module: this.renderer.device.createShaderModule({
                    code: `
                        struct GridParams {
                            size: u32,
                            padding: vec3<u32>
                        }

                        struct VertexInput {
                            @location(0) position: vec3<f32>,
                            @location(1) normal: vec3<f32>
                        }

                        @group(0) @binding(0) var<storage, read_write> voxelGrid: array<vec4<f32>>;
                        @group(0) @binding(1) var<uniform> cameraParams: mat4x4<f32>;
                        @group(0) @binding(2) var<uniform> lightParams: vec4<f32>;
                        @group(0) @binding(3) var<uniform> gridParams: GridParams;

                        @compute @workgroup_size(1)
                        fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
                            let gridSize = gridParams.size;
                            let voxelIdx = global_id.x + 
                                        global_id.y * gridSize + 
                                        global_id.z * gridSize * gridSize;
                            
                            let voxelPos = vec3<f32>(
                                f32(global_id.x) / f32(gridSize),
                                f32(global_id.y) / f32(gridSize),
                                f32(global_id.z) / f32(gridSize)
                            );
                            
                            let lightDir = normalize(lightParams.xyz - voxelPos);
                            voxelGrid[voxelIdx] = vec4<f32>(lightDir, 1.0);
                        }
                    `
                }),
                entryPoint: 'main'
            }
        });
    }

    createUniformBuffers() {
        this.cameraParamsBuffer = new UniformBuffer(this.renderer.device, 
            64, // Size for storing camera-related uniforms (mat4)
            GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        );

        this.lightParamsBuffer = new UniformBuffer(this.renderer.device, 
            16, // Size for storing light parameters (vec4)
            GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        );

        this.gridParamsBuffer = new UniformBuffer(this.renderer.device, 
            16, // 4 bytes for size + 12 bytes padding
            GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        );
    }

    updateUniformBuffers(camera, light) {
        this.cameraParamsBuffer.setData({
            projectionMatrix: camera.projectionMatrix,
            viewMatrix: camera.viewMatrix,
        });

        this.lightParamsBuffer.setData({
            position: light.position,
            intensity: light.intensity,
        });

        this.gridParamsBuffer.setData(new Uint32Array([this.voxelGridSize, 0, 0, 0]));
    }

    runGI(pass) {
        // Update uniforms if needed
        // this.updateUniformBuffers(camera, light);

        // Set up bind groups for voxelization
        const voxelizationBindGroup = this.renderer.createBindGroup({
            layout: this.voxelizationPipeline.getBindGroupLayout(),
            entries: [
                { binding: 0, resource: this.voxelTexture.getStorageTextureView() },
                { binding: 1, resource: this.cameraParamsBuffer.getBuffer() },
                { binding: 2, resource: this.gridParamsBuffer.getBuffer() },
            ],
        });

        // Run voxelization pass
        pass.setPipeline(this.voxelizationPipeline);
        pass.setBindGroup(0, voxelizationBindGroup);
        pass.dispatchWorkgroups(this.voxelGridSize, this.voxelGridSize, this.voxelGridSize);

        // Set up bind group for cone tracing
        const coneTracingBindGroup = this.renderer.createBindGroup({
            layout: this.coneTracingPipeline.getBindGroupLayout(),
            entries: [
                { binding: 0, resource: this.voxelTexture.getStorageTextureView() },
                { binding: 1, resource: this.cameraParamsBuffer.getBuffer() },
                { binding: 2, resource: this.lightParamsBuffer.getBuffer() },
                { binding: 3, resource: this.gridParamsBuffer.getBuffer() },
            ],
        });

        // Run cone tracing pass
        pass.setPipeline(this.coneTracingPipeline);
        pass.setBindGroup(0, coneTracingBindGroup);
        pass.dispatchWorkgroups(this.voxelGridSize, this.voxelGridSize, this.voxelGridSize);
    }
}

export { VoxelConeTracingGI };