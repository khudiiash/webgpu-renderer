import { ShaderLibrary } from "./ShaderLibrary";
export class ShaderChunk {
    public name: string;
    public defines: string;
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

    constructor(name: string, code: string) {
        this.name = name;
        this.defines = '';
        this.template = code;
        this.code = {
            vertex: '',
            fragment: '',
            compute: '',
        }

        this.orderRules = {
            fragment: '',
            vertex: '',
            compute: '',
        }

        this.extractCode();

        ShaderLibrary.addChunk(this);
    }

    get stages() {
        return Object.keys(this.code).filter((stage): stage is keyof typeof this.code => this.code[stage as keyof typeof this.code].length > 0);
    }

    extractCode() {
        const re = /@(fragment|vertex|compute)\(([\w\:]+)?\)\s+{{([\s\S]+?)}}/g;
        let match;
        while ((match = re.exec(this.template)) !== null) {
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
        this.defines = this.template.replace(re, "");
    }
}