import { Mesh } from "@/core/Mesh";
import { autobind, uuid } from "@/util/general";
import { BufferData } from "@/data/BufferData";
import { Shader, ShaderChunk, ShaderConfig } from "@/materials/shaders"
import { UniformData } from "@/data/UniformData";
import { Texture } from "@/data/Texture";
import { RenderState } from "@/renderer/RenderState";
import { EventEmitter } from "@/core/EventEmitter";
import { ObjectMonitor } from "@/data/ObjectMonitor";

export type MaterialOptions = {
    name?: string;
    maxInstances?: number;
}

export class Material extends EventEmitter {
    public name: string = 'Material';
    public id: string = uuid('material');
    public shader!: Shader;
    public meshes: Mesh[] = [];
    public uniforms!: UniformData;
    public renderState: RenderState;
    public defines: ObjectMonitor;
    private _shaderConfig!: ShaderConfig;

    constructor(options: MaterialOptions = {}) {
        super();
        autobind(this);
        this.name = options.name ?? this.name;
        this.renderState = new RenderState();

        this.defines = new ObjectMonitor({
            USE_LIGHT: false,
            USE_SHADOW: false,
            USE_FOG: false,
            USE_BILLBOARD: false,
        }).onChange(() => {
            this.createShader();
        });
    }

    get shaderConfig() {
        return this._shaderConfig;
    } 

    set shaderConfig(config: ShaderConfig) {
        this.createShader(config);
    }
  
    setParameter(name: string, value: BufferData | Texture) {
        this.uniforms.set(name, value);
    }

    getParameter(name: string) {
        return this.uniforms.get(name);
    }

    createShader(config: ShaderConfig = this._shaderConfig) {
        this._shaderConfig = config;
        this.shader = Shader.create(this._shaderConfig, this.defines);
        this.fire('rebuild', this);
    }

    addChunk(chunk: ShaderChunk) {
        this.shaderConfig.chunks.push(chunk.name);
        this.createShader();
    }

    removeChunk(chunkName: string) {
        const index = this.shaderConfig.chunks.indexOf(chunkName);
        if (index === -1) return;
        this.shaderConfig.chunks.splice(index, 1);
        this.createShader();
    }

    addMesh(mesh: Mesh) {
        this.meshes.push(mesh);
    }

    removeMesh(mesh: Mesh) {
        const index = this.meshes.indexOf(mesh);
        if (index >= 0) {
            this.meshes.splice(index, 1);
        }
    }

    clone() {
        return new Material().copy(this);
    }
  
    /**
     * Copy properties from another material
     * @param {Material} source 
     */
    copy(source: Material) {
        this.name = source.name;
        return this;
    }
  
}