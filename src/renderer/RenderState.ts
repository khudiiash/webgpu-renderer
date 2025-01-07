export interface RenderStateOptions {
    topology?: 'triangle-list' | 'triangle-strip';
    cullMode?: 'back' | 'front' | 'none';
    frontFace?: 'ccw' | 'cw';
    depthTest?: boolean;
    depthWrite?: boolean;
    depthCompare?: 'less' | 'greater' | 'equal' | 'not-equal' | 'always' | 'never';
    stencilTest?: boolean;
    blending?: 'normal' | 'additive' | 'multiply';
    transparent?: boolean;
}

export class RenderState {
    topology: 'triangle-list' | 'triangle-strip';
    cullMode: 'back' | 'front' | 'none';
    frontFace: 'ccw' | 'cw';
    depthTest: boolean;
    depthWrite: boolean;
    depthCompare: 'less' | 'greater' | 'equal' | 'not-equal' | 'always' | 'never';
    stencilTest: boolean;
    blending: 'normal' | 'additive' | 'multiply';
    transparent: boolean;

    constructor(options: RenderStateOptions = {}) {
        this.topology = options.topology || 'triangle-list';
        this.cullMode = options.cullMode || 'back';
        this.frontFace = options.frontFace || 'ccw';
        this.depthTest = options.depthTest ?? true;
        this.depthWrite = options.depthWrite ?? true;
        this.depthCompare = options.depthCompare || 'less';
        this.stencilTest = options.stencilTest || false;
        this.blending = options.blending || 'normal';
        this.transparent = options.transparent || false;
    }

    getFragmentTarget() {
        return [{
            format: navigator.gpu.getPreferredCanvasFormat(),
            blend: this.getBlendState(),
            writeMask: 0xF, // RGBA write mask
        }];
    }

    getBlendState() {
        if (!this.transparent) {
            return undefined;
        }

        const blendModes = {
            additive: {
                color: {
                    srcFactor: 'src-alpha',
                    dstFactor: 'one',
                    operation: 'add'
                },
                alpha: {
                    srcFactor: 'one',
                    dstFactor: 'one',
                    operation: 'add'
                }
            },
            multiply: {
                color: {
                    srcFactor: 'dst',
                    dstFactor: 'one-minus-src-alpha',
                    operation: 'add'
                },
                alpha: {
                    srcFactor: 'one',
                    dstFactor: 'one-minus-src-alpha',
                    operation: 'add'
                }
            },
            normal: {
                color: {
                    srcFactor: 'src-alpha',
                    dstFactor: 'one-minus-src-alpha',
                    operation: 'add'
                },
                alpha: {
                    srcFactor: 'one',
                    dstFactor: 'one-minus-src-alpha',
                    operation: 'add'
                }
            }
        };

        return blendModes[this.blending] || blendModes.normal;
    }

    getDepthStencil() {
        if (!this.depthTest) return undefined;

        return {
            depthWriteEnabled: this.depthWrite,
            depthCompare: this.depthCompare,
            format: 'depth32float',
            stencilEnabled: this.stencilTest,
        };
    }

    getMultisample() {
        return {
            count: 1,
            mask: 0xFFFFFFFF,
            alphaToCoverageEnabled: this.transparent,
        };
    }

    getPrimitive() {
        return {
            topology: this.topology,
            cullMode: this.cullMode,
            frontFace: this.frontFace,
            stripIndexFormat: this.topology === 'triangle-strip' ? 'uint32' : undefined,
        };
    }
}
