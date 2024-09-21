import { Float32BufferAttribute } from '../core/BufferAttribute.js';
import { generateID } from '../math/MathUtils.js';

class Geometry {
    constructor() {
        this.id = generateID();
        this.vertices = [];
        this.normals = [];
        this.indices = [];
        this.uvs = [];
        this.packed = [];
        this.isGeometry = true;
        this.index = null;
        this.attributes = {};
        this.boundningBox = null;
        this.boundingSphere = null;
        this.attributes = {};
        this.isIndexed = false;
        this.instancesCount = 1;
    }
    
    setAttribute(name, data) {
        this.attributes[name] = data;
        return this;
    }
    
    getAttribute(name) {
        return this.attributes[name];
    }
    
    
    getIndices() {
        return this.indices;
    }
    
    getVertexAttributesLayout() {
        if (this.vertexAttributesLayout) {
            return this.vertexAttributesLayout;
        }

        this.vertexAttributesLayout = {
            arrayStride: 0, 
            attributes: []
        };
        let offset = 0;
        let shaderLocation = 0;

        for (let name in this.attributes) {
            const attribute = this.attributes[name];
            const itemSize = attribute.itemSize;
            this.vertexAttributesLayout.arrayStride += itemSize * attribute.array.BYTES_PER_ELEMENT;
            this.vertexAttributesLayout.attributes.push({
                name: name,
                shaderLocation,
                offset,
                format: attribute.format,
            });
            shaderLocation++;
            offset += itemSize * attribute.array.BYTES_PER_ELEMENT;
        }
        return this.vertexAttributesLayout;
    }
    
    get vertexCount() {
        return this.attributes.position.array.length / 3;
    }
    
    
    setIndices(indices) {
        if (indices instanceof Uint32Array) {
            this.indices = indices;
            this.isIndexed = true;
            this.indexFormat = 'uint32';
        } else if (indices instanceof Uint16Array) {
            this.indices = indices;
            this.isIndexed = true;
            this.indexFormat = 'uint16';
        } else if (indices instanceof Uint8Array) {
            this.indices = indices;
            this.isIndexed = true;
            this.indexFormat = 'uint8';
        } else if (indices instanceof Array) {
            this.indices = new Uint16Array(indices);
            this.isIndexed = true;
            this.indexFormat = 'uint16';
        }

        return this;
    }
    
    deleteAttribute(name) {
        delete this.attributes[name];
        return this;
    }
    
    computeVertexNormals() {
        const index = this.index;
    }
    
    getAttributes() {
        return 
    }
    
    setFromArrays(vertices, normals, uvs, indices) {
        const vertexCount = vertices.length / 3; // Assuming each vertex has 3 components (x, y, z)
        const vertexSize = 3 + 3 + 2; // 3 for position, 3 for normal, 2 for UV
        const size = vertexCount * vertexSize;
        this.vertices = vertices;
        this.normals = normals;
        this.uvs = uvs;
        this.indices = indices;

        this.packed = new Float32Array(size);

        for (let i = 0; i < vertexCount; i++) {
            const vi = i * 3; // vertex index
            const ni = i * 3; // normal index
            const uvi = i * 2; // uv index
            const offset = i * vertexSize; // offset in the interleaved array

            // Position
            this.packed[offset + 0] = vertices[vi + 0];
            this.packed[offset + 1] = vertices[vi + 1];
            this.packed[offset + 2] = vertices[vi + 2];

            // Normal
            this.packed[offset + 3] = normals[ni + 0];
            this.packed[offset + 4] = normals[ni + 1];
            this.packed[offset + 5] = normals[ni + 2];

            // UV
            this.packed[offset + 6] = uvs[uvi + 0];
            this.packed[offset + 7] = uvs[uvi + 1];
        }
        
        this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
        this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
        this.setIndices(indices);
    }
    
    get vertexBufferSize() {
        return Object.values(this.attributes).reduce((acc, attribute) => {
              return acc + attribute.array.length * attribute.array.BYTES_PER_ELEMENT;
        }, 0);
    }
    
    setAttribute(name, data) {
        this.attributes[name] = data;
        return this;
    }
    
    getAttribute(name) {
        return this.attributes[name];
    }
    
    getAttributes() {
        return Object.values(this.attributes);
    }
}

export { Geometry };