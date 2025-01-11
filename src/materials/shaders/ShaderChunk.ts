export class ShaderChunk {
    public name: string;
    public defines: string;
    public code: string;

    constructor(name: string, code: string) {
        this.name = name;
        this.defines = '';
        this.code = code;
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