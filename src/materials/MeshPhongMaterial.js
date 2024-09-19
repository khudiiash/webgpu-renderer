import { Material } from './Material.js';
import { UniformLib } from '../renderer/shaders/UniformLib.js';
import { ShaderChunks } from '../renderer/shaders/ShaderChunks.js';
import { TextureAttachment } from '../renderer/shaders/TextureAttachment.js';
import { Color } from '../math/Color.js';
import { SamplerAttachment } from '../renderer/shaders/SamplerAttachment.js';

class MeshPhongMaterial extends Material {
   constructor(params) {
      super(params);
      this.isPhongMaterial = true;
      this.color = params.color instanceof Color ? params.color : new Color(params.color || 0xffffff);
      this.type = 'MeshPhongMaterial';
      this.diffuseMap = params.diffuseMap; 

      this.uniforms = [
         UniformLib.model,
         UniformLib.camera,
         UniformLib.scene,
      ]
      this.textures = [
         new TextureAttachment('shadowMap', 'texture_depth_2d'),
      ]

      if (this.diffuseMap) {
         this.textures.push(new TextureAttachment('diffuseMap', 'texture_2d<f32>', this.diffuseMap));
      }

      if (this.normalMap) {
         this.textures.push(new TextureAttachment('normalMap', 'texture_2d<f32>', this.normalMap));
      }
      
      this.samplers = [
         new SamplerAttachment('sampler2D', 'sampler'),
         new SamplerAttachment('samplerComparison', 'sampler_comparison'),
      ]

      this.chunks = {
         vertex: [ 
            ShaderChunks.vertex.uv,
            ShaderChunks.vertex.normal,
            ShaderChunks.vertex.world_position,
            ShaderChunks.vertex.view_direction,
            ShaderChunks.vertex.fog,
         ],
         fragment: [
            ShaderChunks.fragment.shadowmap,
            ShaderChunks.fragment.light_phong,
            ShaderChunks.fragment.fog,
         ]
      }

      if (this.diffuseMap) {
         this.chunks.fragment.unshift(ShaderChunks.fragment.diffuse_map);
      }
   } 
}

export { MeshPhongMaterial };

