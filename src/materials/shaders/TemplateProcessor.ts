import { ShaderChunk } from './ShaderChunk';
import { Struct } from '@/data/Struct';
import { Binding } from '@/data/Binding';
import { BindGroupLayout } from '@/data/BindGroupLayout';

export class TemplateProcessor {
    static #instance: TemplateProcessor;
    private chunks = new Set<ShaderChunk>();
    private bindings = new Set<Binding>();
    private type: 'vertex' | 'fragment' | 'compute' = 'vertex'
    constructor() {
        if (TemplateProcessor.#instance) {
            return TemplateProcessor.#instance;
        }
        TemplateProcessor.#instance = this;
    }

    static getInstance() {
        if (!TemplateProcessor.#instance) {
            TemplateProcessor.#instance = new TemplateProcessor();
        } 
        return TemplateProcessor.#instance;
    }


    static processTemplate(template: string, layouts: BindGroupLayout[] = [], chunks: ShaderChunk[] = [], defines: Map<string, boolean> = new Map()) {
        return TemplateProcessor.getInstance().processTemplate(template, layouts, chunks, defines);
    }

    static getBindings() {
        return TemplateProcessor.getInstance().getBindings();
    }

    static getChunks() {
        return TemplateProcessor.getInstance().getChunks();
    }

    static processDefines(template: string, defines: Map<string, boolean>) {
        if (!template || !template.includes('#if')) return template; 
        for (const [key, value] of defines.entries()) {
            if (!template.includes(key)) continue;
            const re = new RegExp(`#if ${key} {([\\s\\S]*?)}`, 'g');
            template = template.replace(re, value ? '$1' : '');
        }
        return template;
    }

    processTemplate(template: string, layouts: BindGroupLayout[], chunks: ShaderChunk[], defines: Map<string, boolean>) {
        let processed = template;
        this.type = processed.match(/@(vertex|fragment|compute)/)?.[1] as 'vertex' | 'fragment' | 'compute';
        this.chunks.clear();
        this.bindings.clear();
        for (const chunk of chunks) {
            this.processChunk(chunk, layouts);
        }
        processed = this.processBindings(processed, layouts);
        processed = this.processMain(processed);
        processed = this.processDefines(processed, defines);
        return processed;
    }

    processDefines(template: string, defines: Map<string, boolean>) {
        if (!template || !template.includes('#if')) return template; 
        template = template.replace(/#if\s+(\w+)\s*{([\s\S]*?)}/g, (_, key, content) => {
            if (defines.has(key)) {
                return defines.get(key) ? content : '';
            }
            return '';
        });
        return template;
    }
    processBindings(template: string, layouts: BindGroupLayout[] = []) {
        for (const layout of layouts) {
            const bindings = layout.bindings;
            for (const binding of bindings) {
                binding.shouldInsert(this.type) && this.bindings.add(binding);
            }
        }
        
        return template.replace(/@group\(([\w]+)\) @binding\(([\w]+)\)/g, '');
    }
    private processChunk = (chunk: ShaderChunk, layouts: BindGroupLayout[]) => {
        if (!chunk || !chunk.shouldInsert(this.type)) return;
        this.chunks.add(chunk);
        for (const binding of chunk.extractBindings(layouts)) {
            binding.shouldInsert(this.type) && this.bindings.add(binding);
        }
        for (const subChunk of chunk.chunks) {
            this.processChunk(subChunk, layouts);
        }
    };

    getBindings() {
        return Array.from(this.bindings);
    }

    getChunks() {
        return Array.from(this.chunks);
    }

    processMain(template: string) {
        const mainRe = this.type === 'compute' ? 
            /@compute\(input\)(?: ?@workgroup_size\((\d+)(?:, ?(\d+))?(?:, ?(\d+))?\))? ?{/g :
            /@([\w]+)\(([\w\d]+)\) -> ([\w]+) {/g;

        const bodyRe = new RegExp(`{{${this.type}}}`, 'g');
        // prepend bindings
        const sortedBindings = Array.from(this.bindings).sort((a, b) => {
            if (a.description.group === b.description.group) {
                return a.description.binding - b.description.binding;
            }
            return a.description.group - b.description.group;
        });
        let bindingsStr = '';
        for (const binding of sortedBindings) {
            let wgsl = binding.toWGSL();
            const struct = Struct.get(binding.description.varType);
            if (struct) {
                wgsl = `\n${struct.toWGSL()}\n${wgsl}\n`;
            }
            bindingsStr += `${wgsl}\n`;
        }

        // prepend chunks defines
        const chunks = Array.from(this.chunks);
        let chunksStr = '';
        for (const chunk of chunks) {
            chunksStr += `${chunk.defines}\n`;
        }

        // main
        if (this.type === 'compute') {
            console.log('compute', mainRe.test(template));
            template = template.replace(mainRe, (_, x, y, z) => {
                let groupsStr = '' + (x || '1');
                if (y) groupsStr += `, ${y}`;
                if (z) groupsStr += `, ${z}`;
                return `@compute @workgroup_size(${groupsStr})\nfn main(input: ComputeInput) {`;
            });
        } else {
            template = template.replace(mainRe, (_, type) => {
                const capType = type.charAt(0).toUpperCase() + type.slice(1);
                return `@${type}\nfn main(input: ${capType}Input) -> ${capType}Output {\nvar output: ${capType}Output;`;
            });
        }

        // insert body chunks without order rules
        const body = chunks.map(chunk => chunk.getBodyCodesUnordered(this.type)).flat().map(bodyCode => bodyCode.code);
        let bodyStr = body.join('\n');

        // sort ordered chunks
        const orderedBodyCodes = chunks.map(chunk => chunk.getBodyCodesOrdered(this.type)).flat().sort((a, b) => {
            const aRule = a.order;
            const bRule = b.order;
            if (aRule === 'first') return -1;
            if (bRule === 'first') return 1;
            if (aRule === 'last') return 1;
            if (bRule === 'last') return -1;
            return 0;
        });
        // insert ordered chunks
        let firstStr = '';
        let lastStr = '';
        for (const bodyCode of orderedBodyCodes) {
            const rule = bodyCode.order;
            if (rule === 'first') {
                firstStr += bodyCode.code + '\n';
            }
            if (rule === 'last') {
                lastStr += bodyCode.code + '\n';
            }
            if (rule.includes('before')) {
                const [_, marker] = rule.split(':');
                const splitBody = bodyStr.split('\n');
                const index = splitBody.findIndex(line => new RegExp(`// ?${marker}`).test(line));
                if (index !== -1) {
                    splitBody.splice(index, 0, bodyCode.code);
                } else {
                    splitBody.push(bodyCode.code);
                }
                bodyStr = splitBody.join('\n');
            }
            if (rule.includes('after')) {
                const [_, marker] = rule.split(':');
                const splitBody = bodyStr.split('\n');
                const index = splitBody.findIndex(line => new RegExp(`// ?${marker}`).test(line));
                if (index !== -1) {
                    // find next marker
                    const nextMarkerIndex = splitBody.slice(index + 1).findIndex(line => /\/\/\s?\w+/.test(line)) + (index + 1);
                    if (nextMarkerIndex !== -1 && nextMarkerIndex < splitBody.length) {
                        // insert before next marker
                        splitBody.splice(nextMarkerIndex, 0, bodyCode.code);
                    } else {
                        // if no next marker, insert at the end
                        splitBody.push(bodyCode.code);
                    }
                    bodyStr = splitBody.join('\n');
                }
            }
        }
        template = template.replace(bodyRe, `${firstStr}\n${bodyStr}\n${lastStr}`);
        template = `${bindingsStr}\n${chunksStr}\n${template}`;
        return template;
    }
}