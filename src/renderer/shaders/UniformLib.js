import { Color } from '../../math/Color';
import { UniformUtils } from './UniformUtils';
import { UniformGroup } from './UniformGroup';
import { Uniform } from './Uniform';
import { ShaderValueType } from '../utils/ShaderValueType';
import { GPUType } from '../utils/Constants';
import { Struct } from './Struct';

class UniformLib {
    static get generic() {
        return new UniformGroup({
            name: 'generic',
            uniforms: [
                new Uniform('color').color(new Color(0xffffff)),
                new Uniform('tint').color(new Color(0xffffff)),
                new Uniform('opacity').float(1.0),
            ],
            visibility: GPUShaderStage.FRAGMENT,
            resource: { buffer: { type: 'uniform' } },
            varyings: [],
        })
    }
    
    static fog = new UniformGroup({
        name: 'fog',
        uniforms: [
            new Uniform('fogDensity').float(0.012),
            new Uniform('fogNear').float(50),
            new Uniform('fogFar').float(110),
            new Uniform('_padding').float(0),
            new Uniform('fogColor').color(new Color(0.4, 0.4, 0.7)),
        ],
        visibility: GPUShaderStage.FRAGMENT,
        resource: { buffer: { type: 'uniform' } },
    })
    
    
    static lights = new UniformGroup({
            name: 'lights',
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            uniforms: [
                new Uniform('ambientLightColor').color(new Color(1, 1, 1, )),
                new Uniform('directionalLights').structArray(
                    [],
                    new Struct('DirectionalLight', [
                        new ShaderValueType('color', GPUType.Vec4f), 
                        new ShaderValueType('direction', GPUType.Vec3f),
                        new ShaderValueType('intensity', GPUType.Float),
                        new ShaderValueType('projection', GPUType.Mat4x4f),
                    ]),
                    4
                ),
            ],
            resource: { buffer: { type: 'uniform' } },
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
                structs += `    ${key}: ${UniformUtils.getValueFormat(uniform.value)},\n`;
            }
            structs += '}\n';
            bindingIndex++;
        }
        
        const result = `${structs}${bindings}`
        return result;
    }
    

}

export { UniformLib };