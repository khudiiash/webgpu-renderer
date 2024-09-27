import { Light } from './Light.js';
import { DirectionalLightShadow } from './DirectionalLightShadow.js';

class DirectionalLight extends Light {
    static struct = {
        color: 'vec4f',
        direction: 'vec3f',
        intensity: 'f32',
    }

    constructor(...args) {
        super(...args);
        this.isDirectionalLight = true;
        this.lightType = 'DirectionalLight';
        this.buffer = 'scene';
        this.rotation.onChange(() => {
            this.quaternion.setFromEuler(this.rotation);
            this.rotationMatrix.setFromQuaternion(this.quaternion);
            this.updateMatrix();
            this.needsUpdate = true;
        });
        this.shadow = new DirectionalLightShadow();
        this.offsets = new Map();
        this.offsets.set(this.color, 0);
        this.offsets.set(this.direction, 4);
        this.offsets.set(this.intensity, 7);

        this._data = new Float32Array([
            ...this.color.data,
            ...this.direction.data,
            this.intensity,
        ])
        this.byteSize = this._data.byteLength;
    }
    
    updateMatrix() {
        super.updateMatrix();
        this.quaternion.getForwardVector(this.direction);
        this.shadow.updateMatrices(this);
    }
    
    updateMatrixWorld(force) {
        super.updateMatrixWorld(force);
        this.shadow.updateMatrices(this);
        this.quaternion.getForwardVector(this.direction);
        if (!this.direction.equalsArray(this._data, this.offsets.get(this.direction))) { 
            this._data.set(this.direction.data, this.offsets.get(this.direction));
            this.write(this._data, 'directionalLights'); 
        }
    }
    
    lookAt(x, y, z) {
        super.lookAt(x, y, z);
        this.quaternion.getForwardVector(this.direction);
        this._data.set(this.direction.data, 4);
        if (!this.direction.equalsArray(this._data, 4)) { 
            this._data.set(this.direction.data, 4);
            this.write(this._data, 'directionalLights'); 
        }
    }
    
    get data() {
        return this._data;
    }

}

export { DirectionalLight };