import { System } from '../core/System';
import { TransformComponent } from '../components/TransformComponent';
import { PointLightComponent } from '../components/PointLightComponent';
import { World } from '../core/World';

export class LightAnimationSystem implements System {
    private elapsed = 0;

    update(delta: number, world: World) {
        this.elapsed += delta;

        for (const entity of world.getEntities()) {
            const light = entity.get(PointLightComponent);
            const transform = entity.get(TransformComponent);
            
            if (light?.animation && transform) {
                switch (light.animation.type) {
                    case 'circular':
                        this.updateCircularMotion(light, transform);
                        break;
                    case 'rotate':
                        this.updateRotation(light, transform, delta);
                        break;
                }
            }
        }
    }

    private updateCircularMotion(light: PointLightComponent, transform: TransformComponent) {
        const { radius, speed, axis = 'x' } = light.animation ??  { radius : 1, speed : 1, axis : 'x'};
        
        switch (axis) {
            case 'x':
                transform.position.x = Math.cos(this.elapsed * speed) * (radius ?? 1 );
                break;
            case 'y':
                transform.position.y = Math.cos(this.elapsed * speed) * (radius ?? 1 );
                break;
            case 'z':
                transform.position.z = Math.cos(this.elapsed * speed) * (radius ?? 1 );
                break;
        }
    }

    private updateRotation(light: PointLightComponent, transform: TransformComponent, delta: number) {
        const { speed, mode } = light.animation ?? { speed : 1, mode : 'self'};
        if (mode === 'self') {
            // Self rotation
            light.light.rotation.x += speed * delta;
            light.light.rotation.z += speed * delta;
        } else {
            transform.rotation.x += speed * delta;
            transform.rotation.z += speed * delta;
        }
    }
}