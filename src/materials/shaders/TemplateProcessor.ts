import { UniformData } from '@/data';
import { Shader } from './Shader';
import { ShaderChunk } from './ShaderChunk';
import { ShaderLibrary, ShaderDefines } from './ShaderLibrary';
import { Struct } from '@/data/Struct';

export type TemplateBinding = {
    group: number;
    binding: number;
    buffer: string;
    access: string;
    name: string;
    type: string;
}

export type TemplateDefines = {
    [key: string]: boolean;
}

export type TemplateVars = {
    [key: string]: number | string | boolean;
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


    static processTemplate(template: string, defines: ShaderDefines, chunks: string[], bindings: TemplateBinding[]) {
        return TemplateProcessor.getInstance().processTemplate(template, defines, chunks, bindings);
    }

    processTemplate(template: string, defines: ShaderDefines, chunks: string[], bindings: TemplateBinding[]) {
        let processed = template;
        processed = this.processIfBlocks(processed, defines);
        processed = this.processChunks(processed, chunks);
        const includeNames = this.parseIncludes(processed);
        processed = this.processIncludes(processed, includeNames);
        processed = this.processFunctions(processed);
        processed = this.processIfBlocks(processed, defines);
        processed = this.processStructs(processed);
        processed = this.processVars(processed, defines);
        this.processBindings(processed, bindings);
        return processed;
    }

    processChunks(template: string, chunks: string[]) {
        const pattern = /#include <[^>]+>/g;
        let last: RegExpExecArray | null = null;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(template)) !== null) {
            last = match;
        }
        if (chunks.length > 0) {
            if (last) {
                const insertPos = last.index + last[0].length;
                let addition = '';
                for (const chunk of chunks) {
                    addition += `\n#include <${chunk}>`;
                }
                template = template.slice(0, insertPos) + addition + template.slice(insertPos);
            } else {
                let addition = '';
                for (const chunk of chunks) {
                    addition += `#include <${chunk}>\n`;
                }
                template = addition + template;
            }
        }

        return template;
    }

    processVars(template: string, defines: TemplateDefines): string {
        const varRegex = /\${(\w+)}/g;
        let match;
        while ((match = varRegex.exec(template)) !== null) {
            const [_, key] = match;
            if (defines[key] !== undefined) {
                template = template.replace(`\${${key}}`, defines[key].toString());
            }
        }

        return template;
    }

    processStructs(template: string) {
        const structRegex = /#struct\(([\w]+)\)/g;
        const result = template.replace(structRegex, (_, name) => {
            const struct = Struct.get(name);
            if (!struct) { return ''; }
            const structString = struct.toString();
            return structString;
        });
        return result;
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
            
            // find matching closing brace for if block
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
            
            const ifContent = template.slice(contentStart, contentEnd - 1);
            let elseContent = '';
            let finalPos = contentEnd;
            
            // Check for else block
            const elseStart = template.indexOf('else', contentEnd);
            if (elseStart !== -1 && template.slice(contentEnd, elseStart).trim() === '') {
                const elseOpenBrace = template.indexOf('{', elseStart);
                braceCount = 1;
                let elseContentStart = elseOpenBrace + 1;
                let elseContentEnd = elseContentStart;
                
                while (braceCount > 0 && elseContentEnd < template.length) {
                    if (template[elseContentEnd] === '{') {
                        braceCount++;
                    } else if (template[elseContentEnd] === '}') {
                        braceCount--;
                    }
                    elseContentEnd++;
                }
                
                elseContent = template.slice(elseContentStart, elseContentEnd - 1);
                finalPos = elseContentEnd;
            }
            
            if (defines[feature] === true) {
                result += ifContent;
            } else if (elseContent) {
                result += elseContent;
            }
            
            pos = finalPos;
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

    sortChunks(chunks: ShaderChunk[], shaderType: 'vertex' | 'fragment' | 'compute') {
        // Arrays to hold chunks based on their order rules
        const chunksWithoutOrderRules: ShaderChunk[] = [];
        const firstChunks: ShaderChunk[] = [];
        const lastChunks: ShaderChunk[] = [];
        const beforeAfterChunks: ShaderChunk[] = [];
    
        for (const chunk of chunks) {
            const orderRule = chunk.orderRules[shaderType];
            if (!orderRule) {
                // Chunks without any order rules
                chunksWithoutOrderRules.push(chunk);
            } else if (orderRule === 'first') {
                firstChunks.push(chunk);
            } else if (orderRule === 'last') {
                lastChunks.push(chunk);
            } else if (orderRule.startsWith('before:') || orderRule.startsWith('after:')) {
                beforeAfterChunks.push(chunk);
            }
        }
    
        const sortedChunks: ShaderChunk[] = chunksWithoutOrderRules.slice();
    
        for (const chunk of firstChunks) {
            sortedChunks.unshift(chunk);
        }
    
        for (const chunk of lastChunks) {
            sortedChunks.push(chunk);
        }
    
        for (const chunk of beforeAfterChunks) {
            const orderRule = chunk.orderRules[shaderType];
            let targetName: string;
            let isBefore = false;
    
            if (orderRule.startsWith('before:')) {
                isBefore = true;
                targetName = orderRule.substring('before:'.length);
            } else if (orderRule.startsWith('after:')) {
                targetName = orderRule.substring('after:'.length);
            } else {
                continue;
            }
    
            const targetIndex = sortedChunks.findIndex(c => c.name === targetName);
    
            if (targetIndex !== -1) {
                const insertIndex = isBefore ? targetIndex : targetIndex + 1;
                sortedChunks.splice(insertIndex, 0, chunk);
            } else {
                sortedChunks.push(chunk);
            }
        }

        return sortedChunks;
    }

    processIncludes(template: string, includesSet: Set<string>) {
        const includes = [...includesSet];
        const templateType = template.match(/@(vertex|fragment|compute)/)?.[1] as 'vertex' | 'fragment' | 'compute';
        if (!templateType) { return template; }
        const codeRe = new RegExp(`{{${templateType}}}`, 'g');
        const includeRe = /#include <([\w_]+)>/g;
        const typeIncludes = [];
        const defines = [];
        for (const include of includes) {
            const chunk = ShaderLibrary.getChunk(include);
            if (!chunk) { continue; }
            if (chunk.code[templateType] || chunk.stages.length === 0) {
                typeIncludes.push(chunk);
            }
            defines.push(chunk.defines);
        }

        const sorted = this.sortChunks(typeIncludes, templateType);
        const body = sorted.map(chunk => chunk.code[templateType]);

        template = template.replace(includeRe, '');
        template = `${defines.join('\n')}\n${template}`;
        template = template.replace(codeRe, body.join('\n'));
        return template;
    }

}