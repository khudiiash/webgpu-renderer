import { Binding } from "@/data/Binding";
import { ShaderLibrary } from "./ShaderLibrary";
const bindingRe = /@group\(([A-Za-z]+)\) @binding\(([A-Za-z]+)\)/g;
const includeRe = /@include\((\w+)\)/g;
const bodyRe = /@(fragment|vertex|compute)\(([\w\:]+)?\)\s+{{([\s\S]+?)}}/g;

export class ShaderChunk {
    public name: string;
    public template: string;
    public code: {
        vertex: string;
        fragment: string;
        compute: string;
    }
    public orderRules: { 
        fragment: string;
        vertex: string; 
        compute: string; 
    };
    public defines: string = '';
    public chunks: ShaderChunk[];
    public bindings: Binding[];

    constructor(name: string, code: string) {
        this.name = name;
        this.template = code;
        this.code = {
            vertex: '',
            fragment: '',
            compute: '',
        }
        this.chunks = [];
        this.bindings = [];

        this.orderRules = {
            fragment: '',
            vertex: '',
            compute: '',
        }

        this.extractCode();
        this.extractBindings();
        this.extractChunks();

        ShaderLibrary.addChunk(this);
    }

    get stages() {
        return Object.keys(this.code).filter((stage): stage is keyof typeof this.code => this.code[stage as keyof typeof this.code].length > 0);
    }


    shouldInsert(stage: 'vertex' | 'fragment' | 'compute') {
        return this.stages.length === 0 || this.stages.includes(stage);
    }

    hasOrderRules(stage: 'vertex' | 'fragment' | 'compute') {
        return this.orderRules[stage] !== '';
    }

    extractChunks() {
        let match;
        while ((match = includeRe.exec(this.template)) !== null) {
            const chunk = ShaderLibrary.getChunk(match[1]);
            chunk && this.chunks.push(chunk);
        }
    }

    extractBindings() {
        let match;
        while ((match = bindingRe.exec(this.template)) !== null) {
            const binding = Binding.getByNames(match[1], match[2])
            binding && this.bindings.push(binding);
        }
    }

    extractCode() {
        let match;
        while ((match = bodyRe.exec(this.template)) !== null) {
            if (match[1] === "fragment") {
                this.orderRules.fragment = match[2] || "";
                this.code.fragment = match[3];
            }
            if (match[1] === "vertex") {
                this.orderRules.vertex = match[2] || "";
                this.code.vertex = match[3];
            }
            if (match[1] === "compute") {
                this.orderRules.compute = match[2] || "";
                this.code.compute = match[3];
            }
        }
        this.defines = this.template.replace(bindingRe, '').replace(includeRe, '').replace(bodyRe, '').trim();
    }
}