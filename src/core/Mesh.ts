import { Object3D, Geometry, Material } from '.'
import { id } from '@/util';

class Mesh extends Object3D {
    public geometry: Geometry;
    public material: Material;
    public id: string = id();
    protected isMesh: boolean = true;
    protected type: string = 'mesh';

    constructor(geometry: Geometry, material: Material) {
        super();
        this.geometry = geometry;
        this.material = material;
        material.meshes.push(this);
    }

    setMaterial(material: Material) {
        this.material = material;
    }

    setGeometry(geometry: Geometry) {
        this.geometry = geometry;
    }
}

export { Mesh };