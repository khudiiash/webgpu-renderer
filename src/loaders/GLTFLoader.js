import { GLTFLoader as GLTF } from '@loaders.gl/gltf';
import {load, parse} from '@loaders.gl/core';


import { Geometry } from '../geometry/Geometry.js';
import { Mesh } from '../core/Mesh.js';
import { InstancedMesh } from '../core/InstancedMesh.js';
import { MeshPhongMaterial } from '../materials/MeshPhongMaterial.js';
import { TextureLoader } from './TextureLoader.js';
import { Object3D } from '../core/Object3D.js';
import { Skeleton } from '../animation/Skeleton.js';
import { SkinnedMesh } from '../animation/SkinnedMesh.js';
import { AnimationClip, VectorKeyframeTrack, QuaternionKeyframeTrack, KeyframeTrack } from '../animation/AnimationClip.js';
import { Bone } from '../animation/Bone.js';
import { Matrix4 } from '../math/Matrix4.js';



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
    constructor(renderer) {
        if (GLTFLoader.instance) {
            return GLTFLoader.instance;
        }
        this.cache = new Map();
        this.textureLoader = new TextureLoader(renderer);
        GLTFLoader.instance = this;
    }
    
    async load(url, instances = 0) {
        this.cache.clear();
        this.instances = instances;
        this.data = await load(url, GLTF);
        const parsed = this.parse(this.data, instances);
        return parsed;
    }    
    
    async loadMesh(url, instances = 0) {
        this.cache.clear();
        this.instances = instances;
        this.data = await load(url, GLTF);
        const parsed = this.parseNode(this.data.json, this.data.buffers, 0);
        return parsed;
    }
    
      createGeometry(mesh, gltf, buffers) {
        const geometry = new Geometry();
        const primitive = mesh.primitives[0];
      
        const positions = this.parseAccessor(gltf, buffers, primitive.attributes.POSITION);
        const normals = this.parseAccessor(gltf, buffers, primitive.attributes.NORMAL);
        const uvs = this.parseAccessor(gltf, buffers, primitive.attributes.TEXCOORD_0);
        const indices = this.parseAccessor(gltf, buffers, primitive.indices);
        const joints = this.parseAccessor(gltf, buffers, primitive.attributes.JOINTS_0);
        const weights = this.parseAccessor(gltf, buffers, primitive.attributes.WEIGHTS_0);

        geometry.setFromArrays(indices, positions, normals, uvs, joints, weights);
        return geometry;        
      }
    
     createMaterial(mesh, gltf, buffers) {
         let material = new MeshPhongMaterial({ color: '#ffffff' });
         try {
            const primitive = mesh.primitives[0];
            if (primitive.material !== undefined) {
                  const gltfMaterial = gltf.materials[primitive.material];
                  const pbrMetallicRoughness = gltfMaterial.pbrMetallicRoughness;


                    if (pbrMetallicRoughness?.baseColorTexture !== undefined) {
                      const textureToImageMap = gltf.textures[pbrMetallicRoughness.baseColorTexture.index];
                      const image = gltf.images[textureToImageMap.source];
                      if (!image) {
                            return new MeshPhongMaterial({ color: '#ffffff' });
                      }
                      const bufferView = gltf.bufferViews[image.bufferView];
                      const buffer = buffers[bufferView.buffer];
                      const slice = buffer.arrayBuffer.slice(buffer.byteOffset + bufferView.byteOffset, buffer.byteOffset + bufferView.byteOffset + bufferView.byteLength);
                      const blob = new Blob([slice], { type: image.mimeType });
                      this.textureLoader.loadFromBlob(blob).then((texture) => {
                            material.diffuseMap = texture;
                      })
                  }
            }
         } catch(e) {
                console.error(e);
         }
         
         return material;
     }
    
     parse(data) {
        const gltf = data.json;
        const buffers = data.buffers;
        
        const scenes = this.parseScenes(gltf, buffers);
        const animations = this.parseAnimations(gltf, buffers);
        const scene = scenes[gltf.scene || 0];
        const instancedMeshes = scene.find(node => node.isInstancedMesh);
        
        return {
            scenes,
            animations,
            instancedMeshes,
            scene: scenes[gltf.scene || 0]
        };
    }
    
    parseScenes(gltf, buffers) {
        return gltf.scenes.map(scene => {
            const sceneObj = new Object3D();
            scene.nodes.forEach(nodeIndex => {
                const childObj = this.parseNode(gltf, buffers, nodeIndex);
                sceneObj.add(childObj);
            });
            return sceneObj;
        });
    }
    
    createSkeleton(nodeData, gltf, buffers) {
        const skinData = gltf.skins[nodeData.skin];
        const jointNodes = skinData.joints.map(jointIndex => this.parseNode(gltf, buffers, jointIndex));
        const bones = jointNodes.filter(node => node instanceof Bone);
        
        let inverseBindMatricesData = this.parseAccessor(gltf, buffers, skinData.inverseBindMatrices);
        let boneInverses = [];
        for (let i = 0; i < bones.length; i++) {
            const mat = new Matrix4().fromArray(inverseBindMatricesData, i * 16);
            boneInverses.push(mat);
        }
        
        const skeleton = new Skeleton(bones, boneInverses);
        return skeleton;
    }
    
    parseAnimations(gltf, buffers) {
        if (!gltf.animations) return [];
        return gltf.animations.map(animation => {
            const tracks = animation.channels.map(channel => {
                const sampler = animation.samplers[channel.sampler];
                const target = channel.target;
                const name = target.node !== undefined ? gltf.nodes[target.node].name : target.node;
                
                const inputAccessor = gltf.accessors[sampler.input];
                const outputAccessor = gltf.accessors[sampler.output];
                
                const times = this.parseAccessor(gltf, buffers, inputAccessor);
                const values = this.parseAccessor(gltf, buffers, outputAccessor);
                
                let TrackType;
                switch (target.path) {
                    case 'translation':
                    case 'scale':
                        TrackType = VectorKeyframeTrack;
                        break;
                    case 'rotation':
                        TrackType = QuaternionKeyframeTrack;
                        break;
                    default:
                        TrackType = KeyframeTrack;
                }
                
                return new TrackType(
                    name + '.' + target.path,
                    times,
                    values,
                    sampler.interpolation
                );
            });
            
            return new AnimationClip(animation.name, tracks);
        });
    } 
    
    isBone(nodeIndex) {
        return this.data.json.skins?.some( skin => skin.joints.includes(nodeIndex));
    }

    parseNode(gltf, buffers, nodeIndex) {
        if (this.cache.has(nodeIndex)) {
            return this.cache.get(nodeIndex);
        }
        const nodeData = gltf.nodes[nodeIndex];
        let obj;
        
        if (nodeData.mesh !== undefined) {
            const mesh = gltf.meshes[nodeData.mesh];
            const geometry = this.createGeometry(mesh, gltf, buffers);
            const material = this.createMaterial(mesh, gltf, buffers);
            
            if (nodeData.skin !== undefined) {
                obj = new SkinnedMesh(geometry, material, this.createSkeleton(nodeData, gltf, buffers));
            } else {
                obj = this.instances ? new InstancedMesh(geometry, material, this.instances) : new Mesh(geometry, material);
            }
        } else if (this.isBone(nodeIndex)) {
            obj = new Bone();
        } else {
            obj = new Object3D();
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
            nodeData.children.forEach(childIndex => {
                const child = this.parseNode(gltf, buffers, childIndex);
                if (child) {
                    obj.add(child);
                }
            });
        }
        
        return obj;
    }
    
     parseAccessor(gltf, buffers, accessorIndex) {
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
        const numberOfComponents = COMPONENT_COUNT[accessorDef.type];
        const byteOffset = buffer.byteOffset + (accessorDef.byteOffset || 0) + bufferView.byteOffset;
        const TypedArray = COMPONENT_TYPES[accessorDef.componentType];
        let arrayByteLength = count * numberOfComponents * TypedArray.BYTES_PER_ELEMENT;
        let array = new TypedArray(buffer.arrayBuffer, byteOffset, count * numberOfComponents);

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