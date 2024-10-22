import { UniformGroup } from './UniformGroup';
import { Uniform } from './Uniform';
import { DirectionalLight } from '../../lights/DirectionalLight';
import { Fog } from '../../core/Fog';
import { Camera } from '../../cameras/Camera';
import { Wind } from '../../core/Wind';
import { LightShadow } from '../../lights/LightShadow';
import { USE } from '../constants';

class UniformLib {
    
    static model = new UniformGroup({
        name: 'model',
        bindGroup: 0,
        perMesh: true,
        visibility: GPUShaderStage.VERTEX,
        uniforms: [
            new Uniform('model').mat4()
        ]
    });
    
    static instances = () => new UniformGroup({
        name: 'instances',
        bindGroup: 0,
        perMesh: true,
        visibility: GPUShaderStage.VERTEX,
        type: 'storage',
        bufferType: 'storage',
        uniforms: [
            new Uniform('instances').storage('mat4x4f', 1)
        ]
    });

        
    
    static lightProjViewMatrix = new UniformGroup({
        name: 'lightProjViewMatrix',
        bindGroup: 0,
        visibility: GPUShaderStage.VERTEX,
        perMesh: false,
        use: USE.SHADOW,
        uniforms: [
            new Uniform('lightProjViewMatrix').mat4()
        ]
    });

    static camera = new UniformGroup({
        name: 'camera',
        use: USE.RENDER,
        bindGroup: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        perMesh: false,
        uniforms: [
            new Uniform('camera').struct('Camera', Camera.struct)
        ]
    });
    
    static time = new UniformGroup({
        name: 'time',
        bindGroup: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        perMesh: false,
        uniforms: [
            new Uniform('time').float(0)
        ]
    });
    
    static scene = new UniformGroup({
        name: 'scene',
        bindGroup: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        perMesh: false,
        use: USE.RENDER,
        uniforms: [
            new Uniform('fog').struct('Fog', Fog.struct),
            new Uniform('ambientLight').struct('AmbientLight', {
                color: 'vec4f',
                intensity: 'f32',
                _pad: 'f32',
                _pad2: 'f32',
                _pad3: 'f32',
            }),            
            new Uniform('directionalLights').structArray('DirectionalLight', DirectionalLight.struct, 4),
            new Uniform('directionalLightShadows').structArray('DirectionalLightShadow', LightShadow.struct, 4),
            new Uniform('directionalLightMatrices').mat4Array(4),
            new Uniform('directionalLightsNum').float(0),
            new Uniform('pointLightsNum').float(0),
            new Uniform('pad2').float(0),
        ]
    });
    
    
    static compose(material) {
        const uniformGroups = material.uniforms;
        let structs = '';
        let bindings = '';
        let bindingIndex = 0;

        for (const { name, uniforms } of Object.values(uniformGroups)) {
            structs += `struct ${name} {\n`;
            bindings += `@group(1) @binding(${bindingIndex}) var<uniform> ${name.toLowerCase()}: ${name};\n`;
            for (const key in uniforms) {
                const uniform = uniforms[key];
                if (!uniform.value) {
                    continue;
                }
                structs += `    ${key}: ${uniform.type},\n`;
            }
            structs += '}\n';
            bindingIndex++;
        }
        
        const result = `${structs}${bindings}`
        return result;
    }
    

}

export { UniformLib };