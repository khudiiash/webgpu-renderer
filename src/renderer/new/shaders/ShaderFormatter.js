class ShaderFormatter {
    static #instance;
    constructor() {
        if (ShaderFormatter.#instance) {
            return ShaderFormatter.#instance;
        } 
        this.config = {
            indentSize: 4,
        };
        
        ShaderFormatter.#instance = this;
    }

    static getInstance() {
        if (!ShaderFormatter.#instance) {
            ShaderFormatter.#instance = new ShaderFormatter();
        }
        return ShaderFormatter.#instance;
    }

    static format(code) {
        return ShaderFormatter.getInstance().format(code);
    }

    format(code) {
        let lines = code.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        let formattedLines = [];
        let indentLevel = 0;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            
            if (line.startsWith('//')) {
                formattedLines.push(this.indent(line, indentLevel));
                continue;
            }

            if (line.startsWith('}')) {
                formattedLines.push(this.indent(line, indentLevel - 1));
                indentLevel = indentLevel - 1;
                if (line.endsWith('{')) {
                    indentLevel++;
                }
                continue;
            }

            formattedLines.push(this.indent(line, indentLevel));

            if (line.endsWith('{')) {
                indentLevel++;
            }
        }

        return formattedLines.join('\n');
    }

    indent(line, level) {
        return ' '.repeat(Math.max(0, level) * this.config.indentSize) + line;
    }
}

export { ShaderFormatter };