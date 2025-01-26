import { System } from '../core/System';
import { TransformComponent } from '../components/TransformComponent';
import { ParticleComponent } from '../components/ParticleComponent';
import { World } from '../core/World';
import { rand } from '@/util';

export class ParticleSystem implements System {
    private elapsed = 0;

    update(delta: number, world: World) {
        this.elapsed += delta;

        for (const entity of world.getEntities()) {
            const particle = entity.get(ParticleComponent);
            const transform = entity.get(TransformComponent);
            
            if (particle && transform) {
                if (!particle.initialized) {
                    this.initializeParticles(particle, transform);
                    particle.initialized = true;
                }

                if (particle.properties.speed) {
                    this.updateParticlePositions(delta, particle, transform);
                }
            }
        }
    }

    private initializeParticles(particle: ParticleComponent, transform: TransformComponent) {
        const { rangeX, rangeZ, height, scale } = particle.properties;
        
        const positions = [];
        for (let i = 0; i < particle.count; i++) {
            positions.push(
                rand(-rangeX, rangeX),
                rand(height?.min || 0, height?.max || 0),
                rand(-rangeZ, rangeZ)
            );
        }
        transform.setPositions(positions);

        if (scale) {
            transform.setScales(Array(particle.count).fill(0).map(() => 
                rand(scale.min, scale.max)
            ));
        }

        transform.setRotations(Array(particle.count).fill([0, -Math.PI / 2, 0]).flat());
    }

    private updateParticlePositions(delta: number, particle: ParticleComponent, transform: TransformComponent) {
        const { speed, distance } = particle.properties;
        const translations = [];
        
        for (let i = 0; i < particle.count; i++) {
            translations.push(
                Math.sin((this.elapsed + i) * speed) * distance * delta,
                Math.cos((this.elapsed + i) * speed) * distance * delta,
                Math.sin((this.elapsed + i) * speed) * distance * delta
            );
        }
        
        transform.translate(translations);
    }
}