import { System } from '../core/System';
import { TransformComponent } from '../components/TransformComponent';
import { ParticleComponent } from '../components/ParticleComponent';
import { World } from '../core/World';
import { rand } from '@/util';
import { ModelComponent } from '../components/ModelComponent';
import { Mesh } from '@/core/Mesh';

export class ParticleSystem implements System {
    private elapsed = 0;

    update(delta: number, world: World) {
        this.elapsed += delta;

        for (const entity of world.getEntities()) {
            const particle = entity.get(ParticleComponent);
            const model = entity.get(ModelComponent);
            
            // Need to work with the actual Mesh
            if (particle && model?.object instanceof Mesh) {
                const mesh = model.object;
                
                if (!particle.initialized) {
                    this.initializeParticles(particle, mesh);
                    particle.initialized = true;
                }

                if (particle.properties.speed) {
                    this.updateParticlePositions(delta, particle, mesh);
                }
            }
        }
    }

    private initializeParticles(particle: ParticleComponent, mesh: Mesh) {
        const { rangeX, rangeZ, height, scale } = particle.properties;
        
        mesh.setAllPositions(Array.from({ length: mesh.count }, () => 
            [rand(-rangeX, rangeX), rand(height?.min || 0, height?.max || 0), rand(-rangeZ, rangeZ)]).flat()
        );

        if (scale) {
            mesh.setAllScales(rand(scale.min, scale.max));
        }

        mesh.setAllRotations(Array.from({ length: mesh.count }, () => 
            [0, -Math.PI / 2, 0]).flat()
        );
    }

    private updateParticlePositions(delta: number, particle: ParticleComponent, mesh: Mesh) {
        const { speed, distance } = particle.properties;
        const translations = [];
        
        for (let i = 0; i < mesh.count; i++) {
            translations.push(
                Math.sin((this.elapsed + i) * speed) * distance * delta,
                Math.cos((this.elapsed + i) * speed) * distance * delta,
                Math.sin((this.elapsed + i) * speed) * distance * delta
            );
        }
        
        mesh.translateAll(translations);
    }
}