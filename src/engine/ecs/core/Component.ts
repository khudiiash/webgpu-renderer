import { Entity } from './Entity';

export abstract class Component {
    entity?: Entity;
    async deserialize(data: any): Promise<void> {
        Object.assign(this, data);
    }
    serialize(): any {
        return { ...this };
    }
    clone(): Component {
        const clone = new (this.constructor as any)();
        Object.assign(clone, this);
        clone.entity = undefined;
        return clone;
    }
}