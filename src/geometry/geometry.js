import { Float32BufferAttribute } from '../core/BufferAttribute.js';
import { BoundingBox } from '../math/BoundingBox.js';
import { BoundingSphere } from '../math/BoundingSphere.js';
import { generateID } from '../math/MathUtils.js';
import { Vector3 } from '../math/Vector3.js';
import { Utils } from '../utils/Utils.js';

const _vector = new Vector3();
const _box = new BoundingBox();

class Geometry {
    constructor() {
        this.id = Utils.GUID('geometry');
        this.positions = [];
        this.normals = [];
        this.indices = [];
        this.uvs = [];
        this.joints = [];
        this.weights = [];
        this.packed = [];
        this.isGeometry = true;
        this.index = null;
        this.attributes = {};
        this.boundingBox = null;
        this.boundingSphere = null;
        this.isInstancedGeometry = false;
        this.attributes = {};
        this.isIndexed = false;
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
    
    rotateY(angle) {
        const positions = this.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const z = positions[i + 2];
            positions[i] = x * Math.cos(angle) + z * Math.sin(angle);
            positions[i + 2] = z * Math.cos(angle) - x * Math.sin(angle);
        }
        return this;
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
    
    computeBoundingSphere() {
        if (this.boundingSphere === null) {
            this.boundingSphere = new BoundingSphere();
        }
    
        const position = this.attributes.position;
    
        if (!position) {
            console.error('Geometry has no position attribute.');
            return this;
        }
    
        const positions = position.array;
        const center = [0, 0, 0];
        const vertexCount = positions.length / 3;
    
        // Calculate the center of the bounding sphere
        for (let i = 0; i < vertexCount; i++) {
            center[0] += positions[i * 3];
            center[1] += positions[i * 3 + 1];
            center[2] += positions[i * 3 + 2];
        }
    
        center[0] /= vertexCount;
        center[1] /= vertexCount;
        center[2] /= vertexCount;
    
        // Calculate the radius of the bounding sphere
        let maxRadiusSq = 0;
        for (let i = 0; i < vertexCount; i++) {
            const dx = positions[i * 3] - center[0];
            const dy = positions[i * 3 + 1] - center[1];
            const dz = positions[i * 3 + 2] - center[2];
            const distanceSq = dx * dx + dy * dy + dz * dz;
            if (distanceSq > maxRadiusSq) {
                maxRadiusSq = distanceSq;
            }
        }
    
        this.boundingSphere.center.set(center[0], center[1], center[2]);
        this.boundingSphere.radius = Math.sqrt(maxRadiusSq);
    
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
    
    setFromArrays(indices, positions, normals, uvs, joints, weights, tangents, bitangents) {
        const vertexCount = positions.length / 3;
        let vertexSize = 0;
        if (positions) vertexSize += 3;
        if (normals) vertexSize += 3;
        if (uvs) vertexSize += 2;
        if (joints) vertexSize += 4;
        if (weights) vertexSize += 4;
        if (tangents) vertexSize += 3;
        if (bitangents) vertexSize += 3;

        const size = vertexCount * vertexSize;
        this.positions = positions;
        this.normals = normals;
        this.uvs = uvs;
        this.indices = indices;
        this.joints = joints;
        this.weights = weights;
        this.tangents = tangents;
        this.bitangents = bitangents;

        this.packed = new Float32Array(size);

        for (let i = 0; i < vertexCount; i++) {
            const vi = i * 3; // vertex index
            const ni = i * 3; // normal index
            const uvi = i * 2; // uv index
            const ji = i * 4; // joint index
            const wi = i * 4; // weight index
            const ti = i * 3; // tangent index
            const bi = i * 3; // bitangent index
            const offset = i * vertexSize; // offset in the interleaved array

            // Position
            if (positions) {
                this.packed[offset + 0] = positions[vi + 0];
                this.packed[offset + 1] = positions[vi + 1];
                this.packed[offset + 2] = positions[vi + 2];
            }

            // Normal
            if (normals) {
                this.packed[offset + 3] = normals[ni + 0];
                this.packed[offset + 4] = normals[ni + 1];
                this.packed[offset + 5] = normals[ni + 2];
            }

            // UV
            if (uvs) {
                this.packed[offset + 6] = uvs[uvi + 0];
                this.packed[offset + 7] = uvs[uvi + 1];
            }
            if (joints) {
                this.packed[offset + 8] = joints[ji + 0];
                this.packed[offset + 9] = joints[ji + 1];
                this.packed[offset + 10] = joints[ji + 2];
                this.packed[offset + 11] = joints[ji + 3];
            }
            
            if (weights) {
                this.packed[offset + 12] = weights[wi + 0];
                this.packed[offset + 13] = weights[wi + 1];
                this.packed[offset + 14] = weights[wi + 2];
                this.packed[offset + 15] = weights[wi + 3];
            }

            if (tangents) {
                this.packed[offset + 16] = tangents[ti + 0];
                this.packed[offset + 17] = tangents[ti + 1];
                this.packed[offset + 18] = tangents[ti + 2];
            }

            if (bitangents) {
                this.packed[offset + 19] = bitangents[bi + 0];
                this.packed[offset + 20] = bitangents[bi + 1];
                this.packed[offset + 21] = bitangents[bi + 2];
            }
        }
        
        if (positions) this.setAttribute('position', new Float32BufferAttribute(positions, 3));
        if (normals) this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
        if (uvs) this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
        if (joints) this.setAttribute('joints', new Float32BufferAttribute(joints, 4));
        if (weights) this.setAttribute('weights', new Float32BufferAttribute(weights, 4));
        if (indices) this.setIndices(indices);
        this.computeBoundingBox();
        this.computeBoundingSphere();
        this.attributes;
    }
    
    get vertexBufferSize() {
        return Object.values(this.attributes).reduce((acc, attribute) => {
              return acc + attribute.array.length * attribute.array.BYTES_PER_ELEMENT;
        }, 0);
    }
    
    computeBoundingBox() {
        if ( this.boundingBox === null ) {

			this.boundingBox = new BoundingBox();

		}

		const position = this.attributes.position;

		if (position) {
			this.boundingBox.setFromAttribute(position);
		}

		if ( isNaN( this.boundingBox.min.x ) || isNaN( this.boundingBox.min.y ) || isNaN( this.boundingBox.min.z ) ) {

			console.error( 'Geometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.', this );

		}
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