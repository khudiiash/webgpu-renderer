import { Struct } from "@/data/Struct";

export class StructVisualizer {
    name: string;
    size: number;
    layout: Map<string, import("/Users/khudiiash/Documents/JS/webgpu-renderer/src/data/Struct").LayoutEntry>;

    constructor(struct: Struct) {
        this.name = struct.name;
        this.layout = struct.layout;
        this.size = struct.size;
    }

    /** Generate HTML string visualization of the struct layout */
    public generateLayoutHTML(): string {
        const colors = {
            background: '#1a1a1a',
            headerBg: '#2d2d2d',
            grid: {
                main: 'rgba(255, 255, 255, 0.6)',
                byte: 'rgba(255, 255, 255, 0.15)',
                f32: 'rgba(255, 255, 255, 0.5)'
            },
            text: '#ffffff',
            offset: '#202020',
            padding: '#383838',
        };

        // Generate colors for members dynamically
        const memberColors = [
            '#be185d', // rose
            '#92400e', // brown
            '#059669', // emerald
            '#2563eb', // blue
            '#7c3aed', // purple
            '#db2777', // pink
            '#ea580c', // orange
        ];

        const getMemberColor = (index: number) => memberColors[index % memberColors.length];

        let html = `
        <style>
            .struct-layout {
                font-family: 'Consolas', 'Monaco', monospace;
                background: ${colors.background};
                padding: 20px;
                color: ${colors.text};
            }
            .struct-title {
                font-size: 20px;
                margin-bottom: 24px;
            }
            .layout-table {
                border-collapse: collapse;
                width: auto;
                background: ${colors.headerBg};
            }
            .layout-table td, .layout-table th {
                border: 1px solid ${colors.grid.main};
            }
            .data-cell {
                position: relative;
                padding: 0;
            }
            .f32-block {
                width: 128px;
                height: 32px;
                position: relative;
                display: flex;
                align-items: center;
                background-image: linear-gradient(
                    to right,
                    rgba(255, 255, 255, 0.15) 1px,
                    transparent 1px
                );
                background-size: 32px 100%;
                background-position: -1px 0;
            }
            .f32-value {
                position: absolute;
                left: 50px;
                text-align: center;
                color: rgba(255, 255, 255, 0.5);
                font-size: 14px;
            }
            .member-name-cell {
                height: 16px;
                padding: 2px 4px;
                font-size: 7px;
                text-align: left;
                text-overflow: ellipsis;
            }
            .offset-col {
                background: ${colors.offset};
                font-weight: bold;
                width: 48px;
                text-align: center;
            }
            .pad-block {
                width: 128px;
                height: 32px;
                position: relative;
                display: flex;
                align-items: center;
                padding-left: 8px;
                background-image: linear-gradient(
                    to right,
                    rgba(255, 255, 255, 0.15) 1px,
                    transparent 1px
                );
                background-size: 32px 100%;
                background-position: -1px 0;
            }
            .pad-text {
                color: rgba(255, 255, 255, 0.5);
                text-align: center;
                font-size: 12px;
                padding-left: 31%;
            }
        </style>
        <div class="struct-layout">
            <div class="struct-title">struct: ${this.name}</div>
            <table class="layout-table">
                <tr>
                    <th class="offset-col">offset</th>
                    ${Array(16).fill(0).map(() => '<th></th>').join('')}
                </tr>`;

        // Generate rows
        for (let row = 0; row < Math.ceil(this.size / 16); row++) {
            const rowOffset = row * 16;

            // Find members in this row and their spans
            const memberSpans = [];
            let memberIndex = 0;
            for (const [name, entry] of this.layout.entries()) {
                if (Array.isArray(entry.type) && entry.type[0] instanceof Struct) {
                    const [struct, count] = entry.type;
                    for (let i = 0; i < count; i++) {
                        let keyIndex = 0;
                        for (const [key, member] of struct.layout.entries()) {
                            const memberSize = member.size;
                            const structSize = struct.size;
                            const memberOffset = entry.offset + member.offset + i * structSize;
                            const memberEnd = memberOffset + memberSize;
                            const rowStart = rowOffset;
                            const rowEnd = rowOffset + 16;
                            if (memberOffset < rowEnd && memberEnd > rowStart) {
                                const spanStart = Math.max(0, memberOffset - rowStart);
                                const spanEnd = Math.min(16, memberEnd - rowStart);
                                const kName = keyIndex === 0 ? `${name}[${i}].${key}` : `[${i}]${key}`;
                                memberSpans.push({
                                    name: kName,
                                    start: spanStart,
                                    width: spanEnd - spanStart,
                                    color: getMemberColor(memberIndex)
                                });
                                memberIndex++;
                            }
                            keyIndex++;
                        }
                    }
                } else {
                    const entryStart = entry.offset;
                    const entryEnd = entry.offset + entry.size;
                    const rowStart = rowOffset;
                    const rowEnd = rowOffset + 16;

                    if (entryStart < rowEnd && entryEnd > rowStart) {
                        const spanStart = Math.max(0, entryStart - rowStart);
                        const spanEnd = Math.min(16, entryEnd - rowStart);
                        memberSpans.push({
                            name,
                            start: spanStart,
                            width: spanEnd - spanStart,
                            color: getMemberColor(memberIndex)
                        });
                    }
                }
                memberIndex++;
            }

            // Member name row
            html += '<tr>';
            html += `<td class="offset-col"></td>`;
            let colIndex = 0;
            for (const span of memberSpans) {
                if (span.start > colIndex) {
                    html += `<td colspan="${span.start - colIndex}"></td>`;
                }
                html += `
                    <td colspan="${span.width}" class="member-name-cell" 
                        style="background: ${span.color}22">
                        <span style="color: ${colors.text}">.${span.name}</span>
                    </td>`;
                colIndex = span.start + span.width;
            }
            if (colIndex < 16) {
                html += `<td colspan="${16 - colIndex}"></td>`;
            }
            html += '</tr>';

            // Data row
            html += '<tr>';
            html += `<td class="offset-col">${rowOffset}</td>`;
            colIndex = 0;

            for (const span of memberSpans) {
                // Add padding if needed
                if (span.start > colIndex) {
                    const padWidth = span.start - colIndex;
                    const padBlocks = Math.ceil(padWidth / 4);
                    for (let i = 0; i < padBlocks; i++) {
                        const blockWidth = Math.min(4, padWidth - i * 4);
                        const isPartial = blockWidth < 4;
                        html += `
                            <td class="data-cell" colspan="${blockWidth}" style="background: ${colors.padding}">
                                <div class="pad-block${isPartial ? ' f32-block-partial' : ''}">
                                    <span class="pad-text">-pad-</span>
                                </div>
                            </td>`;
                    }
                }

                // Add member blocks
                for (let block = 0; block < span.width; block += 4) {
                    const blockWidth = Math.min(4, span.width - block);
                    const isPartial = blockWidth < 4;
                    html += `
                        <td class="data-cell" colspan="${blockWidth}" style="background: ${span.color}">
                            <div class="f32-block${isPartial ? ' f32-block-partial' : ''}">
                                <span class="f32-value">f32</span>
                            </div>
                        </td>`;
                }
                colIndex = span.start + span.width;
            }

            // Add remaining padding
            if (colIndex < 16) {
                const remainingWidth = 16 - colIndex;
                const padBlocks = Math.ceil(remainingWidth / 4);
                for (let i = 0; i < padBlocks; i++) {
                    const blockWidth = Math.min(4, remainingWidth - i * 4);
                    const isPartial = blockWidth < 4;
                    html += `
                        <td class="data-cell" colspan="${blockWidth}" style="background: ${colors.padding}">
                            <div class="pad-block${isPartial ? ' f32-block-partial' : ''}">
                                <span class="pad-text">-pad-</span>
                            </div>
                        </td>`;
                }
            }

            html += '</tr>';
        }

        html += '</table></div>';
        return html;
    }

    /** Display the layout visualization on the current page */
    public visualizeLayout(): void {
        const html = this.generateLayoutHTML();

        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            overflow: scroll;
            max-height: 90vh;
            top: 20px;
            right: 20px;
            z-index: 1000;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 4px 8px;
            line-height: 1;
        `;
        closeBtn.onclick = () => document.body.removeChild(container);

        container.innerHTML = html;
        container.appendChild(closeBtn);
        document.body.appendChild(container);
    }
}