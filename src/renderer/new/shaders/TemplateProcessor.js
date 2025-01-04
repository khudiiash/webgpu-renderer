import { ShaderLibrary } from './ShaderLibrary';

class TemplateProcessor {
    static #instance = null;
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

    static processTemplate(template, defines, bindings) {
        return TemplateProcessor.getInstance().processTemplate(template, defines, bindings);
    }

    processTemplate(template, defines, bindings) {
        let processed = template;
        processed = this.processIfBlocks(processed, defines);
        const includeNames = this.parseIncludes(processed);
        processed = this.processIncludes(processed, includeNames);
        processed = this.processFunctions(processed);
        processed = this.processIfBlocks(processed, defines);
        this.processBindings(processed, bindings);
        return processed;
    }

    processIfBlocks(template, defines) {
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
            
            if (defines[feature]) {
                result += content;
            }
            
            pos = contentEnd;
        }
        
        return result;
    }

    processFunctions(template) {
        const fnRegex = /@([\w]+)\(([\w]+)\) -> ([\w]+) {/g;
        return template.replace(fnRegex, (_, type, input, output) => {
            const capType = type.charAt(0).toUpperCase() + type.slice(1);
            return `@${type}\nfn main(input: ${capType}Input) -> ${capType}Output {\nvar output: ${capType}Output;`;
        });
    }

    processBindings(template, bindings) {
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

    parseIncludes(template) {
        const includeRegex = /#include <([\w_]+)>/g;
        const includes = new Set();
        let match;

        while ((match = includeRegex.exec(template)) !== null) {
            const chunkName = match[1];
            includes.add(chunkName);
        }
        template = template.replace(includeRegex, '');
        return includes;
    }

    processIncludes(template, includesSet) {
        const includes = [...includesSet];
        const codeRe = /{{(?:fragment|vertex|compute)}}/;
        const includeRe = /#include <([\w_]+)>/g;
        const body = [];
        const defines = [];
        for (const include of includes) {
            const chunk = ShaderLibrary.getChunk(include);
            body.push(chunk.code);
            defines.push(chunk.defines);
        }
        template = template.replace(includeRe, '');
        template = `${defines.join('\n')}\n${template}`;
        template = template.replace(codeRe, body.join('\n'));
        return template;
    }

}

export { TemplateProcessor };