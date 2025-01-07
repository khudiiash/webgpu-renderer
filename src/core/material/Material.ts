import { Mesh } from "../Mesh";
import { autobind, BufferData, uuid } from "@/util";
import { Shader } from "@/renderer/shaders"
import { Texture, UniformData } from "@/data";

export type MaterialOptions = {
    name?: string;
}

export class Material {
    public name: string = 'Material';
    public id: string = uuid('material');
    public shader!: Shader;
    public meshes: Mesh[] = [];
    public uniforms!: UniformData;

    constructor(options: MaterialOptions = {}) {
        autobind(this);
        this.name = options.name ?? this.name;
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