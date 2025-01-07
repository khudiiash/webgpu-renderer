import { ShaderLibrary, ShaderDefines } from './ShaderLibrary';

export type TemplateBinding = {
    group: number;
    binding: number;
    buffer: string;
    access: string;
    name: string;
    type: string;
}


export class TemplateProcessor {

    static #instance: TemplateProcessor;

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

    static processTemplate(template: string, defines: ShaderDefines, bindings: TemplateBinding[]) {
        return TemplateProcessor.getInstance().processTemplate(template, defines, bindings);
    }

    processTemplate(template: string, defines: ShaderDefines, bindings: TemplateBinding[]) {
        let processed = template;
        processed = this.processIfBlocks(processed, defines);
        const includeNames = this.parseIncludes(processed);
        processed = this.processIncludes(processed, includeNames);
        processed = this.processFunctions(processed);
        processed = this.processIfBlocks(processed, defines);
        this.processBindings(processed, bindings);
        return processed;
    }

    processIfBlocks(template: string, defines: ShaderDefines) {
        let result = '';
        let pos = 0;
        
        while (pos < template.length) {
            const ifStart = template.indexOf('#if', pos);
            if (ifStart === -1) {
                result += template.slice(pos);
                break;
            }
            
            result += template.slice(pos, ifStart);
            
            const featureStart = ifStart + 3;
            let featureEnd = template.indexOf('{', featureStart);
            const feature = template.slice(featureStart, featureEnd).trim();
            
            // find matching closing brace
            let braceCount = 1;
            let contentStart = featureEnd + 1;
            let contentEnd = contentStart;
            
            while (braceCount > 0 && contentEnd < template.length) {
                if (template[contentEnd] === '{') {
                    braceCount++;
                } else if (template[contentEnd] === '}') {
                    braceCount--;
                }
                contentEnd++;
            }
            
            const content = template.slice(contentStart, contentEnd - 1);
            
            if (defines.get(feature) === true) {
                result += content;
            }
            
            pos = contentEnd;
        }
        
        return result;
    }

    processFunctions(template: string) {
        const fnRegex = /@([\w]+)\(([\w]+)\) -> ([\w]+) {/g;
        return template.replace(fnRegex, (_, type) => {
            const capType = type.charAt(0).toUpperCase() + type.slice(1);
            return `@${type}\nfn main(input: ${capType}Input) -> ${capType}Output {\nvar output: ${capType}Output;`;
        });
    }

    processBindings(template: string, bindings: TemplateBinding[]) {
        const bindingRegex = /@group\((\d+)\)\s@binding\((\d+)\)\svar(?:<(\w+)(?:,\s(\w+))?>)? (\w+)\: (\w+(?:<.*>)?);/g;
        let match;
        
        while ((match = bindingRegex.exec(template)) !== null) {
            const [_, groupStr, bindingStr, buffer, access, name, type] = match;
            const group = parseInt(groupStr);
            const binding = parseInt(bindingStr);
            
            if (!bindings.some(b => b.group === group && b.binding === binding)) {
                bindings.push({ group, binding, buffer, access, name, type });
            }
        }
    }

    parseIncludes(template: string): Set<string> {
        const includeRegex = /#include <([\w_]+)>/g;
        const includes: Set<string> = new Set();
        let match;

        while ((match = includeRegex.exec(template)) !== null) {
            const chunkName = match[1];
            includes.add(chunkName);
        }
        template = template.replace(includeRegex, '');
        return includes;
    }

    processIncludes(template: string, includesSet: Set<string>) {
        const includes = [...includesSet];
        const codeRe = /{{(?:fragment|vertex|compute)}}/;
        const includeRe = /#include <([\w_]+)>/g;
        const body = [];
        const defines = [];
        for (const include of includes) {
            const chunk = ShaderLibrary.getChunk(include);
            if (!chunk) { continue; }
            body.push(chunk.code);
            defines.push(chunk.defines);
        }
        template = template.replace(includeRe, '');
        template = `${defines.join('\n')}\n${template}`;
        template = template.replace(codeRe, body.join('\n'));
        return template;
    }

}