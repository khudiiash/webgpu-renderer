import { Shader } from "@/materials";
import { RenderState } from "@/renderer/RenderState";
import { GPUPlainType, TypedArray, TypedArrayConstructorLike, } from "@/types";

export function align16(value: number): number {
    return Math.ceil(value / 16) * 16;
}

export function align4(value: number): number {
    return Math.ceil(value / 4) * 4;
}

export function isAlign16(value: number): boolean {
    return value % 16 === 0;
}

export function isAlign4(value: number): boolean {
    return value % 4 === 0;
}


export function alignTo(value: number, alignment: number): number {
    return Math.ceil(value / alignment) * alignment;
}

export function bytesToElementCount(sizeInBytes: number, bytesPerElement: number): number {
    return sizeInBytes / bytesPerElement;
  }
  

/** create view from buffer, byte offset, and size in bytes */
export function createView<T extends TypedArray>(
    buffer: ArrayBuffer,
    byteOffset: number,
    sizeInBytes: number,
    TypedArrayConstructor: TypedArrayConstructorLike<T>
): T {
    const length = bytesToElementCount(sizeInBytes, TypedArrayConstructor.BYTES_PER_ELEMENT);
    return new TypedArrayConstructor(buffer, byteOffset, length) as T;
}

export function getViewType(type: GPUPlainType): TypedArrayConstructorLike<TypedArray> {
    switch (true) {
        case /f/.test(type):
            return Float32Array;
        case /i/.test(type):
            return Int32Array;
        case /u/.test(type):
            return Uint32Array;
        default:
            return Float32Array;
    }
}

export function getNumElements(type: GPUPlainType): number {
    switch (type) {
      case "f32":
      case "i32":
      case "u32":
        return 1;
      case "vec2f":
      case "vec2i":
      case "vec2u":
        return 2;
      case "vec3f":
      case "vec3i":
      case "vec3u":
        return 3;
      case "vec4f":
      case "vec4i":
      case "vec4u":
        return 4;
      case "mat2x2f":
        return 4;
      case "mat3x3f":
        return 9;
      case "mat4x4f":
        return 16;
      default:
        throw new Error(`Unsupported type ${type}`);
    }
}

export function isPlainType(type: any): type is GPUPlainType {
    return Object.keys(TYPE_SIZES).includes(type);
}

export function isArrayType(type: any): boolean {
   return type.includes('array');
}

export function isBufferView(type: any): boolean {
    return type instanceof Float32Array || type instanceof Uint32Array || type instanceof Int32Array;
}

export function isRecord(type: any): boolean {
    return type instanceof Object && !Array.isArray(type);
}


export function alignArray(array: ArrayLike<number>): Float32Array {
    const len = array.length;
    const aligned = new Float32Array(align4(len));
    aligned.set(array);
    return aligned;
}

// Size in bytes
const TYPE_SIZES: Record<GPUPlainType, number> = {
    'bool': 4,
    'i32': 4,
    'u32': 4,
    'f32': 4,
    'f16': 2,
    'vec2f': 8,
    'vec2u': 8,
    'vec2i': 8,
    'vec2h': 4,
    'vec3f': 12,
    'vec3u': 12,
    'vec3i': 12,
    'vec3h': 6,
    'vec4f': 16,
    'vec4u': 16,
    'vec4i': 16,
    'vec4h': 8,
    'mat2x2f': 16,
    'mat2x3f': 24,
    'mat2x4f': 32,
    'mat3x2f': 24,
    'mat3x3f': 36,
    'mat3x4f': 48,
    'mat4x2f': 32,
    'mat4x3f': 48,
    'mat4x4f': 64,
    'mat2x2h': 8,
    'mat2x3h': 12,
    'mat2x4h': 16,
    'mat3x2h': 12,
    'mat3x3h': 18,
    'mat3x4h': 24,
    'mat4x2h': 16,
    'mat4x3h': 24,
    'mat4x4h': 32,
    'atomic<u32>': 4,
    'atomic<i32>': 4,
} as const;

// Alignment requirements in bytes
const TYPE_ALIGNMENTS: Record<GPUPlainType, number> = {
    'bool': 4,
    'i32': 4,
    'u32': 4,
    'f32': 4,
    'f16': 2,
    'vec2f': 8,
    'vec2u': 8,
    'vec2i': 8,
    'vec2h': 4,
    'vec3f': 16,
    'vec3u': 16,
    'vec3i': 16,
    'vec3h': 8,
    'vec4f': 16,
    'vec4u': 16,
    'vec4i': 16,
    'vec4h': 8,
    'mat2x2f': 16,
    'mat2x3f': 16,
    'mat2x4f': 16,
    'mat3x2f': 16,
    'mat3x3f': 16,
    'mat3x4f': 16,
    'mat4x2f': 16,
    'mat4x3f': 16,
    'mat4x4f': 16,
    'mat2x2h': 8,
    'mat2x3h': 8,
    'mat2x4h': 8,
    'mat3x2h': 8,
    'mat3x3h': 8,
    'mat3x4h': 8,
    'mat4x2h': 8,
    'mat4x3h': 8,
    'mat4x4h': 8,
    'atomic<u32>': 4,
    'atomic<i32>': 4,
} as const;

// Get the size of a type in bytes
export function getTypeSize(type: GPUPlainType): number {
    return TYPE_SIZES[type as keyof typeof TYPE_SIZES] || 0;
}

// Get the alignment of a type in bytes
export function getTypeAlignment(type: GPUPlainType): number {
    return TYPE_ALIGNMENTS[type as keyof typeof TYPE_ALIGNMENTS] || 0;
}

export function getArrayTypeAlignment(type: string): number {
   const match = type.match(/([a-z][a-z\d]+)(?=,|>)/);
   if (!match) {
       return 0;
   }
  return getTypeAlignment(match[1] as GPUPlainType);
}

export function usageToString(usage: GPUBufferUsageFlags): string {
    const names = [];
    if (usage & GPUBufferUsage.COPY_SRC) names.push('COPY_SRC');
    if (usage & GPUBufferUsage.COPY_DST) names.push('COPY_DST');
    if (usage & GPUBufferUsage.INDEX) names.push('INDEX');
    if (usage & GPUBufferUsage.VERTEX) names.push('VERTEX');
    if (usage & GPUBufferUsage.UNIFORM) names.push('UNIFORM');
    if (usage & GPUBufferUsage.STORAGE) names.push('STORAGE');
    if (usage & GPUBufferUsage.INDIRECT) names.push('INDIRECT');
    if (usage & GPUBufferUsage.QUERY_RESOLVE) names.push('QUERY_RESOLVE');
    return names.join(' | ');
}

export function hashPipelineState(shader: Shader, renderState: RenderState): string {
  return JSON.stringify({
    vertex: shader.vertexSource,
    fragment: shader.fragmentSource,
    primitive: renderState.getPrimitive(),
    depthStencil: renderState.getDepthStencil(),
    blend: renderState.getBlendState(),
  });
}