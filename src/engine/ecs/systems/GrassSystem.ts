import { System } from '../core/System';
import { TransformComponent } from '../components/TransformComponent';
import { ModelComponent } from '../components/ModelComponent';
import { World } from '../core/World';
import { rand } from '@/util';

export class GrassSystem implements System {
    update(delta: number, world: World) {
        for (const entity of world.getEntities()) {
            const model = entity.get(ModelComponent);
            const transform = entity.get(TransformComponent);
            
            if (model?.material?.shader?.name === 'grass' && transform && !transform.initialized) {
                this.initializeGrassInstances(model, transform);
                transform.initialized = true;
            }
        }
    }

    private initializeGrassInstances(model: ModelComponent, transform: TransformComponent) {
        const { rangeX, rangeZ, initialScale } = model.properties;
        
        transform.setPositions(Array.from({ length: transform.instanceCount }, () => 
            [rand(-rangeX, rangeX), 0, rand(-rangeZ, rangeZ)]).flat()
        );

        transform.setScales(Array.from({ length: transform.instanceCount }, () => 
            [
                rand(initialScale.min, initialScale.max),
                rand(initialScale.min * 2, initialScale.max * 2),
                1
            ]).flat()
        );

        transform.setRotations(Array.from({ length: transform.instanceCount }, () => 
            [0, -Math.PI / 2, 0]).flat()
        );
    }
}