import { ShaderLib } from './shaders/ShaderLib.js';
import { ShaderChunks } from './shaders/ShaderChunks.js';

class Pipelines {
    constructor(device, renderer) {
        this.device = device;
        this.renderer = renderer;
        this.pipelines = new Map();
    }
    
    createPipelineLayout(bindGroupLayout) {
        return this.device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        });
    }
    
    
    createShadowPipeline(renderObject) {
        const pipelineDesc = { 
            label: 'Shadow Depth Pipline',
            layout:  'auto',
            vertex: {
                module: this.device.createShaderModule({ code: ShaderChunks.vertex.shadow_depth.code }),
                buffers: [ renderObject.mesh.geometry.getVertexAttributesLayout() ] 
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'front',
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth32float',
            },
        }
        this.shadowDepthPipeline = this.device.createRenderPipeline(pipelineDesc);
        return this.shadowDepthPipeline;
    }
    
    createRenderPipeline(renderObject, bindGroupLayout) {
        const { vertexShader, fragmentShader } = ShaderLib.compose(renderObject.mesh);
        const layout = this.device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        }); 

        const pipelineDescription = {
            label: `${renderObject.name} Render Pipeline`,
            layout: layout,
            vertex: {
                module: this.device.createShaderModule({ code: vertexShader }),
                buffers: [renderObject.mesh.geometry.getVertexAttributesLayout()],
            }, 
            fragment: {
                module: this.device.createShaderModule({ code: fragmentShader }),
                targets: [ { 
                    format: this.renderer.context.getCurrentTexture().format,
                    blend: {
                        color: {
                          srcFactor: 'one',
                          dstFactor: 'one-minus-src-alpha'
                        },
                        alpha: {
                          srcFactor: 'one',
                          dstFactor: 'one-minus-src-alpha'
                        },
                      },
                } ]
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'back',
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth32float',
            },
        }
        
        return this.device.createRenderPipeline(pipelineDescription);
    }
}

export { Pipelines };