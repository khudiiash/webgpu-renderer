import { ShaderLib } from '../shaders/ShaderLib.js';
import { ShaderChunks } from '../shaders/ShaderChunks.js';

class PipelineUtils {
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
    
    
    createShadowDepthPipeline(mesh, bindGroups) {
        //const pipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts: [bindGroups.layouts[0]] });
        const pipelineDesc = { 
            label: 'Shadow Depth Pipline',
            layout:  'auto',
            vertex: {
                module: this.device.createShaderModule({ code: ShaderChunks.vertex.vertex_shadow_depth.code }),
                buffers: [ mesh.geometry.getVertexAttributesLayout() ] 
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: '',
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
    
    createRenderPipeline(mesh, bindGroups) {
        const { vertexShader, fragmentShader } = ShaderLib.compose(mesh);
        const pipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts: bindGroups.layouts });

        const pipelineDescription = {
            layout: pipelineLayout,
            vertex: {
                module: this.device.createShaderModule({ code: vertexShader }),
                buffers: [mesh.geometry.getVertexAttributesLayout()],
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

export { PipelineUtils };