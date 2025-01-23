import { ShaderChunk } from './ShaderChunk';
import { ShaderLibrary } from './ShaderLibrary';
import { Struct } from '@/data/Struct';
import { Binding } from '@/data/Binding';

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


    static processTemplate(template: string, chunks: string[]) {
        return TemplateProcessor.getInstance().processTemplate(template, chunks);
    }

    static getBindings() {
        return TemplateProcessor.getInstance().getBindings();
    }

    static getChunks() {
        return TemplateProcessor.getInstance().getChunks();
    }

    processTemplate(template: string, chunks: string[]) {
        let processed = template;
        this.type = processed.match(/@(vertex|fragment|compute)/)?.[1] as 'vertex' | 'fragment' | 'compute';
        this.chunks.clear();
        this.bindings.clear();
        for (const chunkName of chunks) {
            this.processChunk(chunkName);
        }
        processed = this.processMain(processed);
        return processed;
    }
    private processChunk = (chunkName: string) => {
        const chunk = ShaderLibrary.getChunk(chunkName);
        if (!chunk || !chunk.shouldInsert(this.type)) return;
        this.chunks.add(chunk);
        for (const binding of chunk.bindings) {
            binding.shouldInsert(this.type) && this.bindings.add(binding);
        }
        for (const subChunk of chunk.chunks) {
            this.processChunk(subChunk.name);
        }
    };

    getBindings() {
        return Array.from(this.bindings);
    }

    getChunks() {
        return Array.from(this.chunks);
    }

    processMain(template: string) {
        const mainRe = /@([\w]+)\(([\w]+)\) -> ([\w]+) {/g;
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
        template = template.replace(mainRe, (_, type) => {
            const capType = type.charAt(0).toUpperCase() + type.slice(1);
            return `@${type}\nfn main(input: ${capType}Input) -> ${capType}Output {\nvar output: ${capType}Output;`;
        });

        // insert body chunks without order rules
        const body = chunks.map(chunk => chunk.getBodyCodesUnordered(this.type)).flat().map(bodyCode => bodyCode.code);
        let bodyStr = body.join('\n');

        // sort ordered chunks
        const orderedBodyCodes = chunks.map(ch => ch.bodyCodes).flat().sort((a, b) => {
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
        if (chunks.some(c => c.name === 'StandardMaterial')) {
            console.log('body includes', bodyStr.includes('//fix_uv'));
            console.log('template includes', template.includes('//fix_uv'));
        }
        template = template.replace(bodyRe, `${firstStr}\n${bodyStr}\n${lastStr}`);
        template = `${bindingsStr}\n${chunksStr}\n${template}`;
        return template;
    }
}