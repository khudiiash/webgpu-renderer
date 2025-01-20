import { BufferBindGroupLayoutDescriptor, GPUAccess, SamplerBindGroupLayoutDescriptor, StorageTextureBindGroupLayoutDescriptor, TextureBindGroupLayoutDescriptor } from "@/types";
import { BindGroupLayout } from "./BindGroupLayout";



type BindingDescriptor = {
    bindGroupLayout?: BindGroupLayout;
    groupName: string;
    bindingName: string;
    group: number;
    binding: number;
    bindingType: 'buffer' | 'texture' | 'sampler';
    bufferType: 'uniform' | 'storage' | 'read-only-storage';
    bufferAccess: GPUAccess;
    visibility: GPUShaderStageFlags;
    layout?: BufferBindGroupLayoutDescriptor | TextureBindGroupLayoutDescriptor | StorageTextureBindGroupLayoutDescriptor | SamplerBindGroupLayoutDescriptor;
    struct?: string;
    varName: string;
    varType: string;
}

export class Binding {

    private static mapGroup = new Map<string | number, Binding[]>();
    private static map = new Map<string, Binding>();
    static getGroup(group: string | number) {
        return this.mapGroup.get(group);
    }
    static getByName(name: string) {
        return this.map.get(name);
    }
    static getByNames(group: string, binding: string) {
        const g = this.mapGroup.get(group);
        if (!g) return;
        return g.find(b => b.description.bindingName === binding);
    }
    static getByIndices(group: number, binding: number) {
        const g = this.mapGroup.get(group);
        if (!g) return;
        return g.find(b => b.description.group === binding || b.description.binding === binding);
    }
    static set(binding: Binding) {
        this.map.set(binding.description.bindingName, binding);
        let group = this.mapGroup.get(binding.description.groupName);
        if (!group) {
            group = [];
            this.mapGroup.set(binding.description.groupName, group);
            this.mapGroup.set(binding.description.group, group);
        }
        group.push(binding);
    }

    description: BindingDescriptor;

    constructor(group: number, binding: number, groupName: string, bindingName: string) {
        this.description = {
            groupName: groupName,
            bindingName: bindingName,
            group: group,
            binding: binding,
            bindingType: 'buffer',
            bufferType: 'uniform',
            bufferAccess: 'read',
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            layout: {},
            struct: '',
            varName: '',
            varType: '',
        }

        Binding.set(this);
    } 

    uniform() {
        this.description.bufferType = 'uniform';
        return this;
    }

    storage(access: GPUAccess) {
        this.description.bufferType = access === 'read' ? 'read-only-storage' : 'storage';
        this.description.bufferAccess = access;
        this.description.layout = {
            type: this.bufferType
        }
        return this;
    }

    visibility(...args: Array<'vertex' | 'fragment' | 'compute'>) {
        this.description.visibility = 0;
        args.forEach(arg => {
            this.description.visibility |= GPUShaderStage[arg.toUpperCase() as keyof typeof GPUShaderStage];
        }); 
        return this;
    }

    var(name: string, type: string) {
        this.description.varName = name;
        this.description.varType = type;
        return this;
    }

    texture(layout: TextureBindGroupLayoutDescriptor = {}) {
        this.description.bindingType = 'texture';
        this.description.visibility = GPUShaderStage.FRAGMENT;
        this.description.layout = layout;
        return this;
    }

    sampler(layout: SamplerBindGroupLayoutDescriptor = {}) {
        this.description.bindingType = 'sampler';
        this.description.visibility = GPUShaderStage.FRAGMENT;
        this.description.layout = layout;
        return this;
    }

    storageTexture(layout: StorageTextureBindGroupLayoutDescriptor) {
        this.description.bindingType = 'texture';
        this.description.visibility = GPUShaderStage.FRAGMENT;
        this.description.layout = layout;
        return this;
    }

    layout(layout: BufferBindGroupLayoutDescriptor | TextureBindGroupLayoutDescriptor | StorageTextureBindGroupLayoutDescriptor | SamplerBindGroupLayoutDescriptor) {
        this.description.layout = layout;
        return this;
    }

    get isBuffer() {
        return this.description.bindingType === 'buffer';
    }

    get isTexture() {
        return this.description.bindingType === 'texture';
    }

    get isSampler() {
        return this.description.bindingType === 'sampler';
    }

    get isUniform() {
        return this.description.bufferType === 'uniform';
    }

    get bufferType() {
        return this.description.bufferType;
    }

    get bufferAccess() {
        return this.description.bufferAccess;
    }

    get isStorage() {
        return this.description.bufferType === 'storage';
    }

    getLayoutEntry() {
        const entry: GPUBindGroupLayoutEntry = {
            binding: this.description.binding,
            visibility: this.description.visibility,
        }
        if (this.isBuffer) {
            entry.buffer = {
                ...this.description.layout as BufferBindGroupLayoutDescriptor,
            }
        }
        if (this.isTexture) {
            entry.texture = {
                ...this.description.layout as TextureBindGroupLayoutDescriptor,
            }
        }
        if (this.isSampler) {
            entry.sampler = {
                ...this.description.layout as SamplerBindGroupLayoutDescriptor,
            }
        }

        return entry;
    }

    getBindGroupEntry(resource: GPUBuffer | GPUTexture | GPUSampler) {
        const entry: GPUBindGroupEntry = {
            binding: this.description.binding,
            resource: {} as GPUBindingResource
        }
        if (this.isBuffer) {
            entry.resource = { buffer: resource as GPUBuffer };
        }

        if (this.isTexture) {
            entry.resource = (resource as GPUTexture).createView();
        }

        if (this.isSampler) {
            entry.resource = resource as GPUSampler;
        }

        return entry;
    }

    setBindGroupLayout(layout: BindGroupLayout) {
        this.description.bindGroupLayout = layout;
    }

    getBindGroupLayout(): BindGroupLayout | undefined {
        return this.description.bindGroupLayout;
    }

    shouldInsert(stage: string) {
        return this.description.visibility & GPUShaderStage[stage.toUpperCase() as keyof typeof GPUShaderStage];
    }

    public toWGSL(): string {
        let group = `@group(${this.description.group}) @binding(${this.description.binding})`;
        let str = '';
        if (this.isBuffer) {
            const varType = this.bufferType === 'uniform' ? 'uniform' : 'storage';
            const access = this.isUniform ? '' : `, ${this.description.bufferAccess}`;
            str = `${group} var<${varType}${access}> ${this.description.varName}: ${this.description.varType};`;
        } else {
            str = `${group} var ${this.description.varName}: ${this.description.varType};`;
        } 
        if (/\[object/.test(str)) {
            debugger
        }
        return str;
    }
}