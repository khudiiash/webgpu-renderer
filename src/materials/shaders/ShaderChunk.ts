import { Binding } from "@/data/Binding";
import { ShaderLibrary } from "./ShaderLibrary";
const bindingRe = /@group\(([A-Za-z]+)\) @binding\(([A-Za-z]+)\)/g;
const includeRe = /@include\((\w+)\)/g;
const bodyRe = /@(fragment|vertex|compute)\(([\w\:]+)?\)\s+{{([\s\S]+?)}}/g;

class BodyCode {
    code: string;
    order: string;
    type: 'fragment' | 'vertex' | 'compute';

    constructor(code = '', order = '', type: 'fragment' | 'vertex' | 'compute') {
        this.code = code;
        this.order = order;
        this.type = type;
    }
}

export class ShaderChunk {
    public name: string;
    public template: string;
    // public code: {
    //     vertex: string;
    //     fragment: string;
    //     compute: string;
    // }
    // public orderRules: { 
    //     fragment: string;
    //     vertex: string; 
    //     compute: string; 
    // };
    public defines: string = '';
    public chunks: ShaderChunk[];
    public bindings: Binding[];
    public bodyCodes: BodyCode[];

    constructor(name: string, code: string) {
        this.name = name;
        this.template = code;
        // this.code = {
        //     vertex: '',
        //     fragment: '',
        //     compute: '',
        // }
        this.chunks = [];
        this.bindings = [];
        this.bodyCodes = [];

        // this.orderRules = {
        //     fragment: '',
        //     vertex: '',
        //     compute: '',
        // }

        this.extractCode();
        this.extractBindings();
        this.extractChunks();

        ShaderLibrary.addChunk(this);
    }

    shouldInsert(stage: 'vertex' | 'fragment' | 'compute') {
        return this.bodyCodes.some(bodyCode => bodyCode.type === stage) || this.bodyCodes.length === 0;
    }

    hasOrderRules(stage: 'vertex' | 'fragment' | 'compute') {
        return this.bodyCodes.some(bodyCode => bodyCode.type === stage && bodyCode.order);
    }

    getBodyCodes(stage: 'vertex' | 'fragment' | 'compute') {
        return this.bodyCodes.filter(bodyCode => { return bodyCode.type === stage });
    }

    getBodyCodesOrdered(stage: 'vertex' | 'fragment' | 'compute') {
        return this.bodyCodes.filter(bodyCode => bodyCode.type === stage && bodyCode.order);
    }

    getBodyCodesUnordered(stage: 'vertex' | 'fragment' | 'compute') {
        return this.bodyCodes.filter(bodyCode => bodyCode.type === stage && !bodyCode.order);
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
                // this.orderRules.fragment = match[2] || "";
                // this.code.fragment = match[3];
                this.bodyCodes.push(new BodyCode(match[3], match[2] || "", 'fragment'));
            }
            if (match[1] === "vertex") {
                // this.orderRules.vertex = match[2] || "";
                // this.code.vertex = match[3];
                this.bodyCodes.push(new BodyCode(match[3], match[2] || "", 'vertex'));
            }
            if (match[1] === "compute") {
                // this.orderRules.compute = match[2] || "";
                // this.code.compute = match[3];
                this.bodyCodes.push(new BodyCode(match[3], match[2] || "", 'compute'));
            }
        }
        console.log(this.name, this.bodyCodes);
        this.defines = this.template.replace(bindingRe, '').replace(includeRe, '').replace(bodyRe, '').trim();
    }
}