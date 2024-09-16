export function createBindGroupLayout(device, entries) {
    return device.createBindGroupLayout({
        entries
    });
}

export function createBindGroup(device, bindGroupLayout, bindings) {
    return device.createBindGroup({
        layout: bindGroupLayout,
        bindings
    });
}