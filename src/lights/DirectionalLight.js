import { Light } from './Light.js';
import { DirectionalLightShadow } from './DirectionalLightShadow.js';

class DirectionalLight extends Light {
    constructor(...args) {
        super(...args);
        this.isDirectionalLight = true;
        this.lightType = 'DirectionalLight';
        this.rotation._onChange(() => {
            this.quaternion.setFromEuler(this.rotation);
            this.rotationMatrix.setFromQuaternion(this.quaternion);
            this.updateMatrix();
            this._data.set(this.direction.data, 4);
            this.needsUpdate = true;
        });
        this.shadow = new DirectionalLightShadow();

        this._data = new Float32Array([
            ...this.color.data,
            ...this.direction.data,
            this.intensity,
            ...this.shadow.camera.projectionMatrix.data
        ])
        this.byteSize = this._data.byteLength;
    }
    
    updateMatrix() {
        super.updateMatrix();
        this.shadow.updateMatrices(this);
        this.quaternion.getForwardVector(this.direction);
        this._data.set(this.direction.data, 4);
        this._data.set(this.shadow.camera.projectionViewMatrix.data, 8);
    }
    
    updateMatrixWorld(force) {
        super.updateMatrixWorld(force);
        this.quaternion.getForwardVector(this.direction);
        this.shadow.updateMatrices(this);
        this._data.set(this.direction.data, 4);
        this._data.set(this.shadow.camera.projectionViewMatrix.data, 8);
    }
    
    lookAt(x, y, z) {
        super.lookAt(x, y, z);
        this.quaternion.getForwardVector(this.direction);
        this._data.set(this.direction.data, 4);
        this._data.set(this.shadow.projectionView.data, 8);
    }
    
    get data() {
        return this._data;
    }

}

export { DirectionalLight };