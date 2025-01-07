import { uuid } from '@/util';
import { BufferData } from '@/data';
import { Texture } from './Texture';


export type UniformDataType = BufferData | Texture | number;

export type UniformDataValues = Record<string, UniformDataType>;

export type UniformDataLayout = Record<string, { offset: number, size: number }>;

export type UniformDataConfig = {
    name: string;
    isGlobal: boolean;
    values: Record<string, UniformDataType>;
}


export class UniformData {

    static #byID = new Map();
    static #byName = new Map();
  
    static getByID(id: string): UniformData | null {
      if (!UniformData.#byID.has(id)) {
        console.warn(`UniformData not found: ${id}`);
        return null;
      }
      return UniformData.#byID.get(id);
    }
  
  
    static getByName(name: string): UniformData | null {
      if (!UniformData.#byName.has(name)) {
        console.warn(`UniformData not found: ${name}`);
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


    public name: string;
    public isGlobal: boolean;
    public id: string;
    public textures: Map<string, Texture>;
    public data!: Float32Array;
    public values: UniformDataValues;

    private layout: UniformDataLayout;
    private changeCallbacks: Function[];
    private rebuildCallbacks: Function[];
  
    constructor(config: UniformDataConfig) {
      const { name, isGlobal, values } = config;
      const id = uuid('uniform_data');
  
      if (isGlobal && !UniformData.hasName(name)) {
        UniformData.setByName(name, this);
      }
  
      UniformData.setByID(id, this);
  
      this.name = name;
      this.isGlobal = isGlobal;
      this.id = id;
      this.layout = {};
      this.values = {};
      this.textures = new Map();
      this.changeCallbacks = [];
      this.rebuildCallbacks = [];
  
      if (values) {
        this.setProperties(values);
      }
    }
  
    setProperties(values: { [s: string]: UniformDataType; }) {
      const newLayout = {} as UniformDataLayout;
      const newTextures = new Map();
      let totalSize = 0;
  
      for (const [name, value] of Object.entries(values)) {
        if (value instanceof Texture) {
          newTextures.set(name, value);
          this.values[name] = value;
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
  
      // Second pass: migrate existing data and set up new properties
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
  
      // Set up accessors for all properties
      for (const [name, value] of Object.entries(values)) {
        this._setupProperty(name, value);
      }
  
      if (needsRebuild && this.rebuildCallbacks) {
        this.rebuildCallbacks.forEach((cb) => {
          cb(this.id);
        });
      }
    }
  
  
    add(name: string, value: UniformDataType) {
        this.values[name] = value;
        this.setProperties(this.values);
    }
  
    remove(name: string | number) {
      delete this.values[name];
      this.setProperties(this.values);
    }
  
    get(name: string | number) {
      return this.values[name];
    }
  
    set(name: string, value: Texture | BufferData) {
      if (!this.values[name]) {
        this.add(name, value);
      } else {
        this.values[name] = value;
      }
    }
  
    has(name: string) {
      return this.values[name] !== undefined;
    }
  
    _getValueSize(value: UniformDataType): number {
      if (value instanceof Float32Array) {
        return value.byteLength / Float32Array.BYTES_PER_ELEMENT;
      }
      if (value instanceof Texture) {
        return 0;
      }
      return 1;
    }
  
    _handleTexture(name: string, texture: Texture) {
      if (!(texture instanceof Texture)) return;
  
      if (texture.loaded) {
        this.textures.set(name, texture);
      } else {
        texture.onLoaded(() => {
          this.textures.set(name, texture);
          if (this.rebuildCallbacks) {
            this.rebuildCallbacks.forEach((cb) => {
              cb(this.id);
            });
          }
        })
      }
  
      if (this.values[name] === undefined) {
        Object.defineProperty(this.values, name, {
          get: () => this.values[name],
          set: (newValue) => {
            this.textures.set(name, newValue);
            if (this.rebuildCallbacks) {
              this.rebuildCallbacks.forEach((cb) => {
                cb(this.id);
              });
            }
          },
          enumerable: true
        });
      }
    }
  
    _setupProperty(name: string, value: UniformDataType) {
      const layout = this.layout[name];
  
      if (value instanceof Texture) {
        this._handleTexture(name, value);
      }
  
      if (value instanceof Texture) {
        // Texture property
      } else if (value instanceof BufferData) {
        // Uniform data property
        const { offset } = layout;
        let currentValue = value;
  
        if (value?.onChange) {
          value.onChange((newValue: Texture | BufferData) => {
            this.values[name] = newValue;
          })
        }
  
        if (value instanceof Texture) {
          this._handleTexture(name, value);
        }
  
        if (this.values[name] === undefined) {
          Object.defineProperty(this.values, name, {
            get: () => currentValue,
            set: (value) => {
              currentValue = value;
              if (value instanceof Float32Array) {
                this.data.set(value, offset);
              } else if (value?.constructor?.name === 'Color') {
                this.data.set(value.data, offset);
              } else {
                this.data[offset] = value;
              }
              for (const cb of this.changeCallbacks) {
                cb(this.id, name, value);
              }
            },
            enumerable: true
          });
        }
      } else if (typeof value === 'number') {
        // Single float property
        if (this.values[name] === undefined) {
          Object.defineProperty(this.values, name, {
            get: () => this.data[layout.offset],
            set: (newValue) => {
              this.data[layout.offset] = newValue;
              for (const cb of this.changeCallbacks) {
                cb(this.id, name, newValue);
              }
            },
            enumerable: true
          });
        }
      }
  
      this.values[name] = value;
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
        // Texture binding
        entries.push({
          label: name,
          binding: entries.length,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {}
        });
  
        // Add sampler binding if we haven't seen this type
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
  
    getBindings() {
      
      const items = [];
  
      if (this.data?.length > 0) {
        items.push({
          name: this.name,
          binding: 0,
          dataID: this.id,
          resource: {
            buffer: { 
              isGlobal: this.isGlobal,
              data: this.data,
              size: this.data.byteLength,
              type: 'uniform',
              usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            }
          }
        });
      }
  
      const samplerBindings = new Map();
  
      for (const [name, texture] of this.textures) {
        // Texture view
        items.push({
          name,
          binding: items.length,
          resource: {
             texture,
          }
        });
  
        const samplerType = texture.samplerType;
  
        // Reuse sampler for same type
        if (!samplerBindings.has(samplerType)) {
          samplerBindings.set(samplerType, items.length);
          items.push({
            name: 'sampler',
            binding: items.length,
            resource: {
              sampler: { type: samplerType }
            }
          });
        }
      }
  
      return items;
    }
  
    getBufferDescriptor() {
      if (!this.data?.length) return null;
  
      return {
        data: this.data,
        size: this.data.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        offset: 0,
      };
    }
  
    getData() {
      return this.data;
    }
  
    getTextures() {
      return this.textures;
    }
  
    onChange(callback: Function) {
      if (!callback) {
        throw new Error('Callback is undefined');
      }
      if (this.changeCallbacks.indexOf(callback) === -1) {
        this.changeCallbacks.push(callback);
      } 
    }
  
    onRebuild(callback: Function) {
      if (!callback) {
        throw new Error('Callback is undefined');
      }
      if (this.rebuildCallbacks.indexOf(callback) === -1) {
        this.rebuildCallbacks.push(callback);
      } 
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