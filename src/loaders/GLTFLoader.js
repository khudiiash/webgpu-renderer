import { GLTFLoader as GLTF } from '@loaders.gl/gltf';
import {load, parse} from '@loaders.gl/core';


import { Geometry } from '../geometry/Geometry.js';
import { Mesh } from '../core/Mesh.js';
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

// class GLTFLoader {
//     constructor(renderer) {
//         this.textureLoader = new TextureLoader(renderer);
//     }
    
//     async load(url) {
//         const gltf = await Gltf2Parser.fetch( url );
//         return await this.loadMesh( gltf );
//     }
    
//     async loadMesh( gltf, name = null, mat = null ) {
//         const o = gltf.getMesh( name );
//         let geo, prim, pmat;

//         if( o.primitives.length == 1 ){
//             prim = o.primitives[ 0 ];

//             if( mat ){          
//                 pmat = mat;
//             }else if( prim.materialIdx != null ){
//                 pmat = await this.loadMaterial( gltf, prim.materialIdx );
//             }
            
//             geo = this.primitiveGeo( prim );
//             return new Mesh( geo, pmat || new MeshPhongMaterial({ }) );
//         }else{
//             let mesh, m, c ;
//             const group = Object3D();
//             for( prim of o.primitives ){

//                 if(mat){
//                     pmat = mat;
//                 }else if( prim.materialIdx != null ){
//                     pmat = await this.loadMaterial( gltf, prim.materialIdx );
//                 }
            
//                 geo = this.primitiveGeo( prim );
//                 mesh = new Mesh( geo, pmat );
                
//                 group.add( mesh );
//             }
//             return group;
//         }
//     }
    
//     async loadMaterial( gltf, id) {
//         const config = {};
//         const m = gltf.getMaterial( id );
//         if (m) {
//             if( m.baseColorFactor ){
//                 config.color = new Color( 
//                     m.baseColorFactor[0], 
//                     m.baseColorFactor[1], 
//                     m.baseColorFactor[2]
//                 );
//             }
//             if (m.baseColorTexture) {
//                 const t = gltf.getTexture( m.baseColorTexture.index );
//                 const texture = await this.textureLoader.loadFromBlob(t.blob);
//                 config.diffuseMap = texture;    
//             }
//         }
//         return new MeshPhongMaterial( config ); 
        
//     }
    
//     primitiveGeo( prim ){
//         const geometry = new Geometry();
//         const vertices = prim.position.data;
//         const normals = prim.normal.data;
//         const uvs = prim.texcoord_0.data;
//         let indices = prim.indices.data;

//         if (indices.length % 4 !== 0) {
//             const newSizeMultipleOf4 = Math.ceil(indices.length / 4) * 4;
//             indices = new prim.indices.data.constructor(newSizeMultipleOf4);
//             indices.set(prim.indices.data);
//         }
//         geometry.setFromArrays(vertices, normals, uvs, indices);
//         return geometry;
//     }
// }
class GLTFLoader {
    constructor(renderer) {
        this.textureLoader = new TextureLoader(renderer);
    }
    
    async load(url) {
        const parsed = await load(url, GLTF);
        return await this.extractMeshData(parsed);
    }
    
    async extractMeshData(data) {
        const gltf = data.json;
        const buffers = data.buffers;
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
      
        const positions = new Float32Array(buffers[positionBufferView.buffer].arrayBuffer, positionBufferView.byteOffset, positionAccessor.count * 3);
        const normals = new Float32Array(buffers[normalBufferView.buffer].arrayBuffer, normalBufferView.byteOffset, normalAccessor.count * 3);
        const uvs = new Float32Array(buffers[uvBufferView.buffer].arrayBuffer, uvBufferView.byteOffset, uvAccessor.count * 2);
        let indices = new COMPONENT_TYPES[indexAccessor.componentType](buffers[indexBufferView.buffer].arrayBuffer, indexBufferView.byteOffset, indexAccessor.count);

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
                  const blob = new Blob([buffers[bufferView.buffer].arrayBuffer.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength)]);
                  diffuseMap = await this.textureLoader.loadFromBlob(blob);
              }
        }
        const material = new MeshPhongMaterial({ diffuseMap });
        return material;
     }
}
export { GLTFLoader };