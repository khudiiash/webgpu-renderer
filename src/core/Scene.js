import { Object3D }  from './Object3D.js';
import { Fog } from './Fog.js';
import { Color } from '../math/Color.js';
import { UniformLib } from '../renderer/shaders/UniformLib.js';
import { clamp } from '../math/MathUtils.js';
import { Wind } from './Wind.js';
import { AmbientLight } from '../lights/AmbientLight.js';
import { UniformData } from '../renderer/new/UniformData.js';
import { UniformDataArray } from '../utils/UniformDataArray.js';

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
        const ambientColor = new Color(config.ambientColor || '#000000');

        const directionalLights = new UniformDataArray(8, 8).onChange(() => {
            this.uniforms.directionalLightsNum = directionalLights.size;
        });
        const pointLights = new UniformDataArray(8, 8).onChange(() => {
            this.uniforms.pointLightsNum = pointLights.size;
        });

        const fog = new Fog({ color: backgroundColor, start: 10, end: 50, density: 0.01, type: Fog.LINEAR });
        
        this.uniforms = new UniformData({
            name: 'scene',
            isGlobal: true,
            values: {
                fog, // 16 + 16 
                ambientColor: ambientColor, // 16 
                backgroundColor: backgroundColor, // 16

                time: 0, // 4
                frame: 0, // 4
                directionalLightsNum: 0, // 4
                pointLightsNum: 0, // 4 

                directionalLights, // 8 * 32
                pointLights, // 8 * 32
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
                this.directionalLights.add(object.uniforms)
            }
            if (object.isPointLight) {
                this.pointLights.push(object.uniforms);
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
    get time() { return this.uniforms.time; }
    get frame() { return this.uniforms.frame; }

    set fog(value) { this.uniforms.fog = value; }
    set ambientColor(value) { this.uniforms.ambientColor = value; }
    set backgroundColor(value) { this.uniforms.backgroundColor = value; }
    set directionalLights(value) { this.uniforms.directionalLights = value; }
    set time(value) { this.uniforms.time = value; }
    set frame(value) { this.uniforms.frame = value; }
}

export { Scene };