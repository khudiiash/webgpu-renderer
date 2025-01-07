import { ObjectMonitor } from "@/data/ObjectMonitor";

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
    topology: 'triangle-list' | 'triangle-strip' = 'triangle-list';
    cullMode: 'back' | 'front' | 'none' = 'back';
    frontFace: 'ccw' | 'cw' = 'ccw';
    depthTest: boolean = true;
    depthWrite: boolean = true;
    depthCompare: 'less' | 'greater' | 'equal' | 'not-equal' | 'always' | 'never' = 'less';
    stencilTest: boolean = false;
    blending: 'normal' | 'additive' | 'multiply' = 'normal';
    transparent: boolean = false;

    private callbacks: ((state: RenderState) => {})[] = [];

    constructor(options: RenderStateOptions = {}) {
        new ObjectMonitor({
            topology: options.topology || 'triangle-list',
            cullMode: options.cullMode || 'back',
            frontFace: options.frontFace || 'ccw',
            depthTest: options.depthTest ?? true,
            depthWrite: options.depthWrite ?? true,
            depthCompare: options.depthCompare || 'less',
            stencilTest: options.stencilTest || false,
            blending: options.blending || 'normal',
            transparent: options.transparent || false,
        }, this).onChange(() => this.dispatch());
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

    dispatch() {
        for (const callback of this.callbacks) {
            callback(this);
        }
    }

    onChange(callback: () => this) {
        if (callback && !this.callbacks.includes(callback)) {
            this.callbacks.push(callback);
        }
    }

    offChange(callback: () => this) {
        const index = this.callbacks.indexOf(callback);
        if (index >= 0) {
            this.callbacks.splice(index, 1);
        }
    }


}
