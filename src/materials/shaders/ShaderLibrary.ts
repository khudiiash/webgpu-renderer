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
        if (!this.#instance) {
            this.#instance = new ShaderLibrary();
        }
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
                { name: 'tangent', type: 'vec3f' },
                { name: 'bitangent', type: 'vec3f' },
            ],
            varyings: [
                { name: 'vPosition', type: 'vec3f' },
                { name: 'vNormal', type: 'vec3f' },
                { name: 'vPositionW', type: 'vec3f' },
                { name: 'vNormalW', type: 'vec3f' },
                { name: 'vUv', type: 'vec2f' },
                { name: 'vTangent', type: 'vec3f' },
                { name: 'vBitangent', type: 'vec3f' },
                { name: 'vTangentW', type: 'vec3f' },
                { name: 'vBitangentW', type: 'vec3f' },
            ],
            chunks: ['Mesh', 'StandardMaterial'],
            vertexTemplate: `
                @vertex(input) -> output {
                    var position: vec3f = input.position;
                    var normal: vec3f = input.normal;
                    var uv: vec2f = input.uv;
                    var tangent: vec3f = input.tangent;
                    var bitangent: vec3f = input.bitangent;
                    var worldPosition: vec3f;
                    var worldTangent: vec3f;
                    var worldBitangent: vec3f;
                    var worldNormal: vec3f;
                    var screenPosition: vec4f;

                    {{vertex}}

                    output.position = screenPosition;
                    output.vNormal = normal;
                    output.vNormalW = worldNormal;
                    output.vPosition = position;
                    output.vPositionW = worldPosition;
                    output.vUv = uv;
                    output.vTangent = input.tangent;
                    output.vBitangent = input.bitangent;
                    output.vTangentW = worldTangent;
                    output.vBitangentW = worldBitangent;
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