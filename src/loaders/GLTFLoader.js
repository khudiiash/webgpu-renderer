import { GLTFLoader as GLTF } from '@loaders.gl/gltf';
import {load, parse} from '@loaders.gl/core';


import { Geometry } from '../geometry/Geometry.js';
import { Mesh } from '../core/Mesh.js';
import { InstancedMesh } from '../core/InstancedMesh.js';
import { MeshPhongMaterial } from '../materials/MeshPhongMaterial.js';
import { TextureLoader } from './TextureLoader.js';
import { Object3D } from '../core/Object3D.js';

const COMPONENT_TYPES = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array
};


class GLTFLoader {
    constructor(renderer) {
        if (GLTFLoader.instance) {
            return GLTFLoader.instance
        }
        this.cache = new Map();
        this.textureLoader = new TextureLoader(renderer);
        GLTFLoader.instance = this;
    }
    
    async load(url, instances = 0) {
        if (this.cache.has(url)) {
            return this.cache.get(url);
        }
        const parsed = await load(url, GLTF);
        const mesh = await this.extractMeshData(parsed, instances);
        this.cache.set(url, mesh);
        return mesh;
    }
    
    async extractMeshData(data, instances) {
        const gltf = data.json;
        const buffers = data.buffers;
        if (!gltf.meshes) {
            console.error('No meshes found in gltf file');
            return new Object3D();
        }
        if (gltf.meshes.length === 1) {
            const geometry = this.createGeometry(gltf.meshes[0], gltf, buffers);
            const material = await this.createMaterial(gltf.meshes[0], gltf, buffers);
            const Constructor = instances > 0 ? InstancedMesh : Mesh;
            const mesh = new Constructor(geometry, material, instances);
            return mesh;
        }

        const group = new Object3D();

        for (const mesh of gltf.meshes) {
            const geometry = this.createGeometry(mesh, gltf, buffers);
            const material = await this.createMaterial(mesh, gltf, buffers);
            group.add(new Mesh(geometry, material));
        }
        return group;
      }
    
      createGeometry(mesh, gltf, buffers) {
        const geometry = new Geometry();
        const primitive = mesh.primitives[0];
      
        const positionAccessor = gltf.accessors[primitive.attributes.POSITION];
        const normalAccessor = gltf.accessors[primitive.attributes.NORMAL];
        const uvAccessor = gltf.accessors[primitive.attributes.TEXCOORD_0];
        const indexAccessor = gltf.accessors[primitive.indices];
      
        const positionBufferView = gltf.bufferViews[positionAccessor.bufferView];
        const normalBufferView = gltf.bufferViews[normalAccessor.bufferView];
        const uvBufferView = gltf.bufferViews[uvAccessor.bufferView];
        const indexBufferView = gltf.bufferViews[indexAccessor.bufferView];
        
        const positionBuffer = buffers[positionBufferView.buffer];
        const normalBuffer = buffers[normalBufferView.buffer];
        const uvBuffer = buffers[uvBufferView.buffer];
        const indexBuffer = buffers[indexBufferView.buffer];
      
        const positions = new Float32Array( positionBuffer.arrayBuffer, positionBuffer.byteOffset + positionBufferView.byteOffset, positionAccessor.count * 3);
        const normals = new Float32Array(normalBuffer.arrayBuffer, normalBuffer.byteOffset + normalBufferView.byteOffset, normalAccessor.count * 3);
        const uvs = new Float32Array(uvBuffer.arrayBuffer, uvBuffer.byteOffset + uvBufferView.byteOffset, uvAccessor.count * 2);
        let indices = new COMPONENT_TYPES[indexAccessor.componentType](indexBuffer.arrayBuffer, indexBuffer.byteOffset + indexBufferView.byteOffset, indexAccessor.count);

        if (indices.length % 4 !== 0) {
          const newSizeMultipleOf4 = Math.ceil(indices.length / 4) * 4;
          const newIndices = new COMPONENT_TYPES[indexAccessor.componentType](newSizeMultipleOf4);  
          newIndices.set(indices);
          indices = newIndices;
        }
        geometry.setFromArrays(positions, normals, uvs, indices);
        return geometry;        
      }
    
     async createMaterial(mesh, gltf, buffers) {
         try {
            const primitive = mesh.primitives[0];
            let diffuseMap;
            if (primitive.material !== undefined) {
                   const gltfMaterial = gltf.materials[primitive.material];
                  const pbrMetallicRoughness = gltfMaterial.pbrMetallicRoughness;
                  if (pbrMetallicRoughness.baseColorTexture !== undefined) {
                      const image = gltf.images[pbrMetallicRoughness.baseColorTexture.index];
                      if (!image) {
                            return new MeshPhongMaterial({ color: '#ffffff' });
                      }
                      const bufferView = gltf.bufferViews[image.bufferView];
                      const buffer = buffers[bufferView.buffer];
                      const slice = buffer.arrayBuffer.slice(buffer.byteOffset + bufferView.byteOffset, buffer.byteOffset + bufferView.byteOffset + bufferView.byteLength);
                      const blob = new Blob([slice], { type: image.mimeType });
                      diffuseMap = await this.textureLoader.loadFromBlob(blob);
                  }
            }
            return new MeshPhongMaterial({ diffuseMap });
         } catch(e) {
            console.error(e);
            return new MeshPhongMaterial({ color: '#ffffff' });
         }
     }
}
export { GLTFLoader };