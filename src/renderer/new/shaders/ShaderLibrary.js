import { ShaderChunk } from './ShaderChunk.js';
import { ShaderFormatter } from './ShaderFormatter.js';
import { chunks } from './chunks';

class ShaderLibrary {
    static #instance = null;

    constructor() {
        if (ShaderLibrary.#instance) {
            return ShaderLibrary.#instance;
        }
        this.formatter = new ShaderFormatter();
        this.chunks = new Map(); 
        this.bindingLayouts = new Map();
        this.templateCache = new Map();
        ShaderLibrary.#instance = this;
    }

    static getInstance() {
        if (!ShaderLibrary.#instance) {
            throw new Error('ShaderLibrary has not been initialized');
        }
        return ShaderLibrary.#instance;
    }

    static get STANDARD() {
        return {
            name: 'standard',
            attributes: [
                { name: 'position', type: 'vec3f' },
                { name: 'normal', type: 'vec3f' },
                { name: 'uv', type: 'vec2f' },
            ],
            varyings: [
                { name: 'vPosition', type: 'vec3f' },
                { name: 'vNormal', type: 'vec3f' },
                { name: 'vPositionW', type: 'vec3f' },
                { name: 'vNormalW', type: 'vec3f' },
                { name: 'vUv', type: 'vec2f' },
            ],
            vertexTemplate: `
                #include <scene>
                #include <camera>
                #include <model>

                @vertex(input) -> output {
                    output.position = camera.view * camera.projection * model * vec4(input.position, 1.0);
                    var position = input.position;
                    var normal = input.normal;
                    var worldPosition = (model * vec4(position, 1.0)).xyz;
                    var worldNormal = normalize((model * vec4(normal, 0.0)).xyz);
                    var uv = input.uv;

                    {{vertex}}

                    output.vNormal = normal;
                    output.vNormalW = worldNormal;
                    output.vPosition = position;
                    output.vPositionW = worldPosition;
                    output.vUv = uv;
                    return output;
                }
            `,
            fragmentTemplate: `
                #include <scene>
                #include <diffuse_map>
                #include <standard>

                #if USE_GAMMA {
                    #include <gamma>
                }

                @fragment(input) -> output {
                    var color = vec4(1.0);

                    {{fragment}}

                    output.color = color;
                    return output;
                }
            `
        }
    }

    // Add a new shader chunk to the library
    addChunk(chunk) {
        if (!(chunk instanceof ShaderChunk)) {
            throw new Error(`Invalid chunk type for: ${chunk.name}`);
        }
        this.chunks.set(chunk.name, chunk);
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
            const chunk = this.chunks.get(include);
            body.push(chunk.code);
            defines.push(chunk.defines);
        }
        template = template.replace(includeRe, '');
        template = `${defines.join('\n')}\n${template}`;
        template = template.replace(codeRe, body.join('\n'));
        return template;
    }

    processTemplate(template, defines, bindings) {
        let processed = template;

        const ifRegex = /#if\s+([\w]+)\s+{([\s\S]+?)}/g;
        const fnRegex = /@([\w]+)\(([\w]+)\) -> ([\w]+) {/g;
        const bindingRegex = /@group\((\d+)\)\s@binding\((\d+)\)\svar(?:<(\w+)(?:,\s(\w+))?>)? (\w+)\: (\w+(?:<.*>)?);/g;

        processed = processed.replace(ifRegex, (_, feature, content) => {
            if (defines[feature]) {
                return content;
            }
            return '';
        });
        const includeNames = this.parseIncludes(processed);
        processed = this.processIncludes(processed, includeNames);

        processed = processed.replace(ifRegex, (_, feature, content) => {
            if (defines[feature]) {
                return content;
            }
            return '';
        });

        processed = processed.replace(fnRegex, (_, type, input, output) => {
            const capType = type.charAt(0).toUpperCase() + type.slice(1);
            return `@${type}\nfn main(input: ${capType}Input) -> ${capType}Output {\nvar output: ${capType}Output;`;
        });

        let match;
        while ((match = bindingRegex.exec(processed)) !== null) {
            const [_, groupStr, bindingStr, buffer, access, name, type] = match;
            const group = parseInt(groupStr);
            const binding = parseInt(bindingStr);
            
            if (bindings.some(b => b.group === group && b.binding === binding)) {
                continue;
            }

            bindings.push({ 
                group,
                binding,
                buffer, 
                access, 
                name, 
                type
            });
        }

        const formatted = this.formatter.format(processed);
        return formatted;
    }

}

const start = performance.now();
const lib = new ShaderLibrary();
for (const [name, code] of Object.entries(chunks)) {
    lib.addChunk(new ShaderChunk(name, code));
}
const end = performance.now();

export { ShaderLibrary };