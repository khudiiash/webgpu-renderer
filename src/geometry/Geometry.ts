import { Float32BufferAttribute } from './BufferAttribute';
import { Vector3 } from '@/math/Vector3';
import { BoundingBox } from '@/math/BoundingBox';
import { BoundingSphere } from '@/math/BoundingSphere';
import { autobind, uuid } from '@/util/general';
import { alignArray } from '@/util/webgpu';
import { BufferData } from '@/data';

const _tempVec3 = new Vector3();

type GPUIndexFormat = 'uint32' | 'uint16' | 'uint8';

export class Geometry {
    id: string = uuid('geometry');
    attributes: Record<string, Float32BufferAttribute>;
    index: Uint32Array | Uint16Array | Uint8Array | null;
    boundingBox!: BoundingBox;
    boundingSphere!: BoundingSphere;
    isIndexed: boolean;
    indexFormat?: GPUIndexFormat;
    packed!: Float32Array | null;
    indices: any;

    constructor() {
        autobind(this);
        this.attributes = {
            position: new Float32BufferAttribute([], 3),
        }
        this.index = null;
        this.isIndexed = false;
    }


    calculateNormals() {
        const positions = this.attributes.position?.data;
        const indices = this.indices;
    
        if (!positions || !indices) {
            console.error('Missing required attributes for normal calculation.');
            return;
        }
    
        const vertexCount = positions.length / 3;
        const normals = new Float32Array(vertexCount * 3);
    
        const vA = new Vector3();
        const vB = new Vector3();
        const vC = new Vector3();
        const edgeA = new Vector3();
        const edgeB = new Vector3();
        const normal = new Vector3();
    
        for (let i = 0; i < indices.length; i += 3) {
            const iA = indices[i] * 3;
            const iB = indices[i + 1] * 3;
            const iC = indices[i + 2] * 3;
    
            vA.setXYZ(positions[iA], positions[iA + 1], positions[iA + 2]);
            vB.setXYZ(positions[iB], positions[iB + 1], positions[iB + 2]);
            vC.setXYZ(positions[iC], positions[iC + 1], positions[iC + 2]);
    
            edgeA.subVectors(vB, vA);
            edgeB.subVectors(vC, vA);
            normal.crossVectors(edgeA, edgeB).normalize();
    
            normals[iA] += normal.x;
            normals[iA + 1] += normal.y;
            normals[iA + 2] += normal.z;
    
            normals[iB] += normal.x;
            normals[iB + 1] += normal.y;
            normals[iB + 2] += normal.z;
    
            normals[iC] += normal.x;
            normals[iC + 1] += normal.y;
            normals[iC + 2] += normal.z;
        }
    
        for (let i = 0; i < vertexCount; i++) {
            const i3 = i * 3;
            const x = normals[i3];
            const y = normals[i3 + 1];
            const z = normals[i3 + 2];
            const length = Math.sqrt(x * x + y * y + z * z);
    
            normals[i3] /= length;
            normals[i3 + 1] /= length;
            normals[i3 + 2] /= length;
        }

        this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    }
    calculateTangents() {
        const positions = this.attributes.position?.data;
        const uvs = this.attributes.uv?.data;
        const indices = this.indices;
    
        if (!positions || !uvs || !indices) {
            console.error('Missing required attributes for tangent calculation.');
            return;
        }
    
        // Initialize tangent and bitangent arrays
        const tangents = new Float32Array(positions.length);
        const bitangents = new Float32Array(positions.length);
    
        // Reusable vectors
        const pos0 = new Vector3();
        const pos1 = new Vector3();
        const pos2 = new Vector3();
        const deltaPos1 = new Vector3();
        const deltaPos2 = new Vector3();
        const tangent = new Vector3();
        const bitangent = new Vector3();
    
        // Loop over every triangle
        for (let i = 0; i < indices.length - 2; i++) {
            const index0 = indices[i];
            const index1 = indices[i + 1 + (i % 2)];
            const index2 = indices[i + 2 - (i % 2)];
    
            const posIndex0 = index0 * 3;
            const posIndex1 = index1 * 3;
            const posIndex2 = index2 * 3;
    
            const uvIndex0 = index0 * 2;
            const uvIndex1 = index1 * 2;
            const uvIndex2 = index2 * 2;
    
            // Vertex positions
            pos0.setXYZ(positions[posIndex0], positions[posIndex0 + 1], positions[posIndex0 + 2]);
            pos1.setXYZ(positions[posIndex1], positions[posIndex1 + 1], positions[posIndex1 + 2]);
            pos2.setXYZ(positions[posIndex2], positions[posIndex2 + 1], positions[posIndex2 + 2]);
    
            // Texture coordinates
            const uv0x = uvs[uvIndex0], uv0y = uvs[uvIndex0 + 1];
            const uv1x = uvs[uvIndex1], uv1y = uvs[uvIndex1 + 1];
            const uv2x = uvs[uvIndex2], uv2y = uvs[uvIndex2 + 1];
    
            // Edges of the triangle
            deltaPos1.subVectors(pos1, pos0);
            deltaPos2.subVectors(pos2, pos0);
    
            const deltaUV1x = uv1x - uv0x;
            const deltaUV1y = uv1y - uv0y;
            const deltaUV2x = uv2x - uv0x;
            const deltaUV2y = uv2y - uv0y;
    
            const r = deltaUV1x * deltaUV2y - deltaUV1y * deltaUV2x;
            const f = r === 0 ? 0.0 : 1.0 / r;
    
            // Compute tangent and bitangent
            tangent.setXYZ(
                f * (deltaPos1.x * deltaUV2y - deltaPos2.x * deltaUV1y),
                f * (deltaPos1.y * deltaUV2y - deltaPos2.y * deltaUV1y),
                f * (deltaPos1.z * deltaUV2y - deltaPos2.z * deltaUV1y)
            );
            bitangent.setXYZ(
                f * (deltaPos2.x * deltaUV1x - deltaPos1.x * deltaUV2x),
                f * (deltaPos2.y * deltaUV1x - deltaPos1.y * deltaUV2x),
                f * (deltaPos2.z * deltaUV1x - deltaPos1.z * deltaUV2x)
            );
    
            // Accumulate for each vertex of the triangle
            for (const idx of [index0, index1, index2]) {
                tangents[idx * 3]     += tangent.x;
                tangents[idx * 3 + 1] += tangent.y;
                tangents[idx * 3 + 2] += tangent.z;
    
                bitangents[idx * 3]     += bitangent.x;
                bitangents[idx * 3 + 1] += bitangent.y;
                bitangents[idx * 3 + 2] += bitangent.z;
            }
        }
    
        // Normalize the tangents and bitangents
        for (let i = 0; i < this.vertexCount; i++) {
            // Normalize each tangent
            tangent.setXYZ(tangents[i * 3], tangents[i * 3 + 1], tangents[i * 3 + 2]).normalize();
            tangents[i * 3] = tangent.x;
            tangents[i * 3 + 1] = tangent.y;
            tangents[i * 3 + 2] = tangent.z;
    
            // Normalize each bitangent
            bitangent.setXYZ(bitangents[i * 3], bitangents[i * 3 + 1], bitangents[i * 3 + 2]).normalize();
            bitangents[i * 3] = bitangent.x;
            bitangents[i * 3 + 1] = bitangent.y;
            bitangents[i * 3 + 2] = bitangent.z;
        }
    
        // Set the calculated tangents and bitangents
        this.setAttribute('tangent', new Float32BufferAttribute(tangents, 3));
        this.setAttribute('bitangent', new Float32BufferAttribute(bitangents, 3));
    }
    setAttribute(name: string, attribute: Float32BufferAttribute) {
        this.attributes[name] = attribute;
        return this;
    }

    getAttribute(name: string) {
        return this.attributes[name];
    }

    setIndices(indices: ArrayLike<number> | Uint32Array | Uint16Array | Uint8Array) {
        if (indices instanceof Uint32Array) {
            this.indices = indices;
            this.indexFormat = 'uint32';
        } else if (indices instanceof Uint16Array) {
            this.indices = indices;
            this.indexFormat = 'uint16';
        } else if (indices instanceof Uint8Array) {
            this.indices = indices;
            this.indexFormat = 'uint8'; 
        } else {
            this.indices = new Uint16Array(indices);
            this.indexFormat = 'uint16';
        }
        this.isIndexed = true;
        return this;
    }

    getIndices() {
        return this.index;
    }

    rotateY(angle: number) {
        const pos = this.attributes.position?.data;
        if (!pos) return this;
        for (let i = 0; i < pos.length; i += 3) {
            const x = pos[i], z = pos[i + 2];
            pos[i] = x * Math.cos(angle) + z * Math.sin(angle);
            pos[i + 2] = z * Math.cos(angle) - x * Math.sin(angle);
        }
        return this;
    }

    rotateX(angle: number) {
        const pos = this.attributes.position?.data;
        if (!pos) return this;
        for (let i = 0; i < pos.length; i += 3) {
            const y = pos[i + 1], z = pos[i + 2];
            pos[i + 1] = y * Math.cos(angle) - z * Math.sin(angle);
            pos[i + 2] = z * Math.cos(angle) + y * Math.sin(angle);
        }
        this.pack();
        return this;
    }

    rotateZ(angle: number) {
        const pos = this.attributes.position?.data;
        if (!pos) return this;
        for (let i = 0; i < pos.length; i += 3) {
            const x = pos[i], y = pos[i + 1];
            pos[i] = x * Math.cos(angle) - y * Math.sin(angle);
            pos[i + 1] = y * Math.cos(angle) + x * Math.sin(angle);
        }
        this.pack();
        return this;
    }

    scale(sx: number, sy: number, sz: number) {
        const pos = this.attributes.position?.data;
        if (!pos) return this;
        for (let i = 0; i < pos.length; i += 3) {
            pos[i] *= sx; pos[i + 1] *= sy; pos[i + 2] *= sz;
        }
        return this;
    }

    translate(tx: number, ty: number, tz: number) {
        const pos = this.attributes.position?.data;
        if (!pos) return this;
        for (let i = 0; i < pos.length; i += 3) {
            pos[i] += tx; pos[i + 1] += ty; pos[i + 2] += tz;
        }
        return this;
    }

    get vertexCount() {
        const position = this.attributes.position;
        return position ? position.count : 0;
    }

    getAttributes() {
        return Object.values(this.attributes);
    }

    getVertexAttributesLayout() {
        const layout: any = { arrayStride: 0, attributes: [] };
        let offset = 0, location = 0;
        for (const name in this.attributes) {
            const attr = this.attributes[name];
            layout.attributes.push({
                shaderLocation: location++,
                offset,
                format: attr.format,
            });
            offset += attr.itemSize * attr.data.BYTES_PER_ELEMENT;
        }
        layout.arrayStride = offset;
        return layout as GPUVertexBufferLayout;
    }

    computeBoundingBox() {
        if (!this.boundingBox) this.boundingBox = new BoundingBox();
        const position = this.attributes.position;
        if (position) this.boundingBox.setFromAttribute(position);
        return this;
    }

    computeBoundingSphere() {
        if (!this.boundingSphere) this.boundingSphere = new BoundingSphere();
        const position = this.attributes.position;
        if (!position) return this;
        this.computeBoundingBox();
        this.boundingBox?.getCenter(_tempVec3);
        let maxDistSq = 0;
        const posArray = position.data;
        for (let i = 0; i < posArray.length; i += 3) {
            const dx = posArray[i] - _tempVec3.x;
            const dy = posArray[i + 1] - _tempVec3.y;
            const dz = posArray[i + 2] - _tempVec3.z;
            maxDistSq = Math.max(maxDistSq, dx * dx + dy * dy + dz * dz);
        }
        this.boundingSphere.center.copy(_tempVec3);
        this.boundingSphere.radius = Math.sqrt(maxDistSq);
        return this;
    }

    pack() {
        // Define static offsets for each attribute
        const positions = this.attributes.position?.data;
        const normals = this.attributes.normal?.data;
        const uvs = this.attributes.uv?.data;
        const joints = this.attributes.joints?.data;
        const weights = this.attributes.weights?.data;
        const tangents = this.attributes.tangent?.data;
        const bitangents = this.attributes.bitangent?.data;

        const positionOffset = 0;
        const normalOffset = 3;
        const uvOffset = 6;
        const tangentOffset = 8; 
        const bitangentOffset = 11;
        const vertexSize = 14;
    
        if (!this.packed) {
            this.packed = new BufferData(this.vertexCount, vertexSize).onChange(this.pack);
        }
    
        for (let i = 0; i < this.vertexCount; i++) {
            const vi = i * 3; // Index for positions, normals, tangents, bitangents
            const uvi = i * 2; // Index for UVs
            const ji = i * 4; // Index for joints
            const wi = i * 4; // Index for weights
            const offset = i * vertexSize; // Base offset in the buffer
    
            // Positions
            if (positions) {
                this.packed[offset + positionOffset + 0] = positions[vi + 0];
                this.packed[offset + positionOffset + 1] = positions[vi + 1];
                this.packed[offset + positionOffset + 2] = positions[vi + 2];
            } else {
                this.packed.set([0, 0, 0], offset + positionOffset);
            }
    
            // Normals
            if (normals) {
                this.packed[offset + normalOffset + 0] = normals[vi + 0];
                this.packed[offset + normalOffset + 1] = normals[vi + 1];
                this.packed[offset + normalOffset + 2] = normals[vi + 2];
            } else {
                this.packed.set([0, 0, 0], offset + normalOffset);
            }
    
            // UVs
            if (uvs) {
                this.packed[offset + uvOffset + 0] = uvs[uvi + 0];
                this.packed[offset + uvOffset + 1] = uvs[uvi + 1];
            } else {
                this.packed.set([0, 0], offset + uvOffset);
            }
    
            // Tangents
            if (tangents) {
                this.packed[offset + tangentOffset + 0] = tangents[vi + 0];
                this.packed[offset + tangentOffset + 1] = tangents[vi + 1];
                this.packed[offset + tangentOffset + 2] = tangents[vi + 2];
            } else {
                this.packed.set([0, 0, 0], offset + tangentOffset);
            }
    
            // Bitangents
            if (bitangents) {
                this.packed[offset + bitangentOffset + 0] = bitangents[vi + 0];
                this.packed[offset + bitangentOffset + 1] = bitangents[vi + 1];
                this.packed[offset + bitangentOffset + 2] = bitangents[vi + 2];
            } else {
                this.packed.set([0, 0, 0], offset + bitangentOffset);
            }
        }
    
        return this;
    }
    
    getPacked() {
        if (!this.packed) {
            this.pack();
        }
        return this.packed;
    }

    calculateUVs() {
        const positions = this.attributes.position?.data;
        if (!positions) return;
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let i = 0; i < positions.length; i += 3) {
            minX = Math.min(minX, positions[i]);
            maxX = Math.max(maxX, positions[i]);
            minY = Math.min(minY, positions[i + 1]);
            maxY = Math.max(maxY, positions[i + 1]);
        }
        const width = maxX - minX;
        const height = maxY - minY;
        const uvs = [];
        for (let i = 0; i < positions.length; i += 3) {
            const u = (positions[i] - minX) / width;
            const v = (positions[i + 1] - minY) / height;
            uvs.push(u, v);
        }
        this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    }

    setFromArrays({
        positions, 
        indices, 
        normals, 
        uvs, 
        joints, 
        weights, 
        tangents, 
        bitangents
    }: {
        positions: ArrayLike<number>, 
        indices?: Uint16Array<ArrayBufferLike> | Uint32Array<ArrayBufferLike> | ArrayLike<number> | Uint8Array<ArrayBufferLike>, 
        normals?: ArrayLike<number>, 
        uvs?: ArrayLike<number>, 
        joints?: ArrayLike<number>, 
        weights?: ArrayLike<number>, 
        tangents?: ArrayLike<number>, 
        bitangents?: ArrayLike<number>
    }) {
        if (positions) this.setAttribute('position', new Float32BufferAttribute(positions, 3));
        if (normals) this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
        if (uvs) this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
        // if (joints) this.setAttribute('joints', new Float32BufferAttribute(joints, 4));
        // if (weights) this.setAttribute('weights', new Float32BufferAttribute(weights, 4));
        if (indices) this.setIndices(alignArray(indices));
        if (tangents) this.setAttribute('tangent', new Float32BufferAttribute(tangents, 3));
        if (bitangents) this.setAttribute('bitangent', new Float32BufferAttribute(bitangents, 3));


        this.computeBoundingBox();
        this.computeBoundingSphere();

        if (!normals) {
            this.calculateNormals();
        }
        if (!uvs) {
            this.calculateUVs();
        }
        if (!tangents || !bitangents) {
            this.calculateTangents();
        }

        this.pack();
        return this;
    }

}