class BindGroups {
    constructor() {
        this.bindGroups = [];
    }
    
    addBindGroup(bindGroup) {
        this.bindGroups.push(bindGroup);
    }
    
    getBindGroups() {
        return this.bindGroups;
    }
}