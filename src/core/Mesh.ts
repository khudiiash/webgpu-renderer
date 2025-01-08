import { UniformData } from '@/data';
import { Object3D } from '.'
import { Geometry } from '@/geometry';
import { Material } from '@/materials';
import { uuid } from '@/util';

class Mesh extends Object3D {
    public geometry: Geometry;
    public material: Material;
    public id: string = uuid('mesh');
    public uniforms: UniformData;

    protected isMesh: boolean = true;
    protected type: string = 'mesh';

    constructor(geometry: Geometry, material: Material) {
        super();
        this.geometry = geometry;
        this.material = material;
        material.meshes.push(this);

        this.uniforms = new UniformData(this, {
            name: 'model',
            isGlobal: false,
            values: {
                matrixWorld: this.matrixWorld
            }
        })
    }

    setMaterial(material: Material) {
        this.material = material;
    }

    setGeometry(geometry: Geometry) {
        this.geometry = geometry;
    }

    copy(source: Mesh) {
        super.copy(source);
        this.geometry = source.geometry;
        this.material = source.material;
        return this;
    }
}

export { Mesh };