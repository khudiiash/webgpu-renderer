import { ShaderLibrary, ShaderDefines } from './shaders/ShaderLibrary';
import { Material } from "./Material";
import { Color } from "../math/Color";
import { Shader } from "@/materials/shaders/Shader";
import { Texture } from "@/data/Texture";
import { UniformData } from "@/data/UniformData";
import { RenderState, RenderStateOptions } from "@/renderer/RenderState";
import { Texture2D } from "@/data/Texture2D";

interface StandardMaterialOptions {
    ambient?: string | number;
    diffuse?: string | number;
    specular?: string | number;
    emissive?: string | number;
    sheen?: string | number;
    opacity?: number;
    metalness?: number;
    roughness?: number;
    emissiveFactor?: number;
    specularFactor?: number;
    alphaTest?: number;
    diffuse_map?: Texture;
}

class StandardMaterial extends Material {

    renderState: RenderState;
    uniforms: UniformData;
    shader: Shader;
    ambient!: Color;
    diffuse!: Color;
    specular!: Color;
    emissive!: Color;
    sheen!: Color;
    opacity!: number;
    metalness!: number;
    roughness!: number;
    emissiveFactor!: number;
    specularFactor!: number;
    alphaTest!: number;
    diffuse_map!: Texture;

    constructor(options: RenderStateOptions & StandardMaterialOptions = {}) {
        super();

        this.meshes = [];

        this.renderState = new RenderState({
            cullMode: options.cullMode || 'back',
            depthTest: options.depthTest || true,
            depthWrite: options.depthWrite || true,
            blending: options.blending || 'normal',
            transparent: options.transparent || false,
            depthCompare: options.depthCompare || 'less',
            topology: options.topology || 'triangle-list',
            frontFace: options.frontFace || 'ccw',
		}); 

        this.uniforms = new UniformData(this, {
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

                diffuse_map: options.diffuse_map || Texture2D.DEFAULT,
            }
        });

        this.shader = Shader.create(ShaderLibrary.STANDARD, {
            USE_DIFFUSE_MAP: true,
            USE_LIGHTING: true,
            USE_GAMMA: true,
        });
    }
}

export { StandardMaterial };