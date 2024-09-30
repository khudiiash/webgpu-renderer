import { ShaderLib } from './shaders/ShaderLib.js';
import { ShaderChunks } from './shaders/ShaderChunks.js';

class Pipelines {
    constructor(device, renderer) {
        this.device = device;
        this.renderer = renderer;
        this.pipelines = new Map();
    }
    
    
    createShadowPipeline(renderObject, bindGroupLayout) {
        const code = renderObject.mesh.isInstancedMesh ? 
            ShaderChunks.vertex.shadow_depth_instanced.code :
            ShaderChunks.vertex.shadow_depth.code;

        const pipelineDesc = { 
            label: 'Shadow Depth Pipline',
            layout:  this.device.createPipelineLayout({
                bindGroupLayouts: [bindGroupLayout]
            }),
            vertex: {
                module: this.device.createShaderModule({ code }),
                buffers: [ renderObject.mesh.geometry.getVertexAttributesLayout() ] 
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: renderObject.mesh.material.cullFace,
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth32float',
            },
        }
        if (renderObject.mesh.material.diffuseMap) {
            const fragmentShader = ShaderChunks.fragment.shadow_depth.code;
            pipelineDesc.fragment = {
                module: this.device.createShaderModule({ code: fragmentShader }),
                targets: []
            }
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
                module: this.device.createShaderModule({ label: `${renderObject.name} Vertex Module`, code: vertexShader}),
                buffers: [renderObject.mesh.geometry.getVertexAttributesLayout()],
            }, 
            fragment: {
                module: this.device.createShaderModule({ label: `${renderObject.name} Fragment Module`, code: fragmentShader }),
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
                cullMode: renderObject.mesh.material.cullFace,
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