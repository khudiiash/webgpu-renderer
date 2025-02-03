import { uuid } from '@/util/general';
import { BufferData } from './BufferData';
import { Texture } from './Texture';

export type UniformDataType = BufferData | Texture | number;
export type UniformDataValues = Record<string, UniformDataType>;
export type UniformDataLayout = Record<string, { offset: number, size: number }>;

export type UniformDataConfig = {
    name: string;
    isGlobal: boolean;
    type?: 'uniform' | 'storage';
    values: Record<string, UniformDataType>;
}

export type UniformChangeCallback = (id: string, name: string, value: any) => void;
export type UniformRebuildCallback = (id: string) => void;

export class UniformData {
    static #byID = new Map();
    static #byName = new Map();
  
    static getByID(id: string): UniformData | null {
      if (!UniformData.#byID.has(id)) {
        return null;
      }
      return UniformData.#byID.get(id);
    }
  
    static getByName(name: string): UniformData | null {
      if (!UniformData.#byName.has(name)) {
        return null;
      }
      return UniformData.#byName.get(name);
    }
  
    static hasName(name: string): boolean {
      return UniformData.#byName.has(name);
    }
  
    static hasID(id: string): boolean {
      return UniformData.#byID.has(id);
    }
  
    static setByID(id: string, data: UniformData): void {
      UniformData.#byID.set(id, data);
    }
  
    static setByName(name: string, data: UniformData): void {
      UniformData.#byName.set(name, data);
    }


    public readonly name: string;
    public readonly isGlobal: boolean;
    public readonly id: string;
    public type: 'uniform' | 'storage' = 'uniform';
    private parent: any;
    
    private layout: UniformDataLayout;
    private changeCallbacks: UniformChangeCallback[];
    private rebuildCallbacks: UniformRebuildCallback[];
    public data!: Float32Array;
    public textures: Map<string, Texture>;
  
    constructor(parent: any, config: UniformDataConfig) {
      const { name, isGlobal, values, type } = config;
      this.type = type || 'uniform';
      const id = uuid('uniform_data');
  
      if (isGlobal && !UniformData.hasName(name)) {
        UniformData.setByName(name, this);
      }
  
      UniformData.setByID(id, this);
  
      this.parent = parent;
      this.name = name;
      this.isGlobal = isGlobal;
      this.id = id;
      this.layout = {};
      this.textures = new Map();
      this.changeCallbacks = [];
      this.rebuildCallbacks = [];
  
      if (values) {
        this.setProperties(values);
      }
    }
  
    private setProperties(values: { [s: string]: UniformDataType; }) {
      const newLayout = {} as UniformDataLayout;
      const newTextures = new Map();
      let totalSize = 0;
  
      // First pass: calculate layout
      for (const [name, value] of Object.entries(values)) {
        if (value instanceof Texture) {
          newTextures.set(name, value);
          continue;
        }
  
        const size = this._getValueSize(value);
        if (size > 0) {
          newLayout[name] = { offset: totalSize, size };
          totalSize += size;
        }
      }
  
      // align to 16 bytes
      totalSize = Math.ceil(totalSize / 4) * 4 + 4;
  
      const needsRebuild = !this.data || this.data.length !== totalSize;
      const newData = needsRebuild ? new Float32Array(totalSize) : this.data;
  
      // Migrate existing data
      if (needsRebuild && this.data) {
        for (const [name, oldLayout] of Object.entries(this.layout)) {
          const newPos = newLayout[name];
          if (newPos) {
            const size = Math.min(oldLayout.size, newPos.size);
            newData.set(
              this.data.subarray(oldLayout.offset, oldLayout.offset + size),
              newPos.offset
            );
          }
        }
      }
  
      // Update instance state
      this.layout = newLayout;
      this.textures = newTextures;
      this.data = newData;
      // Set up getters and setters for all properties on parent
      for (const [name, value] of Object.entries(values)) {
        this._defineProperty(name, value);
      }
  
      if (needsRebuild) {
        this.rebuildCallbacks.forEach((cb) => cb(this.id));
      }
    }
  
    private _defineProperty(name: string, value: UniformDataType) {
      const layout = this.layout[name];
  
      if (value instanceof Texture) {
        this._handleTexture(name, value);
        Object.defineProperty(this.parent, name, {
          get: () => this.textures.get(name),
          set: (newValue: Texture) => {
            this._handleTexture(name, newValue);
            this.rebuildCallbacks.forEach(cb => cb(this.id));
          },
          enumerable: true,
          configurable: true
        });
      } else if (value instanceof BufferData) {
        const { offset } = layout;

        value.onChange(() => {
          this.data.set(value as BufferData, offset);
          this.changeCallbacks.forEach(cb => cb(this.id, name, value));
        })

        Object.defineProperty(this.parent, name, {
          get: () => value,
          set: (newValue: BufferData) => {
            if (newValue !== value) {
              newValue.onChange(() => {
                this.data.set(newValue, offset);
                this.changeCallbacks.forEach(cb => cb(this.id, name, newValue));
              });

              this.changeCallbacks.forEach(cb => cb(this.id, name, newValue));
              value = newValue;
              this.parent[name] = newValue;
            }
            this.data.set(newValue, offset);
          },
          enumerable: true,
          configurable: true
        });
      } else if (typeof value === 'number') {
        Object.defineProperty(this.parent, name, {
          get: () => this.data[layout.offset],
          set: (newValue: number) => {
            if (this.parent[name] === newValue) return;
            this.data[layout.offset] = newValue;
            this.parent[name] = newValue;
            this.changeCallbacks.forEach(cb => cb(this.id, name, newValue));
          },
          enumerable: true,
          configurable: true
        });
      }

      this.parent[name] = value;
    }
  
    private _handleTexture(name: string, texture: Texture) {
      if (!(texture instanceof Texture)) return;
  
      if (texture.loaded) {
        this.textures.set(name, texture);
      } else {
        texture.onLoaded(() => {
          this.textures.set(name, texture);
          this.rebuildCallbacks.forEach(cb => cb(this.id));
        });
      }
    }
  
    private _getValueSize(value: UniformDataType): number {
      if (value instanceof Float32Array) {
        return value.byteLength / Float32Array.BYTES_PER_ELEMENT;
      }
      if (value instanceof Texture) {
        return 0;
      }
      return 1;
    }

    add(name: string, value: UniformDataType) {
      this._defineProperty(name, value);
      this.setProperties({ ...this.getProperties(), [name]: value });
    }
  
    remove(name: string) {
      const props = this.getProperties();
      delete props[name];
      delete this.parent[name];
      this.setProperties(props);
    }

    getProperties(): Record<string, UniformDataType> {
      const props: Record<string, UniformDataType> = {};
      for (const [name, layout] of Object.entries(this.layout)) {
        props[name] = this.parent[name];
      }
      for (const [name, texture] of this.textures) {
        props[name] = texture;
      }
      return props;
    }

    set(name: string, value: UniformDataType) {
      const props = this.getProperties();
      props[name] = value;
      this.setProperties(props);
    }

    get(name: string): UniformDataType {
      return this.parent[name];
    }

    getData() {
      return this.data;
    }
  
    getTextures() {
      return this.textures;
    }

    getBindGroupLayoutDescriptor(): GPUBindGroupLayoutDescriptor {
      const entries = [];
  
      if (this.data?.length > 0) {
        entries.push({
          label: this.name,
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' }
        });
      }
  
      const samplerBindings = new Map();
  
      for (const [name, texture] of this.textures) {
        entries.push({
          label: name,
          binding: entries.length,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {}
        });
  
        const samplerType = texture.samplerType;
        if (!samplerBindings.has(samplerType)) {
          samplerBindings.set(samplerType, entries.length);
          entries.push({
            label: 'sampler',
            binding: entries.length,
            visibility: GPUShaderStage.FRAGMENT,
            sampler: {}
          });
        }
      }
  
      return { entries } as GPUBindGroupLayoutDescriptor;
    }
  
    getBufferDescriptor() {
      if (!this.data?.length) return null;
      const usage = this.type === 'storage' ? GPUBufferUsage.STORAGE : GPUBufferUsage.UNIFORM;
  
      return {
        data: this.data,
        size: this.data.byteLength,
        usage: usage | GPUBufferUsage.COPY_DST,
        offset: 0,
      };
    }
  
    onChange(callback: UniformChangeCallback): this {
      if (!callback) throw new Error('Callback is undefined');
      
      if (!this.changeCallbacks.includes(callback)) {
        this.changeCallbacks.push(callback);
      } else {
        console.warn('Callback already exists', callback);
      } 
      return this;
    }
  
    onRebuild(callback: UniformRebuildCallback): this {
      if (!callback) throw new Error('Callback is undefined');
      if (!this.rebuildCallbacks.includes(callback)) {
        this.rebuildCallbacks.push(callback);
      } 

      return this;
    }
  
    offChange(callback: Function) {
      const index = this.changeCallbacks.indexOf(callback);
      if (index !== -1) {
        this.changeCallbacks.splice(index, 1);
      }
    }
  
    offRebuild(callback: Function) {
      const index = this.rebuildCallbacks.indexOf(callback);
      if (index !== -1) {
        this.rebuildCallbacks.splice(index, 1);
      }
    }
}