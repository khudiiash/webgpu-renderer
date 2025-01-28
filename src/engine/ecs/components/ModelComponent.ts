import { Component } from '../core/Component';
import { Material } from '@/materials/Material';
import { ShaderChunk } from '@/materials/shaders/ShaderChunk';
import { Object3D } from '@/core';
import { Geometry } from '@/geometry';
import { Mesh } from '@/core';
import { SphereGeometry } from '@/geometry';
import { BoxGeometry } from '@/geometry';
import { PlaneGeometry } from '@/geometry';
import { rand } from '@/util'

export class ModelComponent extends Component {
   object?: Object3D;
   material?: Material;
   properties: any = {};

   async deserialize(data: any) {

        //console.log('ModelComponent deserialize - Input:', data);
        this.properties = data.properties || {};

        // instances
        const instanceCount = parseInt(data.instanceCount) || 1;
        const rangeX = data.rangeX;
        const rangeZ = data.rangeZ;

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
    
        if (data.geometry) {
            //console.log('Loading geometry type:', data.geometry);
            switch (data.geometry) {
                case 'gltf':
                    if (data.path) {
                        const GLTFLoader = (await import('@/util/loaders/GLTFLoader')).GLTFLoader;
                        this.object = await GLTFLoader.loadMesh(data.path);
                    }
                    
                    break;
                case 'triangle':
                    const geometry = new Geometry();
                    geometry.setFromArrays(data.geometryData);
                    
                    this.object = new Mesh(geometry, this.material, instanceCount);
                    
                    (this.object as Mesh).setAllPositions(
                        Array.from({ length: instanceCount }, () => 
                            [rand(-rangeX, rangeX), 0, rand(-rangeZ, rangeZ)]).flat()
                    );
                    
                    (this.object as Mesh).setAllScales(
                        Array.from({ length: instanceCount }, () => 
                            [rand(0.3, 0.5), rand(1, 4), 1]).flat()
                    );
                    
                    (this.object as Mesh).setAllRotations(
                        Array.from({ length: instanceCount }, () => 
                            [0, -Math.PI / 2, 0]).flat()
                    );
                    
                    break;
                case 'sphere':
                    this.object = new Mesh(new SphereGeometry(2), this.material);

                    break;
                case 'box':
                    const size = data.size || { x: 1, y: 1, z: 1 };
                    this.object = new Mesh(new BoxGeometry(size.x, size.y, size.z), this.material);

                    break;
                case 'plane':
                    this.object = new Mesh(new PlaneGeometry(1, 1), this.material, instanceCount);

                    (this.object as Mesh).setAllPositions(
                        Array.from({ length: instanceCount }, () => 
                            [rand(-rangeX, rangeX), rand(0, 100), rand(-rangeZ, rangeZ)]).flat()
                    );
                    
                    (this.object as Mesh).setAllScales(rand(0.15, 0.3));
                    
                    (this.object as Mesh).setAllRotations(
                        Array.from({ length: instanceCount }, (_, i) => [0, -Math.PI / 2, 0]).flat()
                    );
                    break;    
                
                    break;
            }
        }
    }
}