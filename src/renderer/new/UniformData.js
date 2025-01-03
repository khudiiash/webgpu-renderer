import { Texture } from "../../loaders/TextureLoader";
import { Utils } from "../../utils";
/**
 * 
 */

export class UniformData {

  static #byID = new Map();
  static #byName = new Map();

  static getByID(id) {
    if (!UniformData.#byID.has(id)) {
      console.warn(`UniformData not found: ${id}`);
      return null;
    }
    return UniformData.#byID.get(id);
  }


  static getByName(name) {
    if (!UniformData.#byName.has(name)) {
      console.warn(`UniformData not found: ${name}`);
      return null;
    }
    return UniformData.#byName.get(name);
  }

  static hasName(name) {
    return UniformData.#byName.has(name);
  }

  static hasID(id) {
    return UniformData.#byID.has(id);
  }


  static setByID(id, data) {
    UniformData.#byID.set(id, data);
  }

  static setByName(name, data) {
    UniformData.#byName.set(name, data);
  }

  constructor(config) {
    const { name, isGlobal, values, group } = config;
    const id = Utils.GUID('data');

    if (isGlobal && !UniformData.hasName(name)) {
      UniformData.setByID(id, this);
      UniformData.setByName(name, this);
    }

    this.name = name;
    this.isGlobal = isGlobal;
    this.id = id;
    this.layout = {};
    this.textures = new Map();
    this.data = null;
    this.dirty = true;
    this.changeCallbacks = [];
    this.rebuildCallback = null;

    if (values) {
      this.setProperties(values);
    }
  }

  /**
   * Creates values for the uniform data  
   * @param {Object} values 
   */
  setProperties(values) {
    const newLayout = {};
    const newTextures = new Map();
    let totalSize = 0;

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
    this.dirty = true;

    // Set up accessors for all properties
    for (const [name, value] of Object.entries(values)) {
      this._setupProperty(name, value);
    }

    if (needsRebuild && this.rebuildCallback) {
      this.rebuildCallback(this.id);
    }
  }


  add(name, value) {
    const values = { ...this._getCurrentValues(), [name]: value };
    this.setProperties(values);
  }

  remove(name) {
    const values = this._getCurrentValues();
    delete values[name];
    this.setProperties(values);
  }

  get(name) {
    return this[name];
  }

  set(name, value) {
    if (!this.layout[name]) {
      this.add(name, value);
    } else {
      this[name] = value;
    }
  }

  has(name) {
    return this.layout[name] !== undefined || this.textures.has(name);
  }

  _getCurrentValues() {
    const values = {};
    for (const name of Object.keys(this.layout)) {
      values[name] = this[name];
    }
    for (const [name, { texture }] of this.textures) {
      values[name] = texture;
    }
    return values;
  }

  _getValueSize(value) {
    if (value instanceof Float32Array) {
      return value.byteLength / Float32Array.BYTES_PER_ELEMENT;
    }
    if (value instanceof Texture || (value && value.width && value.height)) {
      return 0;
    }
    return 1;
  }

  _setupProperty(name, value) {
    const layout = this.layout[name];

    if (!layout) {
      // Texture property
      if (this[name] === undefined) {
        Object.defineProperty(this, name, {
          get: () => this.textures.get(name)?.texture || null,
          set: (value) => {
            if (value instanceof Texture) {
              if (value.ready) {
                this.textures.set(name, value);
              } else {
                value.onReady(() => {
                  this.textures.set(name, value);
                  this.dirty = true;
                  if (this.rebuildCallback) {
                    this.rebuildCallback(this.id);
                  }
                })
              }
            }
          },
          enumerable: true
        });
      }
    } else {
      // Uniform data property
      const { offset, size } = layout;
      let currentValue = value;

      if (value?.onChange) {
        value.onChange((newValue) => {
          this[name] = newValue;
        })
      }

      if (this[name] === undefined) {
        Object.defineProperty(this, name, {
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
            this.dirty = true;
            for (const cb of this.changeCallbacks) {
              cb(this.id, name, value);
            }
          },
          enumerable: true
        });
      }
    }

    this[name] = value;
  }

  /**
   * @returns {GPUBindGroupLayoutDescriptor}
   */
  getBindGroupLayoutDescriptor() {
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

    return { entries };
  }

  /**
   * @returns {import("./GPUResourceManager").BindGroupConfigItem[]}
   */
  getBindings() {
    
    /** @type {import("./GPUResourceManager").BindGroupConfigItem[]}  */
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

  onChange(callback) {
    if (!callback) {
      throw new Error('Callback is undefined');
    }
    if (this.changeCallbacks.indexOf(callback) === -1) {
      this.changeCallbacks.push(callback);
    } 
  }

  onRebuild(callback) {
    if (this.rebuildCallback) return;
    this.rebuildCallback = callback;
  }
}