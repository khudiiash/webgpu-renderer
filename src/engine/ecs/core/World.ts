import { Entity } from './Entity';
import { System } from './System';
import { componentRegistry } from './ComponentRegistry';
import { systemRegistry } from './SystemRegistry';
import { PerspectiveCameraComponent } from '../components/PerspectiveCameraComponent';
import { SceneComponent } from '../components/SceneComponent';

export class World {
    private entities: Map<number, Entity> = new Map();
    private systems: System[] = [];
    private nextEntityId = 0;
    private prefabs: Map<string, any> = new Map();

    createEntity(): Entity {
        const entity = new Entity(this.nextEntityId++);
        this.entities.set(entity.id, entity);
        return entity;
    }

    removeEntity(entity: Entity) {
        this.entities.delete(entity.id);
    }

    addSystem(system: System) {
        this.systems.push(system);
    }

    update(delta: number) {
        for (const system of this.systems) {
            system.update(delta, this);
        }
    }

    findEntity(predicate: (entity: Entity) => boolean): Entity | undefined {
        for (const entity of this.entities.values()) {
            if (predicate(entity)) {
                return entity;
            }
        }
        return undefined;
    }

    getEntities(): Entity[] {
        return Array.from(this.entities.values());
    }

    async loadFromYAML(config: any) {
        if (config.systems) {
            for (const systemData of config.systems) {
                const SystemClass = systemRegistry.get(systemData.type);
                if (SystemClass) {
                    const system = new SystemClass();
                    if (systemData.properties) {
                        Object.assign(system, systemData.properties);
                    }
                    this.addSystem(system);
                }
            }
        }

        if (config.camera) {
            const cameraEntity = this.createEntity();
            const camera = new PerspectiveCameraComponent();
            await camera.deserialize(config.camera);
            cameraEntity.add(camera);
        }

        if (config.scene) {
            const sceneEntity = this.createEntity();
            const scene = new SceneComponent();
            await scene.deserialize(config.scene);
            sceneEntity.add(scene);
        }

        if (config.prefabs) {
            for (const [name, data] of Object.entries<any>(config.prefabs)) {
                this.prefabs.set(name, data);
            }
        }

        if (config.entities) {
            for (const entityData of config.entities) {
                const entity = this.createEntity();
                if (entityData.prefab) {
                    const prefab = this.prefabs.get(entityData.prefab);
                    if (prefab) {
                        await this.applyComponentData(entity, prefab);
                    }
                }
                await this.applyComponentData(entity, entityData);
            }
        }

        return this;
    }

    private async applyComponentData(entity: Entity, data: any) {
        for (const [componentName, props] of Object.entries<any>(data.components || {})) {
            const ComponentClass = componentRegistry.get(componentName);
            if (ComponentClass) {
                const component = new ComponentClass();
                await component.deserialize(props);
                entity.add(component);
            }
        }
    }
}