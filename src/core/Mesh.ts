import { UniformData } from '@/data';
import { Object3D, Geometry, Material } from '.'
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

        this.uniforms = new UniformData({
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
}

export { Mesh };