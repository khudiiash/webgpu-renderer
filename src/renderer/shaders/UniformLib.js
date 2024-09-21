import { UniformGroup } from './UniformGroup';
import { Uniform } from './Uniform';
import { DirectionalLight } from '../../lights/DirectionalLight';
import { Fog } from '../../core/Fog';
import { Camera } from '../../cameras/Camera';

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

    static camera = new UniformGroup({
        name: 'camera',
        bindGroup: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        perMesh: false,
        uniforms: [
            new Uniform('camera').struct('Camera', Camera.struct)
        ]
    });

    static scene = new UniformGroup({
        name: 'scene',
        bindGroup: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        perMesh: false,
        uniforms: [
            new Uniform('fog').struct('Fog', Fog.struct),
            new Uniform('ambientColor').color(),            
            new Uniform('directionalLights').structArray('DirectionalLight', DirectionalLight.struct, 4),
            new Uniform('directionalLightShadows').structArray('DirectionalLightShadow', {
                shadowIntensity: 'f32',
                shadowBias: 'f32',
                shadowNormalBias: 'f32',
                shadowRadius: 'f32',
            }, 4),
            
            new Uniform('directionalLightMatrices').mat4Array(4),
            
            // new Uniform('pointLights').structArray('PointLight', {
            //     color: 'vec4f',
            //     position: 'vec3f',
            //     intensity: 'f32',
            // }, 12),
            
            // new Uniform('pointLightShadows').structArray('PointLightShadow', {
            //     shadowIntensity: 'f32',
            //     shadowBias: 'f32',
            //     shadowNormalBias: 'f32',
            //     shadowRadius: 'f32',
            // }, 12),
                

            new Uniform('directionalLightsNum').float(0),
            new Uniform('pointLightsNum').float(0),
            new Uniform('pad1').float(0),
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