import { ShaderChunk } from './ShaderChunk.js';
import * as chunks from './chunks/index';

export type ShaderVarying = {
    name: string;
    type: string;
    location?: number;
    interpolate?: { type: string, sampling: string };
}

export type ShaderAttribute = {
    name: string;
    type: string;
    location?: number;
}

export type ShaderBuiltin = {
    name: string;
    type: string;
}

export type ShaderDefines = {
    [key: string]: boolean
};

export type ShaderConfig = {
    name: string;
    attributes: ShaderAttribute[];
    varyings: ShaderVarying[];
    builtins?: ShaderBuiltin[];
    vertexTemplate: string;
    fragmentTemplate: string;
}

export class ShaderLibrary {
    static init() {
        const lib = new ShaderLibrary();
        for (const [name, code] of Object.entries(chunks)) {
            lib.addChunk(new ShaderChunk(name, code));
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
            vertexTemplate: `
                #include <scene>
                #include <camera>
                #include <model>

                @vertex(input) -> output {
                    output.position = camera.view * camera.projection * model * vec4(input.position, 1.0);
                    var position = input.position;
                    var normal = input.normal;
                    var worldPosition = (model * vec4(position, 1.0)).xyz;
                    var worldNormal = normalize((model * vec4(normal, 0.0)).xyz);
                    var uv = input.uv;

                    {{vertex}}

                    output.vNormal = normal;
                    output.vNormalW = worldNormal;
                    output.vPosition = position;
                    output.vPositionW = worldPosition;
                    output.vUv = uv;
                    return output;
                }
            `,
            fragmentTemplate: `
                #include <scene>
                #include <camera>
                #include <diffuse_map>
                #include <standard>
                #include <fog>

                #if USE_GAMMA {
                    #include <gamma>
                }

                @fragment(input) -> output {
                    var color: vec4f = material.diffuse;

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