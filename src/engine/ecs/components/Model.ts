import { Component } from '../core/Component';
//import { Geometry } from '@/geometry/Geometry';
import { Material } from '@/materials/Material';
import { ShaderChunk } from '@/materials/shaders/ShaderChunk';
import { Object3D } from '@/core';

export class Model extends Component {
    object?: Object3D;
    //geometry?: Geometry;
    material?: Material;
    properties: any = {};
    
    async deserialize(data: any) {
        this.properties = data.properties || {};

        if (data.geometry) {
            switch (data.geometry) {
                case 'gltf':
                    if (data.path) {
                        const GLTFLoader = (await import('@/util/loaders/GLTFLoader')).GLTFLoader;
                        this.object = await GLTFLoader.loadMesh(data.path);
                    }
                    break;
            }
        }

        if (data.material) {
            const StandardMaterial = (await import('@/materials/StandardMaterial')).StandardMaterial;
            this.material = new StandardMaterial(data.material.properties);

            if (data.material.shader) {
                const shader = new ShaderChunk(
                    data.material.shader.name,
                    data.material.shader.code
                );
                this.material.addChunk(shader);
            }
        }
    }
}