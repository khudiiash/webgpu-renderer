import { Matrix4 } from "../math/Matrix4";
import { ShaderChunks } from "./shaders/ShaderChunks";
import { Vector3 } from "../math/Vector3";

const _mat = new Matrix4();
const _vec3 = new Vector3();

class MeshVisibilityInfo {
    constructor(renderer, mesh, cullingPipeline, depthTexture, cameraBuffer) {
        const instanceCount = mesh.isInstancedMesh ? mesh.count : 1;
        
        // Instance buffer for culling input
        this.cullingInstanceBuffer = renderer.device.createBuffer({
            label: 'Culling Instance Buffer',
            size: instanceCount * 64, // mat4x4
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        

        // Use the mesh's instance buffer directly for render output
        this.visibleInstancesBuffer = renderer.buffers.getInstanceBuffer(mesh);

        // Indirect draw commands
        this.drawCommandBuffer = renderer.device.createBuffer({
            label: 'Draw Command Buffer',
            size: 5 * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });
        
        this.boundingSphereBuffer = renderer.device.createBuffer({
            label: 'Bounding Sphere Buffer',
            size: 4 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        
        const instanceMatrix = mesh.instanceMatrix || mesh.matrixWorld.data;
        const boundingSphere = mesh.geometry.boundingSphere.data;
        renderer.device.queue.writeBuffer(this.cullingInstanceBuffer, 0, instanceMatrix);
        renderer.device.queue.writeBuffer(this.boundingSphereBuffer, 0, boundingSphere);

        mesh.on('write', () => {
            renderer.device.queue.writeBuffer(this.cullingInstanceBuffer, 0, mesh.instanceMatrix || mesh.matrixWorld.data);
        })

        
        new Uint32Array(this.drawCommandBuffer.getMappedRange()).set([
            mesh.geometry.indices?.length || mesh.geometry.vertexCount,
            mesh.count,  // instanceCount - will be updated by compute shader
            0,  // firstVertex
            0,  // firstInstance
            0   // baseVertex
        ]);
        this.drawCommandBuffer.unmap();

        this.bindGroup = renderer.device.createBindGroup({
            layout: cullingPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: cameraBuffer }},
                { binding: 1, resource: { buffer: this.boundingSphereBuffer }},
                { binding: 2, resource: { buffer: this.cullingInstanceBuffer }}, // Use mesh's own culling buffer
                { binding: 3, resource: depthTexture },
                { binding: 4, resource: { buffer: this.drawCommandBuffer }},
                { binding: 5, resource: { buffer: this.visibleInstancesBuffer }},
            ]
        });

        this.instanceCount = instanceCount;
    }
}

class CullingSystem {
    renderer
    device
    frustumPipeline
    occlusionPipeline
    visiblityBuffer
    drawCommandsBuffer

    constructor(renderer) {
        this.renderer = renderer;
        this.device = renderer.device;
        this.depthTexture = null;
        this.setupPipelines();
        this.visibilityCache = new Map();
    }
    
    updateDepthTexture(depthTexture) { 
        this.depthTexture = depthTexture;
        this.visibilityCache.clear();
    }
    
    prepare(mesh, depthTexture) {
        const haveInfo = this.visibilityCache.has(mesh);
        if (haveInfo) return;

        if (mesh.isMesh && mesh.isCulled) {
            if (!this.renderer.has(mesh)) {
                this.renderer.createRenderObject(mesh);
            }
            const visInfo = new MeshVisibilityInfo(this.renderer, mesh, this.cullingPipeline, depthTexture, this.cameraBuffer);
            this.visibilityCache.set(mesh, visInfo);
            mesh.visibilityInfo = visInfo;
        }
        if (mesh.children) {
            for (const child of mesh.children) {
                this.prepare(child, depthTexture);
            }
        }
        
    }
    
    setupPipelines() {
        this.cullingPipeline = this.device.createComputePipeline({
            layout: 'auto',
            compute: {
              module: this.device.createShaderModule({ code: ShaderChunks.compute.culling.code }),
              entryPoint: 'main'
            }
        });
      
        this.setupBuffers();
    }
    
    compute(scene, camera, encoder) {
        const frustum = this.buildFrustum(camera.projectionMatrix, camera.viewMatrix, new Float32Array(6 * 4));
        this.device.queue.writeBuffer(this.cameraBuffer, 0, camera.projectionViewMatrix.data);
        this.device.queue.writeBuffer(this.cameraBuffer, 64, frustum);
        this.device.queue.writeBuffer(this.cameraBuffer, 64 + (4 * 6 * 4), camera.position.data);
    
        for (const node of scene.children) {
          this.processSceneNode(encoder, node, camera);
        }
    }
    
    processSceneNode(commandEncoder, node, camera) {
        if (node.isMesh) {
          this.processMesh(commandEncoder, node, node.worldMatrix, camera);
        }
    
        if (node.children) {
          for (const child of node.children) {
            this.processSceneNode(commandEncoder, child, camera);
          }
        }
    }
     
    
    setupBuffers() {
        // Camera buffer needs exact size alignment
        const cameraBufferSize = 16 * 4 + // viewProj matrix
                                24 * 4 + // 6 frustum planes
                                4 * 4;  // camera position + padding
        
        this.cameraBuffer = this.device.createBuffer({
            label: 'Camera Culling Buffer',
            size: cameraBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
    }
    
    buildFrustum(projection, view, frustum) {
        _mat.multiplyMatrices(projection, view);
        const mat = _mat.data;

        // Left clipping plane
        _vec3.set(mat[3] + mat[0], mat[7] + mat[4], mat[11] + mat[8]);
        let l = _vec3.length();
        frustum[0] = _vec3.x / l;
        frustum[1] = _vec3.y / l;
        frustum[2] = _vec3.z / l;
        frustum[3] = (mat[15] + mat[12]) / l;
        // Right clipping plane
        _vec3.set(mat[3] - mat[0], mat[7] - mat[4], mat[11] - mat[8]);
        l = _vec3.length();
        frustum[4] = _vec3.x / l;
        frustum[5] = _vec3.y / l;
        frustum[6] = _vec3.z / l;
        frustum[7] = (mat[15] - mat[12]) / l;
        // Top clipping plane
        _vec3.set(mat[3] - mat[1], mat[7] - mat[5], mat[11] - mat[9]);
        l = _vec3.length();
        frustum[8] = _vec3.x / l;
        frustum[9] = _vec3.y / l;
        frustum[10] = _vec3.z / l;
        frustum[11] = (mat[15] - mat[13]) / l;
        // Bottom clipping plane
        _vec3.set(mat[3] + mat[1], mat[7] + mat[5], mat[11] + mat[9]);
        l = _vec3.length();
        frustum[12] = _vec3.x / l;
        frustum[13] = _vec3.y / l;
        frustum[14] = _vec3.z / l;
        frustum[15] = (mat[15] + mat[13]) / l;
        // Near clipping plane
        _vec3.set(mat[2], mat[6], mat[10]);
        l = _vec3.length();
        frustum[16] = _vec3.x / l;
        frustum[17] = _vec3.y / l;
        frustum[18] = _vec3.z / l;
        frustum[19] = mat[14] / l;
        // Far clipping plane
        _vec3.set( mat[3] - mat[2], mat[7] - mat[6], mat[11] - mat[10]);
        l = _vec3.length();
        frustum[20] = _vec3.x / l;
        frustum[21] = _vec3.y / l;
        frustum[22] = _vec3.z / l;
        frustum[23] = (mat[15] - mat[14]) / l;
        return frustum;
    }
    
    processMesh(commandEncoder, mesh, worldMatrix, camera, depthTexture) {
        let visInfo = this.visibilityCache.get(mesh);
        if (!visInfo) {
            return;
        }
        this.device.queue.writeBuffer(visInfo.drawCommandBuffer, 4, new Uint32Array([0]));
        const pass = commandEncoder.beginComputePass();
        pass.setPipeline(this.cullingPipeline);
        pass.setBindGroup(0, visInfo.bindGroup);
        pass.dispatchWorkgroups(Math.ceil(visInfo.instanceCount / 64));
        pass.end();
    }
} 
    

export { CullingSystem }