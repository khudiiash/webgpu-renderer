import { Mesh } from "@/core/Mesh";
import { autobind, uuid } from "@/util/general";
import { BufferData } from "@/data/BufferData";
import { Shader } from "@/materials/shaders"
import { UniformData } from "@/data/UniformData";
import { Texture } from "@/data/Texture";
import { RenderState } from "@/renderer/RenderState";

export type MaterialOptions = {
    name?: string;
}

export class Material {
    public name: string = 'Material';
    public id: string = uuid('material');
    public shader!: Shader;
    public meshes: Mesh[] = [];
    public uniforms!: UniformData;
    public renderState: RenderState;

    constructor(options: MaterialOptions = {}) {
        autobind(this);
        this.name = options.name ?? this.name;
        this.renderState = new RenderState();
    }
  
    setParameter(name: string, value: BufferData | Texture) {
        this.uniforms.set(name, value);
    }

    getParameter(name: string) {
        return this.uniforms.get(name);
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