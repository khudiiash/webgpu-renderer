export type GPUBaseType = 'f32' | 'i32' | 'u32';

export type GPUPlainType = 
    'bool' | 'i32' | 'u32' | 'f16' | 'f32' |
    'vec2f' | 'vec3f' | 'vec4f' |
    'vec2i' | 'vec3i' | 'vec4i' |
    'vec2u' | 'vec3u' | 'vec4u' |
    'vec2h' | 'vec3h' | 'vec4h' |
    'mat2x2f' | 'mat2x3f' | 'mat2x4f' |
    'mat3x2f' | 'mat3x3f' | 'mat3x4f' |
    'mat4x2f' | 'mat4x3f' | 'mat4x4f' |
    'mat2x2h' | 'mat2x3h' | 'mat2x4h' |
    'mat3x2h' | 'mat3x3h' | 'mat3x4h' |
    'mat4x2h' | 'mat4x3h' | 'mat4x4h' |
    'atomic<u32>' | 'atomic<i32>';

export type GPUAccess = 'read' | 'write' | 'read_write';
export type GPUTextureFormat = 
    'rgba8unorm' | 'rgba8snorm' | 'rgba8uint'   |
    'rgba16uint' | 'rgba16sint' | 'rgba16float' |
    'r32uint'    | 'r32sint'    | 'r32float'    |
    'rg32uint'   | 'rg32sint'   | 'rg32float'   |
    'rgba32uint' | 'rgba32sint' | 'rgba32float' |
    'bgra8unorm';

export type GPUStruct = { name: string, layout: Record<string, GPUType> };
export type TypedArray = 
    | Int8Array 
    | Uint8Array 
    | Uint8ClampedArray 
    | Int16Array 
    | Uint16Array 
    | Int32Array 
    | Uint32Array 
    | Float32Array 
    | Float64Array;

export interface TypedArrayConstructorLike<T extends TypedArray> {
    new(buffer: ArrayBuffer, byteOffset?: number, length?: number): T;
    BYTES_PER_ELEMENT: number;
}

export type BufferBindGroupLayoutDescriptor = {
    hasDynamicOffset?: boolean;
    minBindingSize?: number;
    type?: GPUBufferBindingType
}

export type TextureBindGroupLayoutDescriptor = {
    multisampled?: boolean; 
    sampleType?: GPUTextureSampleType;
    viewDimension?: GPUTextureViewDimension;
}

export type StorageTextureBindGroupLayoutDescriptor = {
    access?: GPUStorageTextureAccess;
    format?: GPUTextureFormat;
    viewDimension?: GPUTextureViewDimension;
}

export type SamplerBindGroupLayoutDescriptor = {
    type?: GPUSamplerBindingType;
}
