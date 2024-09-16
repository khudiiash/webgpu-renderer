import { Object3D }  from './Object3D.js';

class Scene extends Object3D {
    constructor() {
        super();
        this.isScene = true;
        this.name = 'Scene';
        this.cameras = [];
        this.lights = [];
        this.meshes = [];
    }
    
    add(object) {
        super.add(object);
        if (object.isMesh) {
            this.meshes.push(object);
        }
        if (object.isLight) {
            this.lights.push(object);
        }
        if (object.isCamera) {
            this.camera = object;
        }
    }
}

export { Scene };