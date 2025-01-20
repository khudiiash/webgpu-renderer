import { ShaderChunk } from './ShaderChunk';
import { ShaderLibrary } from './ShaderLibrary';
import { Struct } from '@/data/Struct';
import { Binding } from '@/data/Binding';


const bindingRe = /@group\(([A-Za-z]+)\) @binding\(([A-Za-z]+)\)/g;
const includeRe = /@include\((\w+)\)/g;
const bodyRe = /{{(vertex|fragment|compute)}}/g;
const mainFnRe = /@([\w]+)\(([\w]+)\) -> ([\w]+) {/g;


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
        const body = chunks.filter(chunk => !chunk.hasOrderRules(this.type)).map(chunk => chunk.code[this.type]);
        let bodyStr = body.join('\n');

        // sort ordered chunks
        const orderedChunks = chunks.filter(chunk => chunk.hasOrderRules(this.type)).sort((a, b) => {
            const aRule = a.orderRules[this.type];
            const bRule = b.orderRules[this.type];
            if (aRule === 'first') return -1;
            if (bRule === 'first') return 1;
            if (aRule === 'last') return 1;
            if (bRule === 'last') return -1;
            return 0;
        });
        // insert ordered chunks
        let firstStr = '';
        let lastStr = '';
        for (const chunk of orderedChunks) {
            const rule = chunk.orderRules[this.type];
            if (rule === 'first') {
                firstStr += chunk.code[this.type] + '\n';
            }
            if (rule === 'last') {
                lastStr += chunk.code[this.type] + '\n';
            }
            if (rule.includes('before')) {
                const [_, marker] = rule.split(':');
                const splitBody = bodyStr.split('\n');
                const index = bodyStr.split('\n').findIndex(line => new RegExp(`// ?${marker}`).test(line));
                if (index) {
                    splitBody.splice(index, 0, chunk.code[this.type]);
                    bodyStr = splitBody.join('\n');
                }
            }
            if (rule.includes('after')) {
                const [_, marker] = rule.split(':');
                const splitBody = bodyStr.split('\n');
                const index = bodyStr.split('\n').findIndex(line => new RegExp(`// ?${marker}`).test(line));
                if (index) {
                    splitBody.splice(index + 1, 0, chunk.code[this.type]);
                    bodyStr = splitBody.join('\n');
                }
            }
        }
        template = template.replace(bodyRe, `${firstStr}\n${bodyStr}\n${lastStr}`);
        template = `${bindingsStr}\n${chunksStr}\n${template}`;
        return template;
    }
}