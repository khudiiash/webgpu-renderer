import { ShaderConfig } from './Shader.js';
import { ShaderChunk } from './ShaderChunk.js';
import * as chunks from './chunks/index';


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

    // static get GBUFFER(): ShaderConfig {
    //     return {
    //         name: 'gbuffer',
    //         chunks: ['Mesh', 'GBuffer'],
    //         vertexTemplate: `
    //             @vertex(input) -> output {

    //                 {{vertex}}

    //                 return output;
    //             }
    //         `,

    //         fragmentTemplate: `
    //             @fragment(input) -> output {
    //                 var color: vec4f;

    //                 {{fragment}}

    //                 output.color = color;
    //                 return output;
    //             }
    //         `
    //     }
    // }

    // static get STANDARD(): ShaderConfig {
    //     return {
    //         name: 'standard',
    //         chunks: ['Mesh', 'StandardMaterial'],
    //         vertexTemplate: `
    //             @vertex(input) -> output {

    //                 {{vertex}}

    //                 return output;
    //             }
    //         `,
    //         fragmentTemplate: `
    //             @fragment(input) -> output {
    //                 var color: vec4f;

    //                 {{fragment}}

    //                 output.color = color;
    //                 return output;
    //             }
    //         `
    //     }
    // }

    // Add a new shader chunk to the library
    addChunk(chunk: ShaderChunk) {
        if (!(chunk instanceof ShaderChunk)) {
            throw new Error('ShaderLibrary: Invalid chunk');
        }
        this.chunks.set(chunk.name, chunk);
    }
}