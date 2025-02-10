import { GPUPlainType, TypedArray, TypedArrayConstructorLike } from "@/types";
import { alignTo, getTypeAlignment, getTypeSize, getViewType, isPlainType } from "@/util/webgpu";

/** Possible types a struct member can have */
export type StructValue = GPUPlainType | string | Struct | [StructValue, number];

export type StructViewType = TypedArrayConstructorLike<TypedArray> | Record<string, TypedArrayConstructorLike<TypedArray>> | Record<string, TypedArrayConstructorLike<TypedArray>>[];

/** Interface to store layout details of each struct member */
export interface StructLayoutEntry {
  /** Offset in bytes */
  offset: number;
  /** Size in bytes */
  size: number;
  /** Type: Plain | Struct | [Struct, number] */
  type: StructValue;
  /** Alignment in bytes */
  alignment: number;
  /** View Constructor Type */
  viewType: StructViewType;
}

export class Struct {
  private static map: Record<string, Struct> = {};

  public static get(name: string): Struct | undefined {
    return Struct.map[name];
  }

  public static add(struct: Struct): void {
    Struct.map[struct.name] = struct;
  }

  public name: string;
  public layout: Map<string, StructLayoutEntry>;
  public members: Record<string, StructValue>;
  /** Size of the struct in bytes */
  public size: number;

  constructor(name: string, members: Record<string, StructValue>) {
    this.name = name;
    this.layout = new Map();
    this.size = 0;
    this.members = members;

    for (const [key, value] of Object.entries(members)) {
      const entry = this.computeLayoutEntry(value);
      this.layout.set(key, { ...entry, type: value, offset: 0 });
    }

    this.alignMembers();
    Struct.add(this);
  }

  /** Compute the size and alignment for a given type */
  private computeLayoutEntry(value: StructValue): Omit<StructLayoutEntry, 'offset' | 'type'> {
    let size: number;
    let alignment: number;
    let viewType: StructViewType; 

    if (Array.isArray(value)) {
      const [elementType, count] = value;
      alignment = this.getAlignmentOfType(elementType);
      const elementSize = this.getSizeOfType(elementType);
      const byteStride = alignTo(elementSize, alignment);
      size = (byteStride * count);
      if (elementType instanceof Struct) {
        const viewDesc: Record<string, TypedArrayConstructorLike<TypedArray>> = {};
        viewType = [];
        for (const [name, type] of elementType.layout.entries()) {
            viewDesc[name] = type.viewType as TypedArrayConstructorLike<TypedArray>;
        }
        viewType.push(viewDesc);
      }
      else if (isPlainType(elementType as string)) {
        viewType = getViewType(elementType as GPUPlainType);
      } else {
        throw new Error(`Invalid type ${elementType}`);
      }
    } else if (value instanceof Struct) {
      alignment = value.getAlignment();
      size = value.size;
      const viewDesc: Record<string, TypedArrayConstructorLike<TypedArray>> = {};
      for (const [name, type] of value.layout.entries()) {
        viewDesc[name] = type.viewType as TypedArrayConstructorLike<TypedArray>;
      }
      viewType = viewDesc;
    } else {
      viewType = getViewType(value as GPUPlainType) as TypedArrayConstructorLike<TypedArray>;
      alignment = getTypeAlignment(value as GPUPlainType);
      size = getTypeSize(value as GPUPlainType);
    }

    return { size, alignment, viewType };
  }

  /** Recursively get the alignment of a type */
  private getAlignmentOfType(type: StructValue): number {
    if (Array.isArray(type)) {
      const [elementType] = type;
      return this.getAlignmentOfType(elementType);
    } else if (type instanceof Struct) {
      return type.getAlignment();
    } else {
      return getTypeAlignment(type as GPUPlainType);
    }
  }

  /** Recursively get the size of a type */
  private getSizeOfType(type: StructValue): number {
    if (Array.isArray(type)) {
      const [elementType, count] = type;
      const elementSize = this.getSizeOfType(elementType);
      const elementAlignment = this.getAlignmentOfType(elementType);
      const stride = alignTo(elementSize, elementAlignment);
      return stride * count;
    } else if (type instanceof Struct) {
      return type.size;
    } else {
      return getTypeSize(type as GPUPlainType);
    }
  }

  /** Align members and compute their offsets */
  private alignMembers(): void {
    let offset = 0;
    const entries = Array.from(this.layout.entries());

    for (const [key, entry] of entries) {
      const { alignment, size } = entry;
      if (size === 0) {
        // must be storage
        entry.offset = 0;
        continue;
      }
      offset = alignTo(offset, alignment);
      entry.offset = offset;
      offset += size;
      this.layout.set(key, entry);
    }

    const structAlignment = this.getAlignment();
    this.size = alignTo(offset, structAlignment);
  }

  /** Get the maximum alignment required by the struct members */
  public getAlignment(): number {
    let maxAlignment = 0;
    for (const entry of this.layout.values()) {
      if (entry.alignment > maxAlignment) {
        maxAlignment = entry.alignment;
      }
    }
    return maxAlignment;
  }

  /** Produces WGSL code for the struct */
  public toWGSL(): string {
    let str = `struct ${this.name} {\n`;
    for (const [key, entry] of this.layout.entries()) {
      const { type } = entry;
      if (type instanceof Struct) {
        str = `${type.toWGSL()}\n${str}`;
      }
      if (Array.isArray(type)) {
        const [elementType] = type;
        if (elementType instanceof Struct) {
          str = `${elementType.toWGSL()}\n${str}`;
        }
      }
      const typeStr = this.typeToString(type);
      str += `\t${key}: ${typeStr},\n`;
    }
    str += `}\n`;
    if (/\[object/.test(str)) {  
      debugger
    }
    return str;
  }

  /** Helper method to convert a type to a string representation */
  private typeToString(type: StructValue): string {
    if (Array.isArray(type)) {
      const [elementType, count] = type;
      const elementTypeName = elementType instanceof Struct ? elementType.name : elementType.toString();
      return `array<${elementTypeName}, ${count}>`;
    } else if (type instanceof Struct) {
      return type.name;
    } else {
      return type as string;
    }
  }

  /** Get the type at a given offset (used in UniformData) */
  public getTypeAtOffset(offset: number): GPUPlainType | null {
    for (const entry of this.layout.values()) {
      if (entry.offset === offset) {
        if (typeof entry.type === 'string') {
          return entry.type as GPUPlainType;
        }
      }
    }
    return null;
  }
}