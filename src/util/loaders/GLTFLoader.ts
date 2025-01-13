import { GLTFLoader as GLTF } from '@loaders.gl/gltf';
import {load} from '@loaders.gl/core';


import { Mesh } from '@/core';
import { Geometry } from '@/geometry';
import { TextureLoader } from './index.js';
import { Object3D } from '../../core/Object3D.js';
import { StandardMaterial } from '@/materials/StandardMaterial.js';


const COMPONENT_TYPES = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array
};

const COMPONENT_COUNT = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
    MAT2: 4,
    MAT3: 9,
    MAT4: 16
};


class GLTFLoader {
    static #instance: GLTFLoader;
    instances: number = 0;
    data: any;


    private cache!: Map<number, Object3D>;
    private textureLoader!: TextureLoader;
    private materialCache!: Map<number, StandardMaterial>; // Cache for materials

    constructor(_device: GPUDevice) {
        if (GLTFLoader.#instance) {
            return GLTFLoader.#instance;
        }
        this.cache = new Map();
        this.textureLoader = TextureLoader.getInstance();
        this.materialCache = new Map(); // Initialize material cache
        GLTFLoader.#instance = this;
    }

    static async load(url: string, instances = 0) {
        const loader = GLTFLoader.getInstance();
        return loader.load(url, instances);
    }

    static async loadMesh(url: string, instances = 0) {
        const loader = GLTFLoader.getInstance();
        return loader.loadMesh(url, instances);
    }

    static init(device: GPUDevice) {
        const loader = new GLTFLoader(device);
        return loader;
    }
    static getInstance() {
        if (!GLTFLoader.#instance) {
            throw new Error('GLTFLoader has not been initialized');
        }
        return GLTFLoader.#instance;
    }
    
    createGeometry(primitive: any, gltf: any, buffers: any) {
        const geometry = new Geometry();
        // Removed the need to access primitive from mesh.primitives[0]

        const positions = this.parseAccessor(gltf, buffers, primitive.attributes.POSITION);
        const normals = this.parseAccessor(gltf, buffers, primitive.attributes.NORMAL);
        const uvs = this.parseAccessor(gltf, buffers, primitive.attributes.TEXCOORD_0);
        const indices = this.parseAccessor(gltf, buffers, primitive.indices);
        const joints = this.parseAccessor(gltf, buffers, primitive.attributes.JOINTS_0);
        const weights = this.parseAccessor(gltf, buffers, primitive.attributes.WEIGHTS_0);

        geometry.setFromArrays({
            positions: positions || new Float32Array(),
            normals: normals || undefined,
            uvs: uvs || undefined,
            indices: indices || undefined,
            joints: joints || undefined,
            weights: weights || undefined,
        });
        return geometry;        
    }

    
    async load(url: string, instances = 0) {
        this.cache.clear();
        this.instances = instances;
        this.data = await load(url, GLTF);
        const parsed = await this.parse(this.data);
        return parsed;
    }    
    
    async loadMesh(url: string, instances = 0) {
        this.cache.clear();
        this.instances = instances;
        this.data = await load(url, GLTF);
        const parsed = await this.parseNode(this.data.json, this.data.buffers, 0);
        return parsed;
    }
    
    // Adjusted method to process primitives individually
    async parse(data: any) {
        const gltf = data.json;
        const buffers = data.buffers;
        
        const scenes = await this.parseScenes(gltf, buffers);
        const scene = scenes[gltf.scene || 0];
        
        return {
            scenes,
            animations: [], // Adjust or implement animations if necessary
            instancedMeshes: scene.find((node: any) => node.isInstancedMesh),
            scene
        };
    }
    
    // Made this method async to handle asynchronous operations
    async parseScenes(gltf: any, buffers: any) {
        return await Promise.all(gltf.scenes.map(async (scene: any) => {
            const sceneObj = new Object3D();
            for (const nodeIndex of scene.nodes) {
                const childObj = await this.parseNode(gltf, buffers, nodeIndex);
                sceneObj.add(childObj as Object3D);
            }
            return sceneObj;
        }));
    }
    

    // Adjusted parseNode to handle multiple primitives and asynchronous texture loading
    async parseNode(gltf: any, buffers: any, nodeIndex: any) {
        if (this.cache.has(nodeIndex)) {
            return this.cache.get(nodeIndex);
        }
        const nodeData = gltf.nodes[nodeIndex];
        let obj = new Object3D();

        if (nodeData.mesh !== undefined) {
            const meshData = gltf.meshes[nodeData.mesh];
            if (meshData.primitives.length === 1) {
                // If there's only one primitive, create a mesh directly
                const primitive = meshData.primitives[0];
                const geometry = this.createGeometry(primitive, gltf, buffers);
                const material = await this.createMaterial(primitive, gltf, buffers);
                const mesh = new Mesh(geometry, material, this.instances);
                obj = mesh;
            } else {
                // Multiple primitives: create a parent object and add each mesh as a child
                for (const primitive of meshData.primitives) {
                    const geometry = this.createGeometry(primitive, gltf, buffers);
                    const material = await this.createMaterial(primitive, gltf, buffers);
                    const mesh = new Mesh(geometry, material, this.instances);
                    obj.add(mesh);
                }
            }
        }

        if (nodeData.name) {
            obj.name = nodeData.name;
        }

        this.cache.set(nodeIndex, obj);

        if (nodeData.translation) obj.position.fromArray(nodeData.translation);
        if (nodeData.rotation) obj.quaternion.fromArray(nodeData.rotation);
        if (nodeData.scale) obj.scale.fromArray(nodeData.scale);

        if (nodeData.matrix) {
            obj.matrix.fromArray(nodeData.matrix);
            obj.matrix.compose(obj.position, obj.quaternion, obj.scale);
        }

        if (nodeData.children) {
            for (const childIndex of nodeData.children) {
                const child = await this.parseNode(gltf, buffers, childIndex);
                if (child) {
                    obj.add(child);
                }
            }
        }

        return obj;
    }
    // Made createMaterial async to handle asynchronous texture loading
    async createMaterial(primitive: any, gltf: any, buffers: any) {
        if (primitive.material !== undefined && this.materialCache.has(primitive.material)) {
            return this.materialCache.get(primitive.material)!; // Use cached material
        }

        let material = new StandardMaterial();
        try {
            if (primitive.material !== undefined) {
                const gltfMaterial = gltf.materials[primitive.material];
                const pbr = gltfMaterial.pbrMetallicRoughness || {};

                if (pbr.baseColorTexture !== undefined) {
                    const texture = await this.loadTexture(gltf, buffers, pbr.baseColorTexture.index);
                    material.diffuse_map?.setTexture(texture);
                }

                // TODO
                // if (pbr.metallicRoughnessTexture !== undefined) {
                //     const texture = await this.loadTexture(gltf, buffers, pbr.metallicRoughnessTexture.index);
                //     material.setTexture('metallicRoughness_map', texture);
                // }
                
                if (pbr.baseColorFactor !== undefined) {
                    material.diffuse.fromArray(pbr.baseColorFactor);
                }
                if (pbr.metallicFactor !== undefined) {
                    material.metalness = pbr.metallicFactor;
                }
                if (pbr.roughnessFactor !== undefined) {
                    material.roughness = pbr.roughnessFactor;
                }

                this.materialCache.set(primitive.material, material); // Cache material
            }
        } catch (e) {
            console.error(e);
        }
        return material;
    }


    async loadTexture(gltf: any, buffers: any, textureIndex: number) {
        const textureToImageMap = gltf.textures[textureIndex];
        const imageDef = gltf.images[textureToImageMap.source];
        const bufferView = gltf.bufferViews[imageDef.bufferView];
        const buffer = buffers[bufferView.buffer];
        const slice = buffer.arrayBuffer.slice(buffer.byteOffset + bufferView.byteOffset, buffer.byteOffset + bufferView.byteOffset + bufferView.byteLength);
        const blob = new Blob([slice], { type: imageDef.mimeType });
        const texture = await this.textureLoader.loadFromBlob(blob);
        return texture;
    }
    
     parseAccessor(gltf: any, buffers: any, accessorIndex: any) {
        let accessorDef;
        if (typeof accessorIndex === 'object') {
            accessorDef = accessorIndex;            
        }
        else {
            accessorDef = gltf.accessors[accessorIndex];
        }
         if (!accessorDef) {
            return null;
        }
        const bufferView = gltf.bufferViews[accessorDef.bufferView];
        const buffer = buffers[bufferView.buffer];
        const count = accessorDef.count;
        const numberOfComponents = COMPONENT_COUNT[accessorDef.type as keyof typeof COMPONENT_COUNT];
        const byteOffset = buffer.byteOffset + (accessorDef.byteOffset || 0) + bufferView.byteOffset;
        const TypedArray = COMPONENT_TYPES[accessorDef.componentType as keyof typeof COMPONENT_TYPES];
        let arrayByteLength = count * numberOfComponents * TypedArray.BYTES_PER_ELEMENT;
        let array = new TypedArray(buffer.arrayBuffer.slice(byteOffset, byteOffset + count * numberOfComponents * TypedArray.BYTES_PER_ELEMENT));

        if (arrayByteLength % 4 !== 0) {
            const size = Math.ceil(arrayByteLength / 4) * 4;
            const newArray = new TypedArray(size);
            newArray.set(array);
            array = newArray;
        }

        return array; 
     }
    
}
export { GLTFLoader };