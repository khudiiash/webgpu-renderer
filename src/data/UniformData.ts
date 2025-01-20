import { num, uuid } from '@/util/general';
import { BufferData } from './BufferData';
import { Texture } from './Texture';
import { Struct, StructValue } from './Struct';
import { GPUPlainType, TypedArray } from '@/types';
import { alignTo, getArrayTypeAlignment, getTypeAlignment, getViewType, isArrayType, isBufferView, isPlainType, isRecord } from '@/util/webgpu';
import { Binding } from './Binding';

export type UniformDataType = BufferData | Texture | number;
export type UniformDataValuesConfig = { [key: string]: UniformDataType };
export type UniformViews = { [key: string]: TypedArray | Record<string, TypedArray>  | Record<string, TypedArray>[] };

/** Configuration for creating a UniformData instance */
export interface UniformDataConfig {
  name: string;
  isGlobal: boolean;
  struct?: Struct;
  type?: 'uniform' | 'storage';
  values: UniformDataValuesConfig;
}

export type UniformLayoutEntry = {
  offset: number;
  size: number;
  alignment: number;
  type: StructValue;
};


/** Callback types for change and rebuild events */
type UniformChangeCallback = (id: string, start: number, end: number) => void;
type UniformRebuildCallback = (id: string) => void;

/** Class representing uniform data for shaders */
export class UniformData {
  // Static maps to keep track of UniformData instances
  private static readonly byID = new Map<string, UniformData>();
  private static readonly byName = new Map<string, UniformData>();
  public entries: UniformDataValuesConfig;

  public static getByID(id: string): UniformData | null {
    return this.byID.get(id) || null;
  }

  public static getByName(name: string): UniformData | null {
    return this.byName.get(name) || null;
  }

  public static hasName(name: string): boolean {
    return this.byName.has(name);
  }

  public static setByID(id: string, data: UniformData): void {
    this.byID.set(id, data);
  }

  public static setByName(name: string, data: UniformData): void {
    this.byName.set(name, data);
  }

  public readonly name: string;
  public readonly isGlobal: boolean;
  public readonly id: string;
  public readonly struct?: Struct;
  public readonly type: 'uniform' | 'storage' | 'read-only-storage' = 'uniform';

  private parent: any;
  private arrayBuffer!: ArrayBuffer;
  private views!: UniformViews;

  private items: Map<string, UniformDataType>;
  private layout: Map<string, UniformLayoutEntry>;
  private textures: Map<string, Texture>;

  private changeCallbacks: UniformChangeCallback[] = [];
  private rebuildCallbacks: UniformRebuildCallback[] = [];

  constructor(parent: any, config: UniformDataConfig) {
    const { name, isGlobal, struct, values, type = 'uniform' } = config;
    this.parent = parent;
    this.name = name;
    this.isGlobal = isGlobal;
    this.struct = struct;
    this.type = type;
    this.id = uuid('uniform_data');

    if (isGlobal && !UniformData.hasName(name)) {
      UniformData.setByName(name, this);
    }
    UniformData.setByID(this.id, this);
    this.entries = values;
    this.items = new Map(Object.entries(values));
    this.textures = new Map();
    this.layout = new Map();
    const binding = Binding.getByName(this.name);
    if (binding) {
       this.type = binding.bufferType;
    }
    this.initializeLayoutAndBuffer();
    this.views = this.createViews(this.layout, this.arrayBuffer);
    this.defineProperties();
    this.setValues(this.items);
  }

  /** Initializes the layout and buffer based on the struct or values */
  private initializeLayoutAndBuffer() {
    if (this.struct) {
      for (const [key, entry] of this.struct.layout.entries()) {
        this.layout.set(key, {
          offset: entry.offset,
          size: entry.size,
          alignment: entry.alignment,
          type: entry.type,
        });
      }
      this.arrayBuffer = new ArrayBuffer(this.struct.size);
    } else {
      // Build layout based on values (assuming basic types)
      const binding = Binding.getByName(this.name);
      if (!binding) {
        console.error(`Binding not found for uniform data "${this.name}"`);
        return;
      }

      let offset = 0;
      for (const [key, value] of this.items.entries()) {
        let size = 0;
        let type: GPUPlainType | string = 'f32'; // Default type for scalars

        if (value instanceof BufferData) {
          size = value.byteLength;
          type = binding.description.varType;
        } else if (value instanceof Texture) {
          size = 0;
          this.textures.set(key, value);
          continue;
        } else if (typeof value === 'number') {
          size = 4; 
          type = 'f32';
        } 

        const alignment = isPlainType(type) ? getTypeAlignment(type as GPUPlainType) : isArrayType(type) ? getArrayTypeAlignment(type) : 0;
        offset = alignTo(offset, alignment) || 0;
        this.layout.set(key, { offset, size, alignment, type });
        offset += size;
      }
      this.arrayBuffer = new ArrayBuffer(offset);
    }
  }

  private createViews(layout: Map<string, UniformLayoutEntry>, buffer: ArrayBuffer, baseOffset: number = 0): any {
    const views: UniformViews = {};

    for (const [key, entry] of layout.entries()) {
      const offset = baseOffset + entry.offset;
      const type = entry.type;
  
      if (Array.isArray(type)) {
        // Handle arrays
        const [elementType, count] = type;
        views[key] = [];
  
        const stride = alignTo(entry.size / count, entry.alignment);
        for (let i = 0; i < count; i++) {
          const elementOffset = offset + i * stride;
          if (elementType instanceof Struct) {
            // Recursively create views for structs
            const elementViews = this.createViews(elementType.layout, buffer, elementOffset);
            views[key].push(elementViews);
          } else {
            // Create views for primitive types
            const viewConstructor = getViewType(elementType as GPUPlainType);
            (views as unknown as Record<string, TypedArray[]>)[key].push(new viewConstructor(buffer, elementOffset, entry.size / 4) as TypedArray);
          }
        }
      } else if (type instanceof Struct) {
        // Recursively create views for structs
        views[key] = this.createViews(type.layout, buffer, offset);
      } else {
        // Create views for primitive types
        const viewConstructor = getViewType(type as GPUPlainType);
        try {
          views[key] = new viewConstructor(buffer, offset, entry.size / 4);
        } catch (e) {
          debugger;
        }
      }
    }

    return views;
  }

  private setValue(key: string, data: UniformDataType, start?:number, end?:number): void {
    const view = this.views[key];

    if (num(data)) {
      (this.views[key] as TypedArray).set([data as number]);
      return;
    }

    if (Array.isArray(view)) {
      const layout = this.layout.get(key);
      if (!layout) return;
      const [struct, count] = layout?.type as [Struct, number];
      const stride = struct.size / 4;
      if (start !== undefined && end !== undefined) {
        const viewIndex = start / stride | 0;
        const viewStart = start % stride;
        const viewEnd = Math.min(end - (viewIndex * stride), stride);
        const subdata = (data as BufferData).subarray(start, end);
        for (const [subKey, subView] of Object.entries(view[viewIndex])) {
          const typeLayout = struct.layout.get(subKey);
          if (!typeLayout) continue;
          const offset = typeLayout.offset / 4;
          if (offset < viewStart) continue;
          if (offset >= viewEnd) break;
          subView.set(subdata.subarray(offset - viewStart, offset - viewStart + typeLayout.size / 4));
        }
      } else {
        // Set all values
        const stride = struct.size / 4;
        for (let i = 0; i < count; i++) {
          const subdata = (data as BufferData).subarray(i * stride, (i + 1) * stride);
          for (const [subKey, subView] of Object.entries(view[i])) {
            const typeLayout = struct.layout.get(subKey);
            if (!typeLayout) continue;
            const start = typeLayout.offset / 4;
            subView.set(subdata.subarray(start, start + typeLayout.size / 4));
          }
        }
      }
    } else if (isBufferView(view)) {
        if (data instanceof BufferData) {
          const subdata = data.subarray(start!, end!);
          (view as TypedArray).set(subdata, start);
        }
        if (num(data)) {
          (view as TypedArray)[start!] = data as number;
        }
    } else if (isRecord(view)) {
      const struct = this.layout.get(key)?.type as Struct;
      start = start ?? 0;
      end = end ?? (data as BufferData).length;
      for (const [subKey, subView] of Object.entries(view)) {
        const typeLayout = struct.layout.get(subKey);
        if (!typeLayout) continue;
        const offset = typeLayout.offset / 4;
        if (offset < start) continue;
        if (offset >= end) break;
        subView.set((data as BufferData).subarray(offset, offset + typeLayout.size / 4));
      }
    } else if (data instanceof Texture) {
      this.textures.set(key, data);
    } else {
      console.warn(`Invalid data type for key "${key}"`);
    }

  }

  private setValues(values: Map<string, UniformDataType>): void {
    for (const [key, value] of values) {
      this.setValue(key, value);
    }
  }

  public subarray(start: number = 0, end: number = this.arrayBuffer.byteLength / 4): Float32Array {
    return new Float32Array(this.arrayBuffer, start * 4, end - start);
  }
  /** Sets a single value and updates the buffer */
  public set(name: string, value: UniformDataType): void {
    if (!this.layout.has(name)) {
      console.warn(`Uniform "${name}" does not exist in the layout`);
      return;
    }

    const layout = this.layout.get(name)!;
    const start = layout.offset / 4;
    const end = (layout.offset + layout.size) / 4;

    if (value instanceof Texture) {
      this.textures.set(name, value);
      this.items.set(name, value);
      this.notifyRebuild();
      return;
    }

    if (!this.views[name]) {
      console.warn(`No view found for uniform "${name}"`);
      return;
    }

    this.items.set(name, value);
    
    if (value instanceof BufferData) {
      if (value.byteLength !== layout.size) {
        console.warn(`Buffer size mismatch for "${name}": expected ${layout.size}, got ${value.byteLength}`);
        return;
      }
    }


    if (num(value)) {
      const view = this.views[name] as TypedArray;
      if (view[0] === value) return;
    }

    this.setValue(name, value, start, end);
    this.notifyChange(start, end);
  }

  /** Gets a value from the items */
  public get(name: string): UniformDataType | undefined {
    return this.items.get(name);
  }

  /** Provides the ArrayBuffer containing the uniform data */
  public getBuffer(): ArrayBuffer {
    return this.arrayBuffer;
  }

  public getBufferUsage() {
    return this.type === 'uniform' ? GPUBufferUsage.UNIFORM : GPUBufferUsage.STORAGE;
  }

  public getBufferDescriptor() {
    const usage = this.getBufferUsage();

    return {
      data: this.arrayBuffer,
      size: this.arrayBuffer.byteLength,
      usage: usage | GPUBufferUsage.COPY_DST,
      offset: 0,
    };
  }

  /** Retrieves the list of textures */
  public getTextures(): Map<string, Texture> {
    return this.textures;
  }

  public getTexture(name: string): Texture | undefined {
    return this.textures.get(name);
  }

  /** Defines properties on the parent object to access uniform values directly */
  private defineProperties(): void {
    for (const [key, value] of this.items) {
      if (value instanceof Texture) {
        this.defineTextureProperty(key);
      } else if (value instanceof BufferData) {
        this.defineBufferProperty(key, value);
      } else if (typeof value === 'number' || Array.isArray(value) || typeof value === 'object') {
        this.defineValueProperty(key);
      }
    }
  }

  /** Defines a property on the parent for a scalar, array, or object value */
  private defineValueProperty(name: string): void {
    Object.defineProperty(this.parent, name, {
      get: () => this.get(name),
      set: (newValue: UniformDataType) => {
        this.set(name, newValue);
      },
      enumerable: true,
      configurable: true,
    });
  }

  /** Defines a property on the parent for a texture */
  private defineTextureProperty(name: string): void {
    Object.defineProperty(this.parent, name, {
      get: () => this.textures.get(name),
      set: (newValue: Texture) => {
        if (newValue instanceof Texture) {
          this.textures.set(name, newValue);
          this.notifyRebuild();
        } else {
          console.warn(`Value assigned to texture property "${name}" is not a Texture.`);
        }
      },
      enumerable: true,
      configurable: true,
    });
  }

/** Defines a property on the parent for a buffer data */
private defineBufferProperty(name: string, bufferData: BufferData): void {
  // Retrieve the view corresponding to the property name
  const viewEntry = this.views[name] as TypedArray;
  if (!viewEntry) {
    console.error(`View for property "${name}" not found.`);
    return;
  }
  const offset = this.layout.get(name)!.offset / 4;

  const updateBufferData = (start: number = 0, end: number = bufferData.length) => {
    this.setValue(name, bufferData, start, end);
    this.notifyChange(offset + start, offset + end);
  }
  bufferData.onChange((_, start, end) => updateBufferData(start, end));

  updateBufferData();

  Object.defineProperty(this.parent, name, {
    get: () => bufferData,
    set: (newValue: BufferData) => {
      if (newValue instanceof BufferData) {
        if (newValue === bufferData) return;
        bufferData.offChange();
        bufferData = newValue;
        bufferData.onChange((_, start, end) => updateBufferData(start, end));
        updateBufferData();
      } else {
        console.warn(`Value assigned to BufferData property "${name}" is not a BufferData instance.`);
      }
    },
    enumerable: true,
    configurable: true,
  });
}


  /** Registers a callback to be called when values change */
  public onChange(callback: UniformChangeCallback): this {
    if (!this.changeCallbacks.includes(callback)) {
      this.changeCallbacks.push(callback);
    }
    return this;
  }

  /** Unregister a previously registered change callback */
  public offChange(callback: UniformChangeCallback): this {
    const index = this.changeCallbacks.indexOf(callback);
    if (index !== -1) {
      this.changeCallbacks.splice(index, 1);
    }
    return this;
  }

  /** Registers a callback to be called when the uniform data is rebuilt */
  public onRebuild(callback: UniformRebuildCallback): this {
    if (!this.rebuildCallbacks.includes(callback)) {
      this.rebuildCallbacks.push(callback);
    }
    return this;
  }

  /** Unregisters a previously registered rebuild callback */
  public offRebuild(callback: UniformRebuildCallback): this {
    const index = this.rebuildCallbacks.indexOf(callback);
    if (index !== -1) {
      this.rebuildCallbacks.splice(index, 1);
    }
    return this;
  }

  /** Triggers the rebuild event callbacks */
  public notifyRebuild(): void {
    this.rebuildCallbacks.forEach((cb) => cb(this.id));
  }

  /** Notifies listeners about a value change */
  public notifyChange(start: number = 0, end: number = this.arrayBuffer.byteLength / 4): void {
    this.changeCallbacks.forEach((cb) => cb(this.id, start, end));
  }


  /** For debugging: output the uniform data layout */
  public toString(): string {
    let str = `UniformData ${this.name} {\n`;
    for (const [key, entry] of this.layout.entries()) {
      const { offset, size, type } = entry;
      const typeStr = this.typeToString(type);
      str += `  ${key}: ${typeStr}; // offset: ${offset}, size: ${size}\n`;
    }
    str += `}\n`;
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

  public rebuild(): void {
      this.initializeLayoutAndBuffer(); 
      this.views = this.createViews(this.layout, this.arrayBuffer);
      this.defineProperties();
      this.setValues(this.items);
      this.notifyRebuild();
  }

  /** Destroys the uniform data and cleans up resources */
  public destroy(): void {
    this.changeCallbacks = [];
    this.rebuildCallbacks = [];
    this.items.clear();
    this.textures.clear();
    this.layout.clear();
    this.views.f32 = new Float32Array(0);
    this.views.i32 = new Int32Array(0);
    this.views.u32 = new Uint32Array(0);
    this.arrayBuffer = new ArrayBuffer(0);
    UniformData.byID.delete(this.id);
    if (this.isGlobal) {
      UniformData.byName.delete(this.name);
    }
  }
}