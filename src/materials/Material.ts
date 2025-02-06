import { Mesh } from "@/core/Mesh";
import { autobind, uuid } from "@/util/general";
import { Shader, ShaderChunk, ShaderConfig, ShaderLibrary } from "@/materials/shaders"
import { UniformData } from "@/data/UniformData";
import { RenderState } from "@/renderer/RenderState";
import { EventEmitter } from "@/core/EventEmitter";

export type MaterialOptions = {
    name?: string;
    maxInstances?: number;
}

export class Material extends EventEmitter {
    public name: string = 'Material';
    public id: string = uuid('material');
    public meshes: Mesh[] = [];
    public uniforms: Map<string, UniformData> = new Map();
    public renderState: RenderState;

    constructor(options: MaterialOptions = {}) {
        super();
        autobind(this);
        this.name = options.name ?? this.name;
        this.renderState = new RenderState();
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

    rebuild() {
        this.fire('rebuild', this);
    }
}