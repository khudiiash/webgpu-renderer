import { Object3D }  from './Object3D.js';
import { Fog } from './Fog.js';
import { Color } from '../math/Color.js';
import { UniformLib } from '../renderer/shaders/UniformLib.js';
import { AmbientLight } from '../lights/AmbientLight.js';

class Scene extends Object3D {
    constructor() {
        super();
        this.isScene = true;
        this.name = 'Scene';
        this.cameras = [];
        this.directionalLights = [];
        this.pointLights = [];
        this.meshes = [];

        this._needsUpdate = true;
        this._fog = new Fog({ color: new Color(0.0, 0.05, 0.1, 1), start: 10, end: 180, density: 0.0025, type: Fog.LINEAR});
        this._ambientLight = new Color(1, 1, 1, 0.5);

        this.uniformGroup = UniformLib.scene.clone();

        this.uniformGroup.set('fog', this.fog);
        this.uniformGroup.set('ambientLight', this.ambientLight);
        this._data = new Float32Array(this.uniformGroup.byteSize / 4);
    }
    
    get fog() {
        return this._fog;
    }
    
    set fog(value) {
        this._fog = value;
        this.uniformGroup.set('fog', value);
        this.updateData();
    }
    
    get ambientLight() {
        return this._ambientLight;
    }

    set ambientLight(value) {
        this._ambientLight = value;
        this.uniformGroup.set('ambientLight', value);
        this.updateData();
    }
    
    get needsUpdate() {
        return this._needsUpdate;
    }
    
    set needsUpdate(value) {    
        this._needsUpdate = value;
    }
    
    add(object) {
        super.add(object);
        if (object.isMesh) {
            this.meshes.push(object);
        }
        if (object.isLight) {
            if (object.isDirectionalLight) {
                this.directionalLights.push(object);
                object.shadow.updateMatrices(object);
                this.uniformGroup.set('directionalLights', this.directionalLights);
                this.uniformGroup.set('directionalLightsNum', this.directionalLights.length);
                this.uniformGroup.set('directionalLightMatrices', this.directionalLights.map((light) => light.shadow.projectionViewMatrix));
            }
            if (object.isPointLight) {
                this.pointLights.push(object);
                this.uniformGroup.set('pointLights', this.pointLights);
                this.uniformGroup.set('pointLightsNum', this.pointLights.length);
            }
            this.updateData();
        }
        if (object.isCamera) {
            this.camera = object;
        }
    }
    
    remove(object) {
        super.remove(object);
        if (object.isMesh) {
            const index = this.meshes.indexOf(object);
            this.meshes.splice(index, 1);
        }
        if (object.isLight) {
            const index = this.lights.indexOf(object);
            this.lights.splice(index, 1);
        }
        if (object.isCamera) {
            this.camera = null;
        }
    }
    
    
    updateData() {
        let offset = 0;
        this.uniformGroup.uniforms.forEach((uniform) => {
            uniform.bufferOffset = offset;
            this._data.set(uniform.data, offset);
            offset += uniform.data.length;
        });
        this.needsUpdate = true;
    }
    
    get data() {
        return this._data;
    }
     
}

export { Scene };