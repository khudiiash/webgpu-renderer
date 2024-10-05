import { Material } from './Material.js';
import { UniformLib } from '../renderer/shaders/UniformLib.js';
import { ShaderChunks } from '../renderer/shaders/ShaderChunks.js';
import { TextureAttachment } from '../renderer/shaders/TextureAttachment.js';
import { Color } from '../math/Color.js';
import { SamplerAttachment } from '../renderer/shaders/SamplerAttachment.js';
import { UniformGroup } from '../renderer/shaders/UniformGroup.js';
import { Uniform } from '../renderer/shaders/Uniform.js';
import { Vector3 } from '../math/Vector3.js';
import { Utils } from '../renderer/utils/Utils.js';
import { TYPE_BYTE_SIZE, TYPE_COUNT, USE } from '../renderer/constants';

class MeshPhongMaterial extends Material {
   static struct =  {
      color: 'vec4f',

      specularColor: 'vec4f',

      emissionColor: 'vec4f',

      windDirection: 'vec4f',

      emissionIntensity: 'f32',
      ambientIntensity: 'f32',
      shininess: 'f32',
      alpha: 'f32',

      useFog: 'f32',
      useLighting: 'f32',
      useWind: 'f32',
      windStrength: 'f32',
      windSpeed: 'f32',
      windHeight: 'f32',
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

      this._useFog = params.useFog !== undefined ? Number(params.useFog) : 1;
      this._useLighting = params.useLighting !== undefined ? Number(params.useLighting) : 1;
      this._useWind = params.useWind || 0;
      this._ambientIntensity = params.ambientIntensity || 1;
      this._alpha = params.alpha || 1;
      this._windStrength = params.windStrength || 15;
      this._windDirection = params.windDirection || new Vector3(1, 0, 0, 0);
      this._windSpeed = params.windSpeed || 0.5;
      this._windHeight = params.windHeight || 20;

      this._color.onChange(() => {
         this._data.set(this._color.data, 0);
      })
      this._specularColor.onChange(() => {
         this._data.set(this._specularColor.data, 4);
      })
      
      this._emissionColor.onChange(() => {
         this._data.set(this._emissionColor.data, 8);
      })
      
      
      this.uniforms = [
         UniformLib.model,
         UniformLib.camera,
         UniformLib.scene,
         UniformLib.time,
         UniformLib.lightProjViewMatrix,

         new UniformGroup({
           name: 'material',
           bindGroup: 0,
           visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
           isMaterial: true,
           uniforms: [
              new Uniform('material').struct('Material', MeshPhongMaterial.struct)
           ]
         })
      ];
      this.textures = [
         new TextureAttachment('shadowOffset', 'texture_3d<f32>', null, USE.RENDER),
         new TextureAttachment('shadowMap', 'texture_depth_2d', null, USE.RENDER),
         new TextureAttachment('diffuseMap', 'texture_2d<f32>', this._diffuseMap, USE.RENDER | USE.SHADOW),
         new TextureAttachment('normalMap', 'texture_2d<f32>', this._normalMap, USE.RENDER),
      ]

      this.samplers = [
         new SamplerAttachment('sampler2D', 'sampler', USE.RENDER | USE.SHADOW),
         new SamplerAttachment('samplerComparison', 'sampler_comparison', USE.RENDER),
      ]

      this.chunks = {
         vertex: [ 
            { mesh: ShaderChunks.vertex.model, instanced_mesh: ShaderChunks.vertex.model_instanced, skinned_mesh: ShaderChunks.vertex.model_skinned },
            ShaderChunks.vertex.projection_camera,
            ShaderChunks.vertex.projection_shadow,
            ShaderChunks.vertex.uv,
            ShaderChunks.vertex.normal,
            ShaderChunks.vertex.fog,
            ShaderChunks.vertex.wind,
            ShaderChunks.vertex.position,
         ],
         fragment: [
            ShaderChunks.fragment.diffuse_map,
            ShaderChunks.fragment.shadowmap,
            ShaderChunks.fragment.light_phong,
            ShaderChunks.fragment.emission,
            ShaderChunks.fragment.fog,
         ]
      }
      
      this.offsets = {};
      this.byteOffsets = {};
      let offset = 0;

      Object.entries(MeshPhongMaterial.struct).forEach(([key, value], index) => {
         this.offsets[key] = offset;
         this.byteOffsets[key] = offset * Float32Array.BYTES_PER_ELEMENT;
         offset += TYPE_COUNT[value];
      });

      this._data = new Float32Array([
         this._color.r, this._color.g, this._color.b, this._color.a,

         this._specularColor.r, this._specularColor.g, this._specularColor.b, this._specularColor.a,

         this._emissionColor.r, this._emissionColor.g, this._emissionColor.b, this._emissionColor.a,

         this._windDirection.x, this._windDirection.y, this._windDirection.z, 0,
         
         this._emissionIntensity,
         this._ambientIntensity,
         this._shininess,
         this._alpha,

         this._useFog,
         this._useLighting,
         this._useWind,
         this._windStrength,
         this._windSpeed,
         this._windHeight,
      ]);
      
      this.write(this._data);
   } 
   
   get ambientIntensity() {
      return this._ambientIntensity;
   }
   
   set ambientIntensity(value) {
      this._ambientIntensity = value;
      this._data[this.offsets.ambientIntensity] = value;
      this.write([value], this.byteOffsets.ambientIntensity);
   }
   
   get alpha() {
      return this._alpha;
   }
   
   set alpha(value) { 
      this._alpha = value;
      this._data[this.offsets.alpha] = value;
      this.write([value], this.byteOffsets.alpha);
   }
   
   get emissionColor() {
      return this._emissionColor;
   }
   
   set emissionColor(color) {
      this._emissionColor = color;
      this._data.set(color.data, this.offsets.emissionColor);
      this.write(color.data, this.byteOffsets.emissionColor);
   }
   
   get emissionIntensity() {
      return this._emissionIntensity;
   }
   
   set emissionIntensity(value) {
      this._emissionIntensity = value;
      this._data[this.offsets.emissionIntensity] = value;
      this.needsUpdate = true;
      this.write([value], this.byteOffsets.emissionIntensity);
   }
   
   get color() {
      return this._color;
   }
   
   set color(color) {
      this._color = color;
      this._data.set(color.data, this.byteOffsets.color);
      this.needsUpdate = true;
   }
   
   get specularColor() {
      return this._specularColor;
   }
   
   set specularColor(color) {
      this._specularColor = color;
      this._data.set(color.data, this.byteOffsets.specularColor);
      this.needsUpdate = true;
   }
   
   
   get shininess() {
      return this._shininess;
   }
   
   set shininess(value) {
      this._shininess = value;
      this._data[this.byteOffsets.shininess] = value;
      this.write([value], this.byteOffsets.shininess);
   }
   
   set useFog(value) {
      this._useFog = value;
      this._data[this.offsets.useFog] = value;
      this.write([value], this.byteOffsets.useFog);
   }
   
   get useFog() {
      return this._useFog;
   }
   
   get useWind() {
      return this._useWind;
   }
   
   set useWind(value) {
      this._useWind = value;
      this._data[this.offsets.useWind] = value ? 1 : 0;
      this.write([value], this.byteOffsets.useWind);
   }
   
   get data() {
       return this._data;
   }
}

export { MeshPhongMaterial };

