import { DirectionalLight } from '../lights/DirectionalLight';
import { ShaderLib } from './shaders/ShaderLib';
import { UniformLib } from './shaders/UniformLib';
import { BindingUtils, PipelineUtils } from './utils';

class Renderer {
    constructor(canvas) {
        if (canvas) {
            this.canvas = canvas;
        } else {
            this.canvas = document.createElement('canvas');
            document.body.appendChild(this.canvas); 
        }
    }
    
    async init() {
        if (!navigator.gpu) {
            console.error('WebGPU is not supported on this device');
            return;
        }
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            console.error('WebGPU adapter not found');
            return;
        }
        this.device = await adapter.requestDevice();
        if (!this.device) {
            console.error('WebGPU device not found');
            return;
        }
        this.data = new WeakMap();
        this.format = navigator.gpu.getPreferredCanvasFormat();
        this.context = this.canvas.getContext('webgpu');
        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: 'premultiplied',
        });
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.aspect = this.width / this.height;
        this.createShadowTexture();
        this.createDepthTexture();
        this.createRenderPassDescriptor();
        this.createDefaultTexture();
        this.bindingUtils = new BindingUtils(this.device, this);
        this.pipelineUtils = new PipelineUtils(this.device, this);

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { inlineSize, blockSize } = entry.contentBoxSize[0];
                entry.target.width = inlineSize * window.devicePixelRatio;
                entry.target.height = blockSize * window.devicePixelRatio;
                entry.target.width = Math.max(1, Math.min(entry.target.width, this.device.limits.maxTextureDimension2D));
                entry.target.height = Math.max(1, Math.min(entry.target.height, this.device.limits.maxTextureDimension2D));
                this.width = entry.target.width;
                this.height = entry.target.height;
                this.aspect = this.width / this.height;
            }
            this.createDepthTexture();
            this.createRenderPassDescriptor();
        });
        
        observer.observe(this.canvas);
        this.initialized = true;
    }
    
    createShadowTexture() {
        this.shadowTexture = this.device.createTexture({
            size: [1024, 1024].map(i => i * 4),
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
            format: 'depth32float'
        });
        this.shadowTextureView = this.shadowTexture.createView({ label: "Shader Depth Texture" });
    }
    
    createRenderPassDescriptor() {
        this.renderPassDescriptor = {
            colorAttachments: [
                {
                    view: null,
                    clearValue: [0.4, 0.4, 0.7, 1],
                    loadOp: 'clear',
                    storeOp: 'store',
                }
            ],
            depthStencilAttachment: {
                view: this.depthTextureView,
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            }
        }; 
    }
    
    createDepthTexture() {
        if (this.depthTexture) {
            this.depthTexture.destroy();
        }
        this.depthTexture = this.device.createTexture({
            size: [this.width, this.height],
            format: 'depth32float',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.depthTextureView = this.depthTexture.createView({ label: 'Depth Texture View' });
    }
    
    get(object) {
        let map = this.data.get(object);
        if (map === undefined) {
            map = {};
            this.data.set(object, map);
        }
        return map;
    }
    
    set(object, value) {
        this.data.set(object, value);
    }
    
    has(object) {
        return this.data.has(object);
    }
    
    delete(object) {
        this.data.delete(object);
    }
    
    
    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
    }
    
    
    createRenderPipelineLayout(bindGroupLayout) {
        return this.device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        });
    }
       
    createMeshBuffers(mesh) {
        const vertexBuffer = this.device.createBuffer({
            size: mesh.geometry.vertexBufferSize,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
        const indexBuffer = this.device.createBuffer({
            size: mesh.geometry.indices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
        });
        const lightBuffer = this.device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        const modelMatrixBuffer = this.device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.device.queue.writeBuffer(vertexBuffer, 0, mesh.geometry.packed);
        try {
            this.device.queue.writeBuffer(indexBuffer, 0, mesh.geometry.indices);
            mesh.isIndexed = true;
        } catch(e) {
            mesh.isIndexed = false;
        }

        return { vertexBuffer, indexBuffer, lightBuffer, modelMatrixBuffer };
    }
    

    createBindGroups(object, buffers) {
        const objectBindGroupLayout = this.bindingUtils.getObjectBindGroupLayout(object, buffers);
        const materialBindGroupLayout = this.bindingUtils.createMaterialBindGroupLayout(object, '');
        const objectBindGroup = this.bindingUtils.createObjectBindGroup(object, objectBindGroupLayout, buffers);
        const materialBindGroup = this.bindingUtils.createMaterialBindGroup(object, materialBindGroupLayout, buffers);
        const layouts = [objectBindGroupLayout, materialBindGroupLayout];
        const bindGroups = [objectBindGroup, materialBindGroup];

        return { layouts, bindGroups };
    }
    
    
    createRenderObject(object) {
        const renderObject = {};
        const buffers = this.createMeshBuffers(object);
        const bindGroups = this.createBindGroups(object, buffers);
        const shadowDepthPipeline = this.pipelineUtils.createShadowDepthPipeline(object, bindGroups);
        const shadowBindGroup = this.bindingUtils.createShadowBindGroup(shadowDepthPipeline, buffers);
        const renderPipeline = this.pipelineUtils.createRenderPipeline(object, bindGroups);
        renderObject.shadowDepthPipeline = shadowDepthPipeline;
        renderObject.shadowBindGroup = shadowBindGroup;
        renderObject.renderPipeline = renderPipeline;
        renderObject.bindGroups = bindGroups;
        renderObject.buffers = buffers;
        this.set(object, renderObject);
        return renderObject;
    }
    
    drawObject(object, camera, pass, lights) {
        if (object.isMesh) {
            const existing = this.has(object);
            const renderObject = existing ? 
                this.get(object) : 
                this.createRenderObject(object);

            if (object.matrixWorld.needsUpdate) {
                this.device.queue.writeBuffer(renderObject.buffers.mvp, 0, object.matrixWorld.data);
                object.matrixWorld.needsUpdate = false;
            }
            //if (camera.viewMatrix.needsUpdate) {
                this.device.queue.writeBuffer(renderObject.buffers.mvp, 64, camera.viewMatrix.data);
                camera.viewMatrix.needsUpdate = false;
            //}
            //if (camera.projectionMatrix.needsUpdate) {
                this.device.queue.writeBuffer(renderObject.buffers.mvp, 128, camera.projectionMatrix.data);
                camera.projectionMatrix.needsUpdate = false;
            //}

            if (renderObject.buffers.lights) {
                for (const light of lights) {
                    if (light.isDirectionalLight) {
                        this.device.queue.writeBuffer(renderObject.buffers.lights, 16, light.data);
                        light.matrixWorld.needsUpdate = false;
                    }
                }
            }

            pass.setPipeline(renderObject.renderPipeline);
            for (let i = 0; i < renderObject.bindGroups.bindGroups.length; i++) {
                pass.setBindGroup(i, renderObject.bindGroups.bindGroups[i]);
            }
            pass.setVertexBuffer(0, renderObject.buffers.vertexBuffer);
            pass.setIndexBuffer(renderObject.buffers.indexBuffer, 'uint16');
            if (object.isIndexed) {
                pass.drawIndexed(object.geometry.indices.length);
            } else {
                pass.draw(object.geometry.vertexCount);
            }
            
        }
        
        if (object.children.length) {
            for (let i = 0; i < object.children.length; i++) {
                this.drawObject(object.children[i], camera, pass, lights);
            }
        }
    }
    
    createDefaultTexture() {
        const texture = this.device.createTexture({
            size: [1, 1],
            format: this.format,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
            label: 'Default Texture'
        });
        this.defaultTexture = texture;
        this.defaultTextureView = texture.createView();
        return texture;
    }
    
    drawShadowDepth(object, pass, lights) {
        if (!lights.length) return;
        const light = lights[0];
        light.shadow.updateMatrices(light, this.aspect);

        if (object.isMesh) {
            const exists = this.has(object);
            const renderObject = exists ? this.get(object) : this.createRenderObject(object);

            if (object.matrixWorld.needsUpdate) {
                this.device.queue.writeBuffer(renderObject.buffers.modelMatrixBuffer, 0, object.matrixWorld.data);
                //this.device.queue.writeBuffer(renderObject.buffers.mvp, 0, object.matrixWorld.data);
                //object.matrixWorld.needsUpdate = false;
            }
            if (light.matrixWorld.needsUpdate || light.shadow.camera.projectionMatrix.needsUpdate) {
                this.device.queue.writeBuffer(renderObject.buffers.lightBuffer, 0, light.shadow.projectionViewMatrix.data);
                //this.device.queue.writeBuffer(renderObject.buffers.lights, 0, light.data);
                //light.matrixWorld.needsUpdate = false;
            }

            pass.setPipeline(renderObject.shadowDepthPipeline);
            pass.setBindGroup(0, renderObject.shadowBindGroup);
            pass.setVertexBuffer(0, renderObject.buffers.vertexBuffer)
            pass.setIndexBuffer(renderObject.buffers.indexBuffer, 'uint16')
            if (object.isIndexed) {
                pass.drawIndexed(object.geometry.indices.length);
            } else {
                pass.draw(object.geometry.vertexCount);
            }
        }

        if (object.children.length) {
            for (const child of object.children) {
                this.drawShadowDepth(child, pass, lights);
            }
        }
    }
    
    render(scene, camera) {
        if ( scene.matrixWorldAutoUpdate === true ) scene.updateMatrixWorld();
        camera.updateViewMatrix();

        const encoder = this.device.createCommandEncoder();
        if (this.aspect !== camera.aspect) {
            camera.aspect = this.aspect;
            camera.updateProjectionMatrix();
        }
        
        this.renderPassDescriptor.colorAttachments[0].view = this.context
            .getCurrentTexture()
            .createView();

        const shadowDepthPass = encoder.beginRenderPass({
            colorAttachments: [],
            depthStencilAttachment: {
                view: this.shadowTextureView,
                depthLoadOp: 'clear',
                depthClearValue: 1.0,
                depthStoreOp: 'store',
            }
        });
        this.drawShadowDepth(scene, shadowDepthPass, scene.lights);
        shadowDepthPass.end();

        const renderPass = encoder.beginRenderPass(this.renderPassDescriptor);
        this.drawObject(scene, camera, renderPass, scene.lights);
        renderPass.end();

        this.device.queue.submit([encoder.finish()]);

        camera.viewMatrix.needsUpdate = false;
        camera.projectionMatrix.needsUpdate = false;
    }
}

export { Renderer };