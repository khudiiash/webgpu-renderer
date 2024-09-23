import { Material } from './Material.js';
import { UniformLib } from '../renderer/shaders/UniformLib.js';
import { ShaderChunks } from '../renderer/shaders/ShaderChunks.js';
import { TextureAttachment } from '../renderer/shaders/TextureAttachment.js';
import { Color } from '../math/Color.js';
import { SamplerAttachment } from '../renderer/shaders/SamplerAttachment.js';
import { UniformGroup } from '../renderer/shaders/UniformGroup.js';
import { Uniform } from '../renderer/shaders/Uniform.js';

class MeshPhongMaterial extends Material {
   static struct =  {
      color: 'vec4f',
      specularColor: 'vec4f',
      emissionColor: 'vec4f',
      emissionIntensity: 'f32',
      roughness: 'f32',
      metalness: 'f32',
      shininess: 'f32',
      useFog: 'f32',
      useLighting: 'f32',
      something1: 'f32',
      something2: 'f32',
   }
   constructor(params = {}) {
      super(params);
      this.isPhongMaterial = true;
      this.type = 'MeshPhongMaterial';

      this._diffuseMap = params.diffuseMap;
      this._normalMap = params.normalMap;
      this._emissionMap = params.emissionMap;

      this._color = params.color instanceof Color ? params.color : new Color(params.color || 0xffffff);
      this._specularColor = params.specularColor instanceof Color ? params.specularColor : new Color(params.specularColor || 0xffffff);
      this._emissionColor = params.emissionColor instanceof Color ? params.emissionColor : new Color(params.emissionColor || 0x000000);
      this._emissionIntensity = params.emissionIntensity || 0.0;
      this._shininess = params.shininess || 0;
      this._roughness = params.roughness || 0.5;
      this._metalness = params.metalness || 0.5;

      this._useFog = params.useFog !== undefined ? Number(params.useFog) : 1;
      this._useLighting = params.useLighting !== undefined ? Number(params.useLighting) : 1;
      this._something1 = params.something1 || 0;
      this._something2 = params.something2 || 0;

      this._color.onChange(() => {
         this._data.set(this._color.data, 0);
         this.needsUpdate = true;
      })
      this._specularColor.onChange(() => {
         this._data.set(this._specularColor.data, 4);
         this.needsUpdate = true;
      })
      
      this._emissionColor.onChange(() => {
         this._data.set(this._emissionColor.data, 8);
         this.needsUpdate = true;
      })
      
      
      this.uniforms = [
         UniformLib.model,
         UniformLib.camera,
         UniformLib.scene,
         new UniformGroup({
           name: 'material',
           bindGroup: 0,
           visibility: GPUShaderStage.FRAGMENT,
           isMaterial: true,
           uniforms: [
              new Uniform('material').struct('Material', MeshPhongMaterial.struct)
           ]
         })
      ];
      this.textures = [
         new TextureAttachment('shadowMap', 'texture_depth_2d'),
         new TextureAttachment('diffuseMap', 'texture_2d<f32>', this._diffuseMap),
         new TextureAttachment('normalMap', 'texture_2d<f32>', this._normalMap),
      ]

      this.samplers = [
         new SamplerAttachment('sampler2D', 'sampler'),
         new SamplerAttachment('samplerComparison', 'sampler_comparison'),
      ]

      this.chunks = {
         vertex: [ 
            ShaderChunks.vertex.position,
            ShaderChunks.vertex.world_position,
            ShaderChunks.vertex.uv,
            ShaderChunks.vertex.normal,
            ShaderChunks.vertex.view_direction,
            ShaderChunks.vertex.fog,
         ],
         fragment: [
            ShaderChunks.fragment.diffuse_map,
            ShaderChunks.fragment.shadowmap,
            ShaderChunks.fragment.light_phong,
            ShaderChunks.fragment.emission,
            ShaderChunks.fragment.fog,
         ]
      }

      this._data = new Float32Array([
         this._color.r, this._color.g, this._color.b, this._color.a,
         this._specularColor.r, this._specularColor.g, this._specularColor.b, this._specularColor.a,
         this._emissionColor.r, this._emissionColor.g, this._emissionColor.b, this._emissionColor.a,
         this._emissionIntensity,
         this._roughness,
         this._metalness,
         this._shininess,
         this._useFog,
         this._useLighting,
         this._something1,
         this._something2,
      ]);

      this.uniforms[3].set('material', this._data);
   } 
   
   get emissionColor() {
      return this._emissionColor;
   }
   
   set emissionColor(color) {
      this._emissionColor = color;
      this._data.set(color.data, 8);
      this.needsUpdate = true;
   }
   
   get emissionIntensity() {
      return this._emissionIntensity;
   }
   
   set emissionIntensity(value) {
      this._emissionIntensity = value;
      this._data[12] = value;
      this.needsUpdate = true;
   }
   
   get color() {
      return this._color;
   }
   
   set color(color) {
      this._color = color;
      this._data.set(color.data, 0);
      this.needsUpdate = true;
   }
   
   get specularColor() {
      return this._specularColor;
   }
   
   set specularColor(color) {
      this._specularColor = color;
      this._data.set(color.data, 4);
      this.needsUpdate = true;
   }
   
   get roughness() {
      return this._roughness;
   }
   
   set roughness(value) {
      this._roughness = value;
      this._data[13] = value;
      this.needsUpdate = true;
   }
   
   get metalness() {
      return this._metalness;
   }
   
   set metalness(value) {
      this._metalness = value;
      this._data[14] = value;
      this.needsUpdate = true;
   }
   
   get shininess() {
      return this._shininess;
   }
   
   set shininess(value) {
      this._shininess = value;
      this._data[15] = value;
      this.needsUpdate = true;
   }
   
   get data() {
       return this._data;
   }
}

export { MeshPhongMaterial };

