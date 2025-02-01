import { ShaderLibrary } from './shaders/ShaderLibrary';
import { Material } from "./Material";
import { Color } from "../math/Color";
import { Texture } from "@/data/Texture";
import { UniformData } from "@/data/UniformData";
import { RenderState, RenderStateOptions } from "@/renderer/RenderState";
import { Texture2D } from "@/data/Texture2D";
import { Struct } from '@/data/Struct';
import { boolToNum } from '@/util/general';
import { Vector2 } from '@/math';


export interface StandardMaterialOptions extends RenderStateOptions {
    ambient?: string | number;
    diffuse?: string | number;
    specular?: string | number;
    emissive?: string | number;
    sheen?: string | number;
    ao?: string | number;
    opacity?: number;
    metalness?: number;
    roughness?: number;
    emissive_factor?: number;
    specular_factor?: number;
    alpha_test?: number;
    transmission?: number;
    uv_scale?: [number, number];
    height_scale?: number;
    invert_normal?: boolean;

    diffuse_map?: Texture;
    normal_map?: Texture;
    ao_map?: Texture;
    height_map?: Texture;
    specular_map?: Texture;
    emissive_map?: Texture;
    sheen_map?: Texture;
    metalness_map?: Texture;
    roughness_map?: Texture;
    alpha_map?: Texture;
    transmission_map?: Texture;

    useLight?: boolean;
    usePBR?: boolean;
    useGamma?: boolean;
    useFog?: boolean;
    useEmissive?: boolean;
}

class StandardMaterial extends Material {

    static struct = new Struct('StandardMaterial', {
        ambient: 'vec4f',
        diffuse: 'vec4f',
        specular: 'vec4f',
        emissive: 'vec4f',
        sheen: 'vec4f',
        ao: 'vec4f',
        opacity: 'f32',
        metalness: 'f32',
        roughness: 'f32',
        emissive_factor: 'f32',
        specular_factor: 'f32',
        alpha_test: 'f32',
        transmission: 'f32',

        height_scale: 'f32',
        uv_scale: 'vec2f',
        invert_normal: 'u32',

        useLight: 'u32',
        usePBR: 'u32',
        useEmissive: 'u32',
        useGamma: 'u32',
        useFog: 'u32',
    });

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
    transmission!: number;

    diffuse_map!: Texture;
    normal_map!: Texture;
    ao_map!: Texture;
    height_map!: Texture;
    specular_map!: Texture;
    emissive_map!: Texture;
    sheen_map!: Texture;
    metalness_map!: Texture;
    roughness_map!: Texture;
    alpha_map!: Texture;
    transmission_map!: Texture;

    constructor(options: StandardMaterialOptions = {}) {
        super();

        this.renderState = new RenderState({
            cullMode: options.cullMode || 'back',
            depthTest: options.depthTest ?? true,
            depthWrite: options.depthWrite ?? true,
            blending: options.blending || 'normal',
            transparent: options.transparent || false,
            depthCompare: options.depthCompare || 'less',
            topology: options.topology || 'triangle-list',
            frontFace: options.frontFace || 'ccw',
		}).onChange(() => {
            console.log(this.renderState);
            this.rebuild()
        }); 

        this.uniforms.set('StandardMaterial', new UniformData(this, { 
                name: 'StandardMaterial',
                struct: StandardMaterial.struct,
                isGlobal: false,
                values: {
                    ambient: new Color(options.ambient),
                    diffuse: new Color(options.diffuse),
                    specular: new Color(options.specular || '#FFFFFF'),
                    emissive: new Color(options.emissive || '#000000'),
                    sheen: new Color(options.sheen),
                    ao: new Color(options.ao),
                    opacity: options.opacity || 1.0,
                    metalness: options.metalness ?? 0.0,
                    roughness: options.roughness ?? 0.5,
                    emissive_factor: options.emissive_factor ?? 1.0,
                    specular_factor: options.specular_factor ?? 1.0,
                    alpha_test: options.alpha_test ?? 0.027,
                    transmission: options.transmission ?? 0.0,
                    uv_scale: options.uv_scale ? new Vector2(...options.uv_scale) : new Vector2(1, 1),
                    height_scale: options.height_scale ?? 0.1,
                    invert_normal: boolToNum(options.invert_normal, 0),

                    useLight: boolToNum(options.useLight, 1),
                    usePBR: boolToNum(options.usePBR, 1),
                    useEmissive: boolToNum(options.useEmissive, 1),
                    useGamma: boolToNum(options.useGamma, 1),
                    useFog: boolToNum(options.useFog, 1),

                    diffuse_map: options.diffuse_map || Texture2D.DEFAULT,
                    normal_map: options.normal_map || Texture2D.DEFAULT,
                    ao_map: options.ao_map || Texture2D.DEFAULT,
                    height_map: options.height_map || Texture2D.DEFAULT,
                    specular_map: options.specular_map || Texture2D.DEFAULT,
                    emissive_map: options.emissive_map || Texture2D.DEFAULT,
                    sheen_map: options.sheen_map || Texture2D.DEFAULT,
                    metalness_map: options.metalness_map || Texture2D.DEFAULT,
                    roughness_map: options.roughness_map || Texture2D.DEFAULT,
                    alpha_map: options.alpha_map || Texture2D.DEFAULT,
                    transmission_map: options.transmission_map || Texture2D.DEFAULT,
                }
            })
        );

        this.createShader(ShaderLibrary.STANDARD);
    }
}

export { StandardMaterial };