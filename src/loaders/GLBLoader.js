import { Geometry } from '../geometry/Geometry.js';
import { Mesh } from '../core/Mesh.js';
import { MeshPhongMaterial } from '../materials/MeshPhongMaterial.js';
import { TextureLoader } from './TextureLoader.js';
import { Object3D } from '../core/Object3D.js';

class GLBLoader {
    constructor(renderer) {
        this.renderer = renderer;
        this.textureLoader = new TextureLoader(renderer);
    }

  async load(url, onLoad, onProgress, onError) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const dataView = new DataView(arrayBuffer);

    // Check the header
    const magic = dataView.getUint32(0, true);
    const version = dataView.getUint32(4, true);
    const length = dataView.getUint32(8, true);

    if (magic !== 0x46546C67) { // 'glTF' in ASCII
        throw new Error('Invalid GLB file');
    }

    let offset = 12;
    let json, binBuffer;

    while (offset < length) {
        const chunkLength = dataView.getUint32(offset, true);
        const chunkType = dataView.getUint32(offset + 4, true);
        offset += 8;

        if (chunkType === 0x4E4F534A) { // 'JSON' in ASCII
            const jsonText = new TextDecoder().decode(arrayBuffer.slice(offset, offset + chunkLength));
            json = JSON.parse(jsonText);
        } else if (chunkType === 0x004E4942) { // 'BIN' in ASCII
            binBuffer = arrayBuffer.slice(offset, offset + chunkLength);
        }

        offset += chunkLength;
    }

    const container = new Object3D();
    for (const meshDef of json.meshes) {
        for (const primitive of meshDef.primitives) {
            const geometry = this.createGeometry(json, binBuffer, primitive);
            const material = await this.createMaterial(json, binBuffer, primitive.material);
            const mesh = new Mesh(geometry, material);
            container.add(mesh);
        }
    }
    return container;
  }
    
      createGeometry(json, binBuffer, primitive) {
        const positionAccessor = json.accessors[primitive.attributes.POSITION];
        const normalAccessor = json.accessors[primitive.attributes.NORMAL];
        const uvAccessor = json.accessors[primitive.attributes.TEXCOORD_0];
        const indexAccessor = json.accessors[primitive.indices];
          console.log(indexAccessor)

        const positionBufferView = json.bufferViews[positionAccessor.bufferView];
        const normalBufferView = json.bufferViews[normalAccessor.bufferView];
        const uvBufferView = json.bufferViews[uvAccessor.bufferView];
        const indexBufferView = json.bufferViews[indexAccessor.bufferView];

        const positionData = new Float32Array(binBuffer, positionBufferView.byteOffset, positionAccessor.count * 3);
        const normalData = new Float32Array(binBuffer, normalBufferView.byteOffset, normalAccessor.count * 3);
        const uvData = new Float32Array(binBuffer, uvBufferView.byteOffset, uvAccessor.count * 2);
        const indexData = new Uint16Array(binBuffer, indexBufferView.byteOffset, indexAccessor.count);

        const geometry = new Geometry();
        geometry.setFromArrays(positionData, normalData, uvData, indexData);
        return geometry;
    }

    

    
    parseBinaryChunk(arrayBuffer, jsonChunkLength) {
        const dataView = new DataView(arrayBuffer);
        const chunkLength = dataView.getUint32(12 + jsonChunkLength + 8, true);
        const chunkType = dataView.getUint32(12 + jsonChunkLength + 12, true);
    
        if (chunkType !== 0x004E4942) { // BIN chunk
            throw new Error("Expected BIN chunk");
        }
    
        return new Uint8Array(arrayBuffer, 12 + jsonChunkLength + 16, chunkLength);
    }
    
    async createMaterial(json, binBuffer, materialIndex) {
        if (materialIndex === undefined || !json.materials) {
            return new MeshPhongMaterial({ color: '#ffffff' });
        }
        const materialDef = json.materials[materialIndex];
        const materialParams = { color: '#ffffff' };

        if (materialDef && materialDef.pbrMetallicRoughness && materialDef.pbrMetallicRoughness.baseColorTexture) {
            const textureInfo = materialDef.pbrMetallicRoughness.baseColorTexture;
            const textureIndex = textureInfo.index;
            const textureDef = json.textures[textureIndex];
            const imageIndex = textureDef.source;
            const imageDef = json.images[imageIndex];

            if (imageDef.bufferView !== undefined) {
                const bufferView = json.bufferViews[imageDef.bufferView];
                const imageArrayBuffer = binBuffer.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);
                const blob = new Blob([imageArrayBuffer], { type: imageDef.mimeType });
                const imageUrl = URL.createObjectURL(blob);

                materialParams.diffuseMap = await this.textureLoader.load(imageUrl);
                URL.revokeObjectURL(imageUrl);
            } else if (imageDef.uri) {
                materialParams.diffuseMap = await this.textureLoader.load(imageDef.uri);
            }
        }

        return new MeshPhongMaterial(materialParams);
    }


    parseJSONChunk(arrayBuffer) {
        const dataView = new DataView(arrayBuffer);
        const chunkLength = dataView.getUint32(12, true);
        const chunkType = dataView.getUint32(16, true);
    
        if (chunkType !== 0x4E4F534A) { // JSON chunk
            throw new Error("Expected JSON chunk");
        }
    
        const jsonChunk = new TextDecoder().decode(
            new Uint8Array(arrayBuffer, 20, chunkLength)
        );
    
        return JSON.parse(jsonChunk);
    }
    
    
  
}

export { GLBLoader }