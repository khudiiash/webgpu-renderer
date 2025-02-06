import { Binding } from "@/data/Binding";
import { ShaderLibrary } from "./ShaderLibrary";
import { BindGroupLayout } from "@/data/BindGroupLayout";
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
    public defines: string = '';
    public chunks: ShaderChunk[];
    public bodyCodes: BodyCode[];
    private bindingCode: string = '';

    constructor(name: string, code: string) {
        this.name = name;
        this.template = code;
        this.chunks = [];
        this.bodyCodes = [];
        this.extractCode();
        this.extractChunks();

        ShaderLibrary.addChunk(this);
    }

    /**
     * Used in TemplateProcessor to extract bindings from the template 
     */
    extractBindings(layouts: BindGroupLayout[]): Binding[] {
        const bindings: Set<Binding> = new Set();
        for (const layout of layouts) {
            for (const binding of layout.bindings) {
                let match;
                while ((match = bindingRe.exec(this.bindingCode)) !== null) { if (match[1] === binding.description.groupName && match[2] === binding.description.bindingName) {
                        bindings.add(binding);
                    }
                }
            }
        }

        return Array.from(bindings);
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

    extractCode() {
        let match;
        while ((match = bodyRe.exec(this.template)) !== null) {
            if (match[1] === "fragment") {
                this.bodyCodes.push(new BodyCode(match[3], match[2] || "", 'fragment'));
            }
            if (match[1] === "vertex") {
                this.bodyCodes.push(new BodyCode(match[3], match[2] || "", 'vertex'));
            }
            if (match[1] === "compute") {
                this.bodyCodes.push(new BodyCode(match[3], match[2] || "", 'compute'));
            }
        }
        this.defines = this.template.replace(includeRe, '').replace(bodyRe, '').trim();

        this.bindingCode = '';
        let bindingMatch;
        while ((bindingMatch = bindingRe.exec(this.defines)) !== null) {
            this.bindingCode += bindingMatch[0];
        }
        this.defines = this.defines.replace(bindingRe, '').trim();
    }
}