import { Binding } from "./Binding";

export class BindGroupLayout {
    public device: GPUDevice;
    public name: string;
    public groupName: string;
    public bindings: Binding[];
    public layout!: GPUBindGroupLayout;
    descriptor: GPUBindGroupLayoutDescriptor;

    constructor(device: GPUDevice, name: string, groupName: string, bindings: Binding[]) {
        this.device = device;
        this.name = name;
        this.groupName = groupName;
        this.bindings = bindings;
        const entries: GPUBindGroupLayoutEntry[] = this.bindings.map(binding => binding.getLayoutEntry());
        this.descriptor = {
            label: this.name,
            entries: entries,
        }
        this.layout = this.device.createBindGroupLayout(this.descriptor);
        this.bindings.forEach(binding => binding.setBindGroupLayout(this));
    }

    get isGlobal() {
        return this.groupName === 'Global';
    }

    get isMesh() {
        return this.groupName === 'Mesh';
    }

    get isMaterial() {
        return this.groupName === 'Material';
    }
}