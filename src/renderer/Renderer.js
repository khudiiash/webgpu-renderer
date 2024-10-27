import { DirectionalLight } from '../lights/DirectionalLight';
import { ShaderLib } from './shaders/ShaderLib';
import { UniformLib } from './shaders/UniformLib';
import { BindGroups} from './BindGroups';
import { Pipelines } from './Pipelines';
import { Textures } from './Textures';
import { Samplers } from './Samplers';
import { Buffers } from './Buffers';
import { RenderObject } from './RenderObject';
import { Events } from '../core/Events';
import { Frustum } from '../math/Frustum';
import { Matrix4 } from '../math/Matrix4';
import { PlaneGeometry } from '../geometry/PlaneGeometry';
import { MeshPhongMaterial } from '../materials/MeshPhongMaterial';
import { Mesh } from '../core/Mesh';
import { BoxGeometry } from '../geometry/BoxGeometry';
import { Vector3 } from '../math/Vector3';
import { Color } from '../math/Color';
import { CullingSystem } from './CullingSystem';

const _projScreenMatrix = new Matrix4();
     
class Renderer extends Events {
    constructor(canvas) {
        super();
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
        this.count = 0;
        this.data = new WeakMap();
        this.format = navigator.gpu.getPreferredCanvasFormat();
        this.context = this.canvas.getContext('webgpu');
        this.frames = 0;
        this.elapsed = 0;
        this._lastTime = performance.now();
        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: 'premultiplied',
        });
        this.shadowNeedsUpdate = true;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.aspect = this.width / this.height;
        this.textures = new Textures(this);
        this.samplers = new Samplers(this);

        this.createRenderPassDescriptor();
        this.bindGroups = new BindGroups(this.device, this);
        this.pipelines = new Pipelines(this.device, this);
        this.buffers = new Buffers(this.device, this);
        this.buffers.createShadowDepthBuffer(this.textures.getTexture('shadowMap'));
        
        this.cullingSystem = new CullingSystem(this);

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { inlineSize, blockSize } = entry.contentBoxSize[0];
                entry.target.width = inlineSize * Math.min(window.devicePixelRatio, 2);
                entry.target.height = blockSize * Math.min(window.devicePixelRatio, 2);
                entry.target.width = Math.max(1, Math.min(entry.target.width, this.device.limits.maxTextureDimension2D));
                entry.target.height = Math.max(1, Math.min(entry.target.height, this.device.limits.maxTextureDimension2D));
                this.width = entry.target.width;
                this.height = entry.target.height;
                this.aspect = this.width / this.height;
                this.broadcast('resize', { width: this.width, height: this.height, aspect: this.aspect });
            }
            this.textures.createDepthTexture();
            this.cullingSystem.updateDepthTexture(this.textures.getView('depth')); 
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
    
    
    createRenderPassDescriptor() {
        this.renderPassDescriptor = {
            colorAttachments: [
                {
                    view: null,
                    clearValue: [0.4, 0.5, 0.5, 1],
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
    
    createRenderObject(mesh) {
        const renderObject = new RenderObject(mesh);
        const renderBindGroupLayout = this.bindGroups.createRenderBindGroupLayout(renderObject);
        const shadowBindGroupLayout = this.bindGroups.createShadowBindGroupLayout(renderObject);
        const renderBindGroup = this.bindGroups.createRenderBindGroup(renderObject, renderBindGroupLayout);
        const shadowBindGroup = this.bindGroups.createShadowBindGroup(renderObject, shadowBindGroupLayout);
        const vertex = this.buffers.createVertexBuffer(mesh.geometry.packed);
        const index = this.buffers.createIndexBuffer(mesh.geometry.indices);
            
        renderObject.setVertexBuffer(vertex);
        renderObject.setIndexBuffer(index);

        const shadowPipeline = this.pipelines.createShadowPipeline(renderObject, shadowBindGroupLayout);
        const renderPipeline = this.pipelines.createRenderPipeline(renderObject, renderBindGroupLayout);
        renderObject.setShadowPipeline(shadowPipeline, shadowBindGroupLayout);
        renderObject.setRenderPipeline(renderPipeline, renderBindGroupLayout);
        renderObject.setRenderBindGroup(renderBindGroup);
        renderObject.setShadowBindGroup(shadowBindGroup);

        mesh.material.on('update', () => {
            renderObject.setRenderBindGroup(this.bindGroups.createRenderBindGroup(renderObject, renderBindGroupLayout));            
            renderObject.setShadowBindGroup(this.bindGroups.createShadowBindGroup(renderObject, shadowBindGroupLayout));
            renderObject.setRenderPipeline(this.pipelines.createRenderPipeline(renderObject, renderBindGroupLayout));
            renderObject.setShadowPipeline(this.pipelines.createShadowPipeline(renderObject, shadowBindGroupLayout));
        });

        this.set(mesh, renderObject);
        return renderObject;
    }
    
    drawObject(object, camera, pass, encoder) {
        if (object.isMesh) {
            const existing = this.has(object);
            const renderObject = existing ? 
                this.get(object) : 
                this.createRenderObject(object);
            
            pass.setPipeline(renderObject.render.pipeline);
            pass.setBindGroup(0, renderObject.render.bindGroup);
            pass.setVertexBuffer(0, renderObject.buffers.vertex);
            pass.setIndexBuffer(renderObject.buffers.index, object.geometry.indexFormat);

            const instanceCount = object.count;

            this.count += instanceCount;

            if (object.geometry.isIndexed) {
                object.isCulled && object.visibilityInfo ? 
                    pass.drawIndexedIndirect(object.visibilityInfo.drawCommandBuffer, 0) :
                    pass.drawIndexed(object.geometry.indices.length, instanceCount);
            } else {
                object.isCulled && object.visibilityInfo ? 
                    pass.drawIndirect(object.drawCommandBuffer, 0) :
                    pass.draw(object.geometry.positions.length / 3, instanceCount);
            }
            
        }
        
        if (object.children.length) {
            for (let i = 0; i < object.children.length; i++) {
                this.drawObject(object.children[i], camera, pass, encoder);
            }
        }
    }
    
    
    drawShadowDepth(object, pass, lights) {
        if (!lights.length) return;

        if (object.isMesh) {
            for (const light of lights) {
                const exists = this.has(object);
                const renderObject = exists ? this.get(object) : this.createRenderObject(object);

                this.buffers.write('lightProjViewMatrix', light.shadow.projectionViewMatrix.data);

                pass.setPipeline(renderObject.shadow.pipeline);
                pass.setBindGroup(0, renderObject.shadow.bindGroup);
                pass.setVertexBuffer(0, renderObject.buffers.vertex)
                pass.setIndexBuffer(renderObject.buffers.index, object.geometry.indexFormat);

                if (object.geometry.isIndexed) {
                    object.isCulled && object.visibilityInfo ? 
                        pass.drawIndexedIndirect(object.visibilityInfo.drawCommandBuffer, 0) :
                        pass.drawIndexed(object.geometry.indices.length, object.count);
                } else {
                    object.isCulled && object.visibilityInfo ?
                        pass.drawIndirect(object.visibilityInfo.drawCommandBuffer, 0) :
                        pass.draw(object.geometry.positions.length / 3, object.count);
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
        const dt = (performance.now() - this._lastTime) * 0.001;
        this.elapsed += dt;
        this._lastTime = performance.now();

        if (!this.buffers.has(scene)) {
            this.buffers.createUniformBuffer(UniformLib.scene, scene);
        }
        if (!this.buffers.has(camera)) {
            this.buffers.createUniformBuffer(UniformLib.camera, camera);
        }

        this.buffers.write('time', new Float32Array([this.elapsed]));

        const encoder = this.device.createCommandEncoder();
        this.cullingSystem.prepare(scene, this.textures.getView('depth'));
        this.cullingSystem.compute(scene, camera, encoder);
        
        this.renderPassDescriptor.colorAttachments[0].view = this.context
            .getCurrentTexture()
            .createView();
        this.renderPassDescriptor.colorAttachments[0].clearValue = scene.background.data;

        const shadowDepthPass = encoder.beginRenderPass({
            colorAttachments: [],
            depthStencilAttachment: {
                view: this.textures.getView('shadowMap'),
                depthLoadOp: 'clear',
                depthClearValue: 1.0,
                depthStoreOp: 'store',
            }
        });

        // if (this.shadowBundle) {
        //     shadowDepthPass.executeBundles([this.shadowBundle]);
        // } else {
            // const shadowPassEncoder = this.device.createRenderBundleEncoder({
            //     colorFormats: [],
            //     depthStencilFormat: 'depth32float',
            // }); 
            this.drawShadowDepth(scene, shadowDepthPass, scene.directionalLights);
            //this.shadowBundle = shadowPassEncoder.finish();
        //}
        shadowDepthPass.end();

        this.count = 0;
        const renderPass = encoder.beginRenderPass(this.renderPassDescriptor);
        this.drawObject(scene, camera, renderPass, encoder);

        renderPass.end();


        this.device.queue.submit([encoder.finish()]);
        this.frames++;
    }
}

export { Renderer };