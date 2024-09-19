import { DirectionalLight } from '../lights/DirectionalLight';
import { ShaderLib } from './shaders/ShaderLib';
import { UniformLib } from './shaders/UniformLib';
import { BindGroups} from './BindGroups';
import { Pipelines } from './Pipelines';
import { Textures } from './Textures';
import { Samplers } from './Samplers';
import { Buffers } from './Buffers';
import { RenderObject } from './RenderObject';

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
        this.textures = new Textures(this);
        this.samplers = new Samplers(this);

        this.createRenderPassDescriptor();
        this.bindGroups = new BindGroups(this.device, this);
        this.pipelines = new Pipelines(this.device, this);
        this.buffers = new Buffers(this.device, this);

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
            this.textures.createDepthTexture();
            this.createRenderPassDescriptor();
        });
        
        observer.observe(this.canvas);
        this.initialized = true;
    }
    
    createSamplers() {
        this.samplers = {
            sampler_comparison: this.device.createSampler({
                compare: 'less'
            }),
            
            sampler: this.device.createSampler({
                magFilter: 'linear',
                minFilter: 'linear',
            }),
        }
    }
    
    
    createShadowTexture() {
        this.shadowTexture = this.device.createTexture({
            size: [1024, 1024].map(i => i * 4),
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
            format: 'depth32float'
        });
        this.shadowTextureView = this.shadowTexture.createView({ label: "Shader Depth Texture" });
        this.textures.shadowMap = this.shadowTextureView;
    }
    
    createRenderPassDescriptor() {
        this.renderPassDescriptor = {
            colorAttachments: [
                {
                    view: null,
                    clearValue: [0.0, 0.05, 0.1, 1],
                    loadOp: 'clear',
                    storeOp: 'store',
                }
            ],
            depthStencilAttachment: {
                view: this.textures.getView('depth'),
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
        this.textures.depth = this.depthTextureView;
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
       

    createRenderObject(mesh) {
        const renderObject = new RenderObject(mesh);
        const renderBindGroupLayout = this.bindGroups.createRenderBindGroupLayout(renderObject);
        const vertex = this.buffers.createVertexBuffer(mesh.geometry.packed);
        const index = this.buffers.createIndexBuffer(mesh.geometry.indices);
        const modelMatrixBuffer = this.buffers.createUniformBuffer(UniformLib.model, mesh.matrixWorld.data);
        renderObject.setVertexBuffer(vertex);
        renderObject.setIndexBuffer(index);
        const shadowPipeline = this.pipelines.createShadowPipeline(renderObject);
        const renderPipeline = this.pipelines.createRenderPipeline(renderObject, renderBindGroupLayout);
        renderObject.setShadowPipeline(shadowPipeline);
        renderObject.setRenderPipeline(renderPipeline);
        const renderBindGroup = this.bindGroups.createRenderBindGroup(renderObject, renderBindGroupLayout);
        const shadowBindGroup = this.bindGroups.createShadowBindGroup(modelMatrixBuffer, shadowPipeline.getBindGroupLayout(0));
        renderObject.setRenderBindGroup(renderBindGroup);
        renderObject.setShadowBindGroup(shadowBindGroup);

        this.set(mesh, renderObject);
        return renderObject;
    }
    
    drawObject(object, camera, pass, lights) {
        if (object.isMesh) {
            const existing = this.has(object);
            const renderObject = existing ? 
                this.get(object) : 
                this.createRenderObject(object);
            

            if (object.matrixWorld.needsUpdate) {
                this.device.queue.writeBuffer(renderObject.buffers.model, 0, object.matrixWorld.data);
                object.matrixWorld.needsUpdate = false;
            }

            this.device.queue.writeBuffer(renderObject.buffers.index, 0, object.geometry.indices);
            if (object.name === 'Cube') {
                console.log(object.geometry.indices);                
            }

            pass.setPipeline(renderObject.render.pipeline);
            pass.setBindGroup(0, renderObject.render.bindGroup);
            pass.setVertexBuffer(0, renderObject.buffers.vertex);
            pass.setIndexBuffer(renderObject.buffers.index, 'uint16');

            if (object.geometry.isIndexed) {
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
    
    
    drawShadowDepth(object, pass, lights) {
        if (!lights.length) return;

        if (object.isMesh) {
            for (const light of lights) {
                //light.shadow.updateMatrices(light, this.aspect);
                const exists = this.has(object);
                const renderObject = exists ? this.get(object) : this.createRenderObject(object);

                if (object.matrixWorld.needsUpdate) {
                    this.device.queue.writeBuffer(renderObject.buffers.model, 0, object.matrixWorld.data);
                    //this.device.queue.writeBuffer(renderObject.buffers.mvp, 0, object.matrixWorld.data);
                    //object.matrixWorld.needsUpdate = false;
                }
                //if (light.matrixWorld.needsUpdate || light.shadow.camera.projectionViewMatrix.needsUpdate) {
                    this.device.queue.writeBuffer(this.buffers.get('lightProjViewMatrix'), 0, light.shadow.projectionViewMatrix.data);
                    //this.device.queue.writeBuffer(renderObject.buffers.lights, 0, light.data);
                    //light.matrixWorld.needsUpdate = false;
                //}

                pass.setPipeline(renderObject.shadow.pipeline);
                pass.setBindGroup(0, renderObject.shadow.bindGroup);
                pass.setVertexBuffer(0, renderObject.buffers.vertex)
                pass.setIndexBuffer(renderObject.buffers.index, object.geometry.indexFormat);

                if (object.geometry.isIndexed) {
                    pass.drawIndexed(object.geometry.indices.length);
                } else {
                    pass.draw(object.geometry.vertexCount);
                }
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
        if (!this.buffers.has('camera')) {
            this.buffers.createUniformBuffer(UniformLib.camera, camera.data);
        }
        if (!this.buffers.has('scene')) {
            this.buffers.createUniformBuffer(UniformLib.scene, scene.data);
        }
        if (camera.viewMatrix.needsUpdate) {
            this.device.queue.writeBuffer(this.buffers.get('camera'), 0, camera.data);
            camera.viewMatrix.needsUpdate = false;
        }
        if (camera.projectionMatrix.needsUpdate) {
            this.device.queue.writeBuffer(this.buffers.get('camera'), 0, camera.data);
            camera.projectionMatrix.needsUpdate = false;
        }
        if (scene.needsUpdate) {
            this.device.queue.writeBuffer(this.buffers.get('scene'), 0, scene.data);
            scene.needsUpdate = false;
        }

        const encoder = this.device.createCommandEncoder();
        if (this.aspect !== camera.aspect) {
            camera.aspect = this.aspect;
            camera.updateProjectionMatrix();
            this.device.queue.writeBuffer(this.buffers.get('camera'), 0, camera.data);
        }
        
        this.renderPassDescriptor.colorAttachments[0].view = this.context
            .getCurrentTexture()
            .createView();

        const shadowDepthPass = encoder.beginRenderPass({
            colorAttachments: [],
            depthStencilAttachment: {
                view: this.textures.getView('shadowMap'),
                depthLoadOp: 'clear',
                depthClearValue: 1.0,
                depthStoreOp: 'store',
            }
        });
        this.drawShadowDepth(scene, shadowDepthPass, scene.directionalLights);
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