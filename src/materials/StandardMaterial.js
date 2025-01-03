import { ShaderLibrary } from "../renderer/new/shaders/ShaderLibrary";
import { Material } from "./Material";
import { SHADER_STAGE } from "../renderer/constants";
import { Color } from "../math/Color";
import { Shader } from "../renderer/new/shaders/Shader";
import { TextureLoader, Texture } from "../loaders/TextureLoader";
import { Matrix4 } from "../math/Matrix4";
import { UniformData } from "../renderer/new/UniformData";
import { RenderState } from "../renderer/new/RenderState";

class StandardMaterial extends Material {
    constructor(options = {}) {
        super();

        this.meshes = [];

        this.renderState = new RenderState({
			cullMode: options.cullMode || 'back',
			frontFace: options.frontFace || 'ccw',
			blend: options.blend || false,
			depthTest: options.depthTest || true,
			depthWrite: options.depthWrite || true,
			depthCompare: options.depthCompare || 'less',
			stencilTest: options.stencilTest || false,
			stencilFront: {},
			stencilBack: {},
		}); 

        this.uniforms = new UniformData({
            name: 'material',
            isGlobal: false,
            values: {
                ambient: new Color(options.ambient),
                diffuse: new Color(options.diffuse),
                specular: new Color(options.specular),
				emissive: new Color(options.emissive),
                sheen: new Color(options.sheen),
                opacity: options.opacity || 1.0,
                metalness: options.metalness || 0.0,
                roughness: options.roughness || 0.5,
                emissive_factor: options.emissiveFactor || 1.0,
                specular_factor: options.specularFactor || 1.0,
                alpha_test: options.alphaTest || 0.0,

                diffuse_map: options.diffuse_map || new Texture(),
            }
        });

        this.shader = Shader.create(ShaderLibrary.STANDARD, {
            USE_DIFFUSE_MAP: true,
            USE_GAMMA: true,
        });
    }
}

export { StandardMaterial };