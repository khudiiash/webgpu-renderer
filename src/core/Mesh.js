import { Object3D } from './Object3D.js';

class Mesh extends Object3D {
    constructor(geometry, material) {
        super();
        this.isMesh = true;
        this.type = 'Mesh';
        this.geometry = geometry;
        this.material = material;
    }
}

export { Mesh };