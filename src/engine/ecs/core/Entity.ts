import { Component } from './Component';

export class Entity {
    private components: Map<string, Component> = new Map();
    
    constructor(public readonly id: number) {}

    add(component: Component): this {
        component.entity = this;
        this.components.set(component.constructor.name, component);
        return this;
    }

    remove(component: Component): this {
        this.components.delete(component.constructor.name);
        component.entity = undefined;
        return this;
    }

    get<T extends Component>(componentType: new (...args: any[]) => T): T  {
        return this.components.get(componentType.name) as T;
    }

    has(componentType: new (...args: any[]) => Component): boolean {
        return this.components.has(componentType.name);
    }

    getComponents(): Component[] {
        return Array.from(this.components.values());
    }
}