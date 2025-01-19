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
        let vertexSize = 0;
        const positions = this.attributes.position?.data;
        const normals = this.attributes.normal?.data;   
        const uvs = this.attributes.uv?.data;
        const joints = this.attributes.joints?.data;
        const weights = this.attributes.weights?.data;
        const tangents = this.attributes.tangents?.data;
        const bitangents = this.attributes.bitangents?.data;
        if (positions) vertexSize += 3;
        if (normals) vertexSize += 3;
        if (uvs) vertexSize += 2;
        if (joints) vertexSize += 4;
        if (weights) vertexSize += 4;
        if (tangents) vertexSize += 3;
        if (bitangents) vertexSize += 3;


        if (!this.packed) {
            this.packed = new BufferData(this.vertexCount, vertexSize).onChange(this.pack);
        }

        for (let i = 0; i < this.vertexCount; i++) {
            const vi = i * 3; // vertex index
            const ni = i * 3; // normal index
            const uvi = i * 2; // uv index
            const ji = i * 4; // joint index
            const wi = i * 4; // weight index
            const ti = i * 3; // tangent index
            const bi = i * 3; // bitangent index
            const offset = i * vertexSize; // offset in the interleaved array

            if (positions) {
                this.packed[offset + 0] = positions[vi + 0];
                this.packed[offset + 1] = positions[vi + 1];
                this.packed[offset + 2] = positions[vi + 2];
            }

            if (normals) {
                this.packed[offset + 3] = normals[ni + 0];
                this.packed[offset + 4] = normals[ni + 1];
                this.packed[offset + 5] = normals[ni + 2];
            }

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

        return this;
    }

    getPacked() {
        if (!this.packed) {
            this.pack();
        }
        return this.packed;
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
        tangents?: number[], 
        bitangents?: number[]
    }) {
        if (positions) this.setAttribute('position', new Float32BufferAttribute(positions, 3));
        if (normals) this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
        if (uvs) this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
        if (joints) this.setAttribute('joints', new Float32BufferAttribute(joints, 4));
        if (weights) this.setAttribute('weights', new Float32BufferAttribute(weights, 4));
        if (indices) this.setIndices(alignArray(indices));
        if (!Number.isInteger(this.attributes.position.count)) {

            debugger
        }


        this.pack();
        this.computeBoundingBox();
        this.computeBoundingSphere();
        return this;
    }

}