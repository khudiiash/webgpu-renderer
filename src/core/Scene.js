import { Object3D }  from './Object3D.js';
import { Fog } from './Fog.js';
import { Color } from '../math/Color.js';
import { UniformLib } from '../renderer/shaders/UniformLib.js';
import { clamp } from '../math/MathUtils.js';
import { Wind } from './Wind.js';

class Scene extends Object3D {
    constructor() {
        super();
        this.instances = new Map(); 
        this.isScene = true;
        this.name = 'Scene';
        this.type = 'scene';
        this.cameras = [];
        this.directionalLights = [];
        this.pointLights = [];
        this.meshes = [];
        this.background = new Color(0.2, 0.3, 0.4, 1);

        this._needsUpdate = true;
        this._fog = new Fog({ color: this.background, start: 50, end: 200, density: 0.01, type: Fog.LINEAR});
        this._wind = new Wind(); 
        this._ambientColor = new Color(1, 1, 1, 0.2);
        
        this.uniformGroup = UniformLib.scene.clone();

        this.offsets = this.uniformGroup.offsets;
        this.byteOffsets = this.uniformGroup.byteOffsets;

        this._data = new Float32Array(this.uniformGroup.byteSize / Float32Array.BYTES_PER_ELEMENT);
        this._data.set(this._fog.data, this.offsets.fog);
        this._data.set(this._wind.data, this.offsets.wind);
        this._data.set(this._ambientColor.data, this.offsets.ambientColor);
    }
    
    get fog() {
        return this._fog;
    }
    
    set fog(value) {
        this._fog = value;
    }
    
    get wind() {
        return this._wind;
    }
    
    get ambientColor() {
        return this._ambientColor;
    }

    set ambientColor(value) {
        this._ambientColor = value;
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
                this.updateDirectionalLight(object);
                object.on('write', () => {
                    this.updateDirectionalLight(object);
                })
            }
            if (object.isPointLight) {
                this.pointLights.push(object);
            }
        }
        if (object.isCamera) {
            this.camera = object;
        }
    }
    
    updateDirectionalLight(light) {
        const index = this.directionalLights.findIndex((l) => l === light);
        this._data.set(light.data, this.offsets['directionalLights'] + light.data.length * index);
        this._data.set(light.shadow.data, this.offsets['directionalLightShadows'] + light.shadow.data.length * index);
        this._data.set(light.shadow.projectionViewMatrix.data, this.offsets['directionalLightMatrices'] + light.shadow.projectionViewMatrix.data.length * index);
        this._data.set(new Float32Array([this.directionalLights.length]), this.offsets['directionalLightsNum']);

        this.write(this._data, 'scene');
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
    
    atmosphericLighting(light) {
        const direction = light.direction;
        // Normalize Y component to range [-1, 1]
        const normalizedY = Math.max(-1, Math.min(1, direction.y));
        
        // Define key points for color transition
        const nightColor = { r: 0.1, g: 0.2, b: 0.3 };
        const twilightColor = { r: 0.6, g: 0.5, b: 0.6 };
        const dayColor = { r: 0.7, g: 0.8, b: 1.0 };
        
        let r, g, b;
        
        // Smooth transition function
        const smoothstep = (edge0, edge1, x) => {
            const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
            return t * t * (3 - 2 * t);
        };
        
        if (normalizedY < -0.2) {
            // Night
            const t = smoothstep(-1, -0.2, normalizedY);
            r = nightColor.r + (twilightColor.r - nightColor.r) * t;
            g = nightColor.g + (twilightColor.g - nightColor.g) * t;
            b = nightColor.b + (twilightColor.b - nightColor.b) * t;
        } else if (normalizedY < 0.2) {
            // Twilight (evening or morning)
            const t = smoothstep(-0.2, 0.2, normalizedY);
            r = twilightColor.r + (dayColor.r - twilightColor.r) * t;
            g = twilightColor.g + (dayColor.g - twilightColor.g) * t;
            b = twilightColor.b + (dayColor.b - twilightColor.b) * t;
        } else {
            // Day
            const t = smoothstep(0.2, 1, normalizedY);
            r = dayColor.r;
            g = dayColor.g;
            b = dayColor.b;
            // Slightly adjust for sun position
            r += (1 - r) * 0.2 * t;
            g += (1 - g) * 0.1 * t;
            b += (1 - b) * 0.1 * t;
        }
        
        // Add a subtle yellow-orange glow near the horizon
        const horizonGlow = Math.exp(-Math.abs(normalizedY) * 5) * 0.3;
        r += horizonGlow * 0.3;
        g += horizonGlow * 0.2;
        
        // Ensure colors are in [0, 1] range
        r = Math.max(0, Math.min(1, r));
        g = Math.max(0, Math.min(1, g));
        b = Math.max(0, Math.min(1, b));
        this.ambientColor.a = clamp(Math.max(0, light.direction.y), 0.0, 0.2);
        
        // Set the background color
        this.background.set(r, g, b);
    }
    
    updateData() {
        let offset = 0;
        const mainDirectionalLight = this.directionalLights[0];
        if (mainDirectionalLight) {
            this.atmosphericLighting(mainDirectionalLight);
        }
        this.uniformGroup.set('directionalLights', this.directionalLights);
        this.uniformGroup.set('directionalLightsNum', this.directionalLights.length);
        this.uniformGroup.set('directionalLightMatrices', this.directionalLights.map((light) => light.shadow.projectionViewMatrix));
        this.uniformGroup.set('ambientColor', this.ambientColor);
        this.fog.color = this.background;
        this.uniformGroup.set('fog', this.fog);
        
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