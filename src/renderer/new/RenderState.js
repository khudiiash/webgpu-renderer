/**
 * @typedef {Object} RenderStateOptions
 * @property {string} [topology='triangle-list'] - The primitive topology type ('triangle-list', 'triangle-strip', etc.)
 * @property {string} [cullMode='back'] - Face culling mode ('back', 'front', or 'none')
 * @property {string} [frontFace='ccw'] - Front face winding order ('ccw' or 'cw')
 * @property {boolean} [depthTest=true] - Enable/disable depth testing
 * @property {boolean} [depthWrite=true] - Enable/disable depth writing
 * @property {string} [depthCompare='less'] - Depth comparison function ('less', 'greater', etc.)
 * @property {boolean} [stencilTest=false] - Enable/disable stencil testing
 * @property {string} [blending='normal'] - Blend mode ('normal', 'additive', 'multiply')
 * @property {boolean} [transparent=false] - Enable/disable transparency and alpha-to-coverage
 */
class RenderState {
    
    /**
     * @param {RenderStateOptions} [options]
     */
    constructor(options = {}) {
        // Primitive state options
        this.topology = options.topology || 'triangle-list';
        this.cullMode = options.cullMode || 'back';
        this.frontFace = options.frontFace || 'ccw';

        // Depth-stencil state options
        this.depthTest = options.depthTest ?? true;
        this.depthWrite = options.depthWrite ?? true;
        this.depthCompare = options.depthCompare || 'less';
        this.stencilTest = options.stencilTest || false;

        // Blend state options
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
        if (!this.transparent && this.blending === 'none') {
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

export { RenderState };