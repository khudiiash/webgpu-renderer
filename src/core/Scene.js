import { Object3D }  from './Object3D.js';
import { Fog } from './Fog.js';
import { Color } from '../math/Color.js';
import { UniformLib } from '../renderer/shaders/UniformLib.js';
import { clamp } from '../math/MathUtils.js';

class Scene extends Object3D {
    constructor() {
        super();
        this.instances = new Map(); 
        this.isScene = true;
        this.name = 'Scene';
        this.cameras = [];
        this.directionalLights = [];
        this.pointLights = [];
        this.meshes = [];
        this.background = new Color(0.4, 0.5, 0.6, 1);

        this._needsUpdate = true;
        this._fog = new Fog({ color: this.background, start: 50, end: 200, density: 0.0025, type: Fog.LINEAR});
        this._ambientColor = new Color(1, 1, 1, 0.4);
        
        this.uniformGroup = UniformLib.scene.clone();

        this.uniformGroup.set('fog', this.fog);
        this.uniformGroup.set('ambientColor', this.ambientColor);
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
    
    get ambientColor() {
        return this._ambientColor;
    }

    set ambientColor(value) {
        this._ambientColor = value;
        this.uniformGroup.set('ambientColor', value);
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
    
    atmosphericLighting(light) {
        const direction = light.direction;
        // Normalize Y component to range [-1, 1]
        const normalizedY = Math.max(-1, Math.min(1, direction.y));
        
        // Define key points for color transition
        const nightColor = { r: 0.1, g: 0.2, b: 0.3 };
        const twilightColor = { r: 0.6, g: 0.5, b: 0.3 };
        const dayColor = { r: 0.5, g: 0.7, b: 1.0 };
        
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
        this.ambientColor.a = clamp(Math.max(0, light.direction.y), 0.2, 0.4);
        
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