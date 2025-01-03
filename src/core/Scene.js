import { Object3D }  from './Object3D.js';
import { Fog } from './Fog.js';
import { Color } from '../math/Color.js';
import { UniformLib } from '../renderer/shaders/UniformLib.js';
import { clamp } from '../math/MathUtils.js';
import { Wind } from './Wind.js';
import { AmbientLight } from '../lights/AmbientLight.js';
import { ProxyArray } from '../utils/ProxyArray.js';
import { UniformData } from '../renderer/new/UniformData.js';

class Scene extends Object3D {
    constructor(config = {}) {
        super();
        this.instances = new Map(); 
        this.isScene = true;
        this.name = 'Scene';
        this.type = 'scene';
        this.cameras = [];
        this.meshes = [];
        const backgroundColor = new Color(config.backgroundColor || '#000000');
        const ambientColor = new Color(config.ambientColor || '#ffffff');

        const directionalLights = new ProxyArray(new Array(4), (target) => {
            this.uniforms.directionalLights = target;
            this.uniforms.directionalLightsNum = target.length;
            this.uniforms.directionalLightMatrices = target.map((light) => light.shadow.projectionViewMatrix);
        });

        const pointLights = new ProxyArray(new Array(10), (target) => {
            this.uniforms.pointLights = target;
            this.uniforms.pointLightsNum = target.length;
        });

        const fog = new Fog({ color: backgroundColor, start: 1, end: 50, density: 0.01, type: Fog.LINEAR });
        
        this.uniforms = new UniformData({
            name: 'scene',
            isGlobal: true,
            values: {
                directionalLights,
                directionalLightsNum: 0,
                pointLights,
                pointLightsNum: 0,
                ambientColor: ambientColor,
                backgroundColor: backgroundColor,
                fog,
            }
        })
    }
    
    add(object) {
        if (!object?.isObject3D) return;
        super.add(object);
        if (object.isMesh) {
            this.meshes.push(object);
        }
        if (object.isLight) {
            if (object.isDirectionalLight) {
                this.directionalLights.push(object);
            }
            if (object.isPointLight) {
                this.pointLights.push(object);
            }
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
    
    get fog() { return this.uniforms.fog; }
    get ambientColor() { return this.uniforms.ambientColor; }
    get backgroundColor() { return this.uniforms.backgroundColor; }
    get directionalLights() { return this.uniforms.directionalLights; }

    set fog(value) { this.uniforms.fog = value; }
    set ambientColor(value) { this.uniforms.ambientColor = value; }
    set backgroundColor(value) { this.uniforms.backgroundColor = value; }
    set directionalLights(value) { this.uniforms.directionalLights = value; }
}

export { Scene };