import { ShaderLibrary, ShaderDefines } from './shaders/ShaderLibrary';
import { Material } from "./Material";
import { Color } from "../math/Color";
import { Shader } from "@/materials/shaders/Shader";
import { Texture } from "@/data/Texture";
import { UniformData } from "@/data/UniformData";
import { RenderState, RenderStateOptions } from "@/renderer/RenderState";
import { Texture2D } from "@/data/Texture2D";
import { ObjectMonitor } from '@/data/ObjectMonitor';

interface StandardMaterialOptions {
    ambient?: string | number;
    diffuse?: string | number;
    specular?: string | number;
    emissive?: string | number;
    sheen?: string | number;
    opacity?: number;
    metalness?: number;
    roughness?: number;
    emissive_factor?: number;
    specular_factor?: number;
    alpha_test?: number;
    diffuse_map?: Texture;

    useLight?: boolean;
    useShadow?: boolean;
    useFog?: boolean;
    useGamma?: boolean;
}

class StandardMaterial extends Material {

    ambient!: Color;
    diffuse!: Color;
    specular!: Color;
    emissive!: Color;
    sheen!: Color;
    opacity!: number;
    metalness!: number;
    roughness!: number;
    emissive_factor!: number;
    specular_factor!: number;
    alpha_test!: number;
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
                emissive_factor: options.emissive_factor || 1.0,
                specular_factor: options.specular_factor || 1.0,
                alpha_test: options.alpha_test || 0.0,

                diffuse_map: options.diffuse_map || Texture2D.DEFAULT,
            }
        });

        this.defines = new ObjectMonitor({
            USE_LIGHT: options.useLight ?? true,
            USE_SHADOW: options.useShadow ?? true,
            USE_FOG: options.useFog ?? true,
            USE_GAMMA: options.useGamma ?? true,
        }).onChange(() => {
            this.createShader();
        });

        this.createShader(ShaderLibrary.STANDARD);
    }
}

export { StandardMaterial };