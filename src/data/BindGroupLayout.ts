import { uuid } from "@/util";
import { Binding } from "./Binding";
import { PipelineManager } from "@/engine";

export class BindGroupLayout {
    private static map = new Map<string, BindGroupLayout>();
    static getByName(name: string) {
        return this.map.get(name);
    }
    public device: GPUDevice;
    public name: string;
    public groupName: string;
    public group: number;
    public bindings: Binding[];
    public layout!: GPUBindGroupLayout;
    public id!: string;
    descriptor: GPUBindGroupLayoutDescriptor;

    constructor(device: GPUDevice, name: string, groupName: string, bindings: Binding[]) {
        this.id = uuid('bind_group_layout');
        this.device = device;
        this.name = name;
        this.group = PipelineManager.getGroupByName(groupName);
        this.groupName = groupName;

        this.bindings = bindings.map((binding, i) => {
            binding.description.group = this.group;
            binding.description.groupName = groupName;
            binding.description.binding = i;
            Binding.set(binding);
            return binding;
        })

        const entries: GPUBindGroupLayoutEntry[] = this.bindings.map(binding => binding.getLayoutEntry());
        this.descriptor = {
            label: this.name,
            entries: entries,
        }
        this.layout = this.device.createBindGroupLayout(this.descriptor);
        BindGroupLayout.map.set(this.name, this);
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

    extendCopy(bindings: Binding[]) {
        return new BindGroupLayout(this.device, this.name, this.groupName, [...this.bindings, ...bindings]);
    }
}