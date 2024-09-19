import { TextureAttachment } from "../shaders/TextureAttachment";

const webgpuTypePattern = /^(f32|i32|u32|vec[2-4](f|i|u)|mat[2-4]x[2-4]f)$/;

class Utils {
    constructor(device, renderer) {
        this.device = device;
        this.renderer = renderer;
    }
    
    static getFormat(value) {
        if (!value) {
            throw new Error('Utils.getFormat: value is undefined');
        }
        
        if (typeof value === 'number') {
            return 'f32';
        }
        
        if (value instanceof TextureAttachment) {
            return value.format;
        }
        
        if (value instanceof Color) {
            return 'vec4f';
        }
        
        if (value instanceof Float32Array) {
            return `array<f32, ${value.length}>`;
        }
        
        if (value instanceof Int32Array) {
            return `array<i32, ${value.length}>`;
        }
    }
    
    static isType(string) {
        return webgpuTypePattern.test(string);
    }
    
    static getTypeSize(type) {
        if (!this.isType(type)) {
            throw new Error('Utils.getSize: type is not a valid type');
        }

        if (type.includes('32')) {
            return 4;
        }
        
        if (type === 'vec2f') {
            return 8;
        }
        
        if (type === 'vec3f') {
            return 12;
        }
        
        if (type === 'vec4f') {
            return 16;
        }
        
        if (type === 'mat2x2f') {
            return 16;
        }
        
        if (type === 'mat3x3f') {
            return 36;
        }
        
        if (type === 'mat4x4f') {
            return 64;
        }
        
    }
    
    static getStructSize(struct) {
        let size = 0;
        for (let key in struct) {
            size += this.getTypeSize(struct[key]);
        }
        return size;
    }
    
    static getSamplerLayoutByType(type) {
        switch(type) {
            case 'sampler': 
                return { }
            case 'sampler_comparison':
                return { type: 'comparison' }
            default:
                throw new Error('Utils.getSamplerLayoutByType: type is not a valid type'); 
        }
    }
    
    static getValueSize(value) {
        if (!value) {
            throw new Error('Utils.getSize: value is undefined');
        }
        
        if (value instanceof TextureAttachment) {
            return value.byteSize;
        }
        
        if (value instanceof Color) {
            return value.byteSize;
        }
        
        if (value instanceof Float32Array) {
            return value.byteLength;
        }
        
        if (value instanceof Int32Array) {
            return value.byteLength;
        }
        
        if (typeof value === 'number') {
            return 4;
        }
    }
    
    
    static getPreferredCanvasFormat() {
        return navigator.gpu.getPreferredCanvasFormat();
    }
    
    static getPrimitiveTopology(object, material) {
        if (object.isMesh) {
            return GPUPrimitiveTopology.TriangleList;
        }
        if (object.isLine) {
            return GPUPrimitiveTopology.LineStrip;
        }
        
        if (object.isPoints) {
            return GPUPrimitiveTopology.PointList;
        }
        
    }
}

export { Utils };