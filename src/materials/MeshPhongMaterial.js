import { Material } from './Material.js';
import { UniformLib } from '../renderer/shaders/UniformLib.js';
import { ShaderChunks } from '../renderer/shaders/ShaderChunks.js';
import { TextureAttachment } from '../renderer/shaders/TextureAttachment.js';

class MeshPhongMaterial extends Material {
   constructor(params) {
      super(params);
      this.isPhongMaterial = true;
      this.type = 'MeshPhongMaterial';
      this.diffuseMap = params.diffuseMap; 

      this.uniforms = [
         UniformLib.generic.setUniform('color', this.color),
         UniformLib.lights,
         UniformLib.fog,
      ]
      this.textures = [
         new TextureAttachment('shadowMap', 'texture_depth_2d', { sampleType : 'depth' }, {}),
         new TextureAttachment('diffuseMap', 'texture_2d<f32>', { }, { minFilter: 'linear' }, this.diffuseMap ),
      ]
      this.samplers = [
         new TextureAttachment('shadowSampler', 'sampler_comparison', { type: 'comparison' }, { compare: 'less' } ),
         new TextureAttachment('diffuseSampler', 'sampler', { type: 'filtering' }, { minFilter: 'linear' } )
      ]
      this.chunks = {
         vertex: [ 
            ShaderChunks.vertex.vertex_uv,
            ShaderChunks.vertex.vertex_normal,
            ShaderChunks.vertex.vertex_world_position,
            ShaderChunks.vertex.vertex_view_direction,
            ShaderChunks.vertex.vertex_fog,
            ShaderChunks.vertex.vertex_shadowmap,
         ],
         fragment: [
            ShaderChunks.fragment.fragment_diffuse_map,
            ShaderChunks.fragment.fragment_shadowmap,
            ShaderChunks.fragment.fragment_light_phong,
            ShaderChunks.fragment.fragment_fog,
         ]
      }
   } 
}

export { MeshPhongMaterial };

