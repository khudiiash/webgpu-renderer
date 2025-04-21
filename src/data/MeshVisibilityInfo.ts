import { Mesh } from "@/core/Mesh";
import { ResourceManager } from "@/engine";

export class MeshVisibilityInfo {
    visibleInstancesBuffer: GPUBuffer;
    cullingInstanceBuffer: GPUBuffer;
    visibilityBuffer: GPUBuffer;
    drawCommandBuffer: GPUBuffer;
    instanceCount: number;
    instanceIndicesBuffer: GPUBuffer;

    constructor(device: GPUDevice, mesh: Mesh) {
        const instanceCount = mesh.count;
        const resources = ResourceManager.getInstance();

        // Buffer for visibility flags
        this.visibilityBuffer = device.createBuffer({
            size: instanceCount * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });

        // Instance buffer for culling input
        this.cullingInstanceBuffer = device.createBuffer({
            label: 'Culling Instance Buffer',
            size: instanceCount * 64, // mat4x4
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });

        device.queue.writeBuffer(this.cullingInstanceBuffer, 0, mesh.instanceMatrices);

        // Use the mesh's instance buffer directly for render output
        this.visibleInstancesBuffer = device.createBuffer({
            label: 'Visible Instances Buffer',
            size: instanceCount * 64, // mat4x4
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
        });

        device.queue.writeBuffer(this.visibleInstancesBuffer, 0, mesh.instanceMatrices);


        this.instanceIndicesBuffer = device.createBuffer({
            label: 'Instance Indices Buffer',
            size: instanceCount * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
        });

        // Indirect draw commands
        this.drawCommandBuffer = device.createBuffer({
            label: 'Draw Command Buffer',
            size: 5 * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });

        new Uint32Array(this.drawCommandBuffer.getMappedRange()).set([
            mesh.geometry.indices?.data.length || mesh.geometry.vertexCount,
            0,  // instanceCount - will be updated by compute shader
            0,  // firstVertex
            0,  // firstInstance
            0   // baseVertex
        ]);
        this.drawCommandBuffer.unmap();

        this.instanceCount = instanceCount;
    }
}
