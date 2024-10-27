const generateMips = (() => {
    let sampler;
    let module;
    const pipelineByFormat = {};
 
    return function generateMips(device, texture) {
      if (!module) {
        module = device.createShaderModule({
          label: 'textured quad shaders for mip level generation',
          code: `
            struct VSOutput {
              @builtin(position) position: vec4f,
              @location(0) texcoord: vec2f,
            };
 
            @vertex fn vs(
              @builtin(vertex_index) vertexIndex : u32
            ) -> VSOutput {
              let pos = array(
                // 1st triangle
                vec2f( 0.0,  0.0),  // center
                vec2f( 1.0,  0.0),  // right, center
                vec2f( 0.0,  1.0),  // center, top
 
                // 2nd triangle
                vec2f( 0.0,  1.0),  // center, top
                vec2f( 1.0,  0.0),  // right, center
                vec2f( 1.0,  1.0),  // right, top
              );
 
              var vsOutput: VSOutput;
              let xy = pos[vertexIndex];
              vsOutput.position = vec4f(xy * 2.0 - 1.0, 0.0, 1.0);
              vsOutput.texcoord = vec2f(xy.x, 1.0 - xy.y);
              return vsOutput;
            }
 
            @group(0) @binding(0) var ourSampler: sampler;
            @group(0) @binding(1) var ourTexture: texture_2d<f32>;
 
            @fragment fn fs(fsInput: VSOutput) -> @location(0) vec4f {
              return textureSample(ourTexture, ourSampler, fsInput.texcoord);
            }
          `,
        });
 
        sampler = device.createSampler({
          minFilter: 'linear',
          magFilter: 'linear',
          addressModeU: 'repeat',
          
        });
      }
 
      if (!pipelineByFormat[texture.format]) {
        pipelineByFormat[texture.format] = device.createRenderPipeline({
          label: 'mip level generator pipeline',
          layout: 'auto',
          vertex: {
            module,
          },
          fragment: {
            module,
            targets: [{ format: texture.format }],
          },
        });
      }
      const pipeline = pipelineByFormat[texture.format];
 
      const encoder = device.createCommandEncoder({
        label: 'mip gen encoder',
      });
 
      let width = texture.width;
      let height = texture.height;
      let baseMipLevel = 0;
      while (width > 1 || height > 1) {
        width = Math.max(1, width / 2 | 0);
        height = Math.max(1, height / 2 | 0);
 
        const bindGroup = device.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: sampler },
            { binding: 1, resource: texture.createView({baseMipLevel, mipLevelCount: 1}) },
          ],
        });
 
        ++baseMipLevel;
 
        const renderPassDescriptor = {
          label: 'our basic canvas renderPass',
          colorAttachments: [
            {
              view: texture.createView({baseMipLevel, mipLevelCount: 1}),
              loadOp: 'clear',
              storeOp: 'store',
            },
          ],
        };
 
        const pass = encoder.beginRenderPass(renderPassDescriptor);
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.draw(6);  // call our vertex shader 6 times
        pass.end();
      }
 
      const commandBuffer = encoder.finish();
      device.queue.submit([commandBuffer]);
    };
  })();

class TextureLoader {
    constructor(renderer) {
        this.renderer = renderer;
        this.device = renderer.device;
    }
    
    async getBitmap(url) {
        const res = await fetch(url);
        const blob = await res.blob();
        return await createImageBitmap(blob, { colorSpaceConversion: 'none' });
    }
    
    async load(url, options = { rotateY: false }) {
        const source = await this.getBitmap(url);
        return this.createTexture(source, { mips: true, url });
    }
  
    async loadFromBlob(blob) {
      const source = await createImageBitmap(blob, { colorSpaceConversion: 'none' });
      return this.createTexture(source, { mips: true });
    }
    
    numMipLevels(...sizes) {
        const maxSize = Math.max(...sizes);
        return 1 + Math.log2(maxSize) | 0;
    }
    
    generateMips = (texture) => {
        let pipeline;
        let sampler;

        return function generateMips() {
           if (!pipeline) {
                const module = this.device.createShaderModule({
                    label: 'texture quad shaders for mip level',
                    code: `
                        struct VertexOutput {
                            @builtin position : vec4f,
                            @location(0) uv : vec2f,
                        }
                        
                        @vertex
                        fn vert(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
                            var pos = array<vec2f, 6>(
                                vec2<f32>(-1.0, 1.0),
                                vec2<f32>(1.0, -1.0),
                                vec2<f32>(-1.0, -1.0),
                                vec2<f32>(-1.0, 1.0),
                                vec2<f32>(1.0, 1.0),
                                vec2<f32>(1.0, -1.0)
                            );
                            
                            var output: VertexOutput;
                            let xy = pos[vertexIndex];
                            output.position = vec4f(xy, 0.0, 1.0);
                            output.uv = (xy.x, 1.0 - xy.y);
                            return output;
                        }
                        
                        @group @binding(0) var sampler2D: sampler;
                        @group @binding(1) var texture: texture_2d<f32>;
                        @fragment
                        fn frag(input: VertexOutput) -> vec4<f32> {
                            return textureSample(texture, sampler2D, input.uv);
                        }
                    `
                });
                pipeline = this.device.createRenderPipeline({
                    label: 'mip level generator pipeline',
                    layout: 'auto',
                    vertex: {
                        module,
                    },
                    fragment: {
                        module,
                        targets: [{ format: texture.format }],
                    }
                });
               
                sampler = this.device.createSampler({
                    minFilter: 'linear',
                });
            } 
            
            const encoder = this.device.createCommandEncoder();
            let width = texture.width;
            let height = texture.height;
            let baseMipLevel = 0;
            
            while (width > 1 || height > 1) {
                width = Math.max(1, width / 2 | 0);
                height = Math.max(1, height / 2 | 0);
                
                const bindGroup = this.device.createBindGroup({
                    layout: pipeline.getBindGroupLayout(0),
                    entries: [
                        { binding: 0, resource: sampler },
                        { binding: 1, resource: texture.createView({ baseMipLevel, mipLevelCount: 1 }) },
                    ], 
                });
                
                baseMipLevel++;
                
                const renderPassDescriptor = {
                    label: 'mip level render pass',
                    colorAttachments: [
                        {
                            view: texture.createView({ baseMipLevel, mipLevelCount: 1 }),
                            clearValue: [0, 0, 0, 1],
                            loadOp: 'clear',
                            storeOp: 'store',
                        }
                    ],
                };
                
                const pass = encoder.beginRenderPass(renderPassDescriptor);
                pass.setPipeline(pipeline);
                pass.setBindGroup(0, bindGroup);    
                pass.draw(6);
                pass.end();
            }
            
            const commandBuffer = encoder.finish();
            this.device.queue.submit([commandBuffer]);
        }
    }
    
    createTexture(source, options = {}) {
        const texture = this.device.createTexture({
            format: 'rgba8unorm',
            size: [source.width, source.height],
            mipLevelCount: options.mips ? this.numMipLevels(source.width, source.height) : 1,
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });

        this.device.queue.copyExternalImageToTexture(
            { source: source },
            { texture },
            [source.width, source.height]
        );
        
        if (texture.mipLevelCount > 1) {
            generateMips(this.device, texture);
        }
      
        return texture;
    }
}

export { TextureLoader };