import { ShaderChunk } from './ShaderChunk.js';
import * as chunks from './chunks/index';

export type ShaderVarying = {
    name: string;
    type: string;
    location?: number;
    interpolate?: { type: 'flat' | 'perspective' | 'linear', sampling?: 'center' | 'centroid' | 'sample' | 'first' | 'either' }
}

export type ShaderAttribute = {
    name: string;
    type: string;
    location?: number;
}

export type ShaderDefines = {
    [key: string]: boolean
};

export type ShaderConfig = {
    name: string;
    attributes: ShaderAttribute[];
    varyings: ShaderVarying[];
    chunks: string[];
    vertexTemplate: string;
    fragmentTemplate: string;
}

export class ShaderLibrary {
    static init() {
        const lib = new ShaderLibrary();
        for (const [name, code] of Object.entries(chunks)) {
            new ShaderChunk(name, code);
        }
    }
    static #instance: ShaderLibrary;
    public chunks!: Map<string, ShaderChunk>;

    constructor() {
        if (ShaderLibrary.#instance) {
            return ShaderLibrary.#instance;
        }
        this.chunks = new Map(); 
        ShaderLibrary.#instance = this;
    }

    static addChunk(chunk: ShaderChunk) {
        this.#instance.addChunk(chunk);
    }

    static getChunk(name: string) {
        return this.#instance.chunks.get(name);
    }

    static getInstance() {
        if (!ShaderLibrary.#instance) {
            throw new Error('ShaderLibrary has not been initialized');
        }
        return ShaderLibrary.#instance;
    }

    static get STANDARD(): ShaderConfig {
        return {
            name: 'standard',
            attributes: [
                { name: 'position', type: 'vec3f' },
                { name: 'normal', type: 'vec3f' },
                { name: 'uv', type: 'vec2f' },
            ],
            varyings: [
                { name: 'vPosition', type: 'vec3f' },
                { name: 'vNormal', type: 'vec3f' },
                { name: 'vPositionW', type: 'vec3f' },
                { name: 'vNormalW', type: 'vec3f' },
                { name: 'vUv', type: 'vec2f' },
            ],
            chunks: ['common', 'noise', 'scene', 'camera', 'model', 'diffuse', 'diffuse_map', 'standard_material', 'pbr', 'gamma', 'emission', 'fog'],
            vertexTemplate: `
                @vertex(input) -> output {
                    var position: vec3f = input.position;
                    var normal: vec3f = input.normal;
                    var uv: vec2f = input.uv;
                    var worldPosition: vec3f;
                    var screenPosition: vec4f;
                    var worldNormal: vec3f;

                    {{vertex}}

                    output.position = screenPosition;
                    output.vNormal = normal;
                    output.vNormalW = worldNormal;
                    output.vPosition = position;
                    output.vPositionW = worldPosition;
                    output.vUv = uv;
                    return output;
                }
            `,
            fragmentTemplate: `
                @fragment(input) -> output {
                    var color: vec4f;

                    {{fragment}}

                    output.color = color;
                    return output;
                }
            `
        }
    }

    // Add a new shader chunk to the library
    addChunk(chunk: ShaderChunk) {
        if (!(chunk instanceof ShaderChunk)) {
            throw new Error('ShaderLibrary: Invalid chunk');
        }
        this.chunks.set(chunk.name, chunk);
    }
}