import { ShaderFormatter } from "../shaders/ShaderFormatter.js";

class ShaderChunk {
    constructor(name, code) {
        this.name = name;
        this.formatter = new ShaderFormatter();
        this.bindings = {};
        this.defines = '';
        this.code = code;
        this.bindingNames = new Set();
        this.extractCode();
    }

    extractCode() {
        const re = /@(?:fragment|vertex|compute)\s+{{([\s\S]+?)}}/g;
        let match = re.exec(this.code);
        if (match) {
            this.defines = this.code.replace(re, '');
            this.code = match[1];
        } else {
            this.defines = this.code;
            this.code = '';
        }
    }
}

export { ShaderChunk };