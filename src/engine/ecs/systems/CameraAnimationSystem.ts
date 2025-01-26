import { System } from '../core/System';
import { TransformComponent } from '../components/TransformComponent';
import { PerspectiveCameraComponent } from '../components/PerspectiveCameraComponent';
import { World } from '../core/World';

export class CameraAnimationSystem implements System {
    private elapsed = 0;

    update(delta: number, world: World) {
        this.elapsed += delta;

        for (const entity of world.getEntities()) {
            const camera = entity.get(PerspectiveCameraComponent);
            const transform = entity.get(TransformComponent);
            
            if (camera?.animation && transform) {
                switch (camera.animation.type) {
                    case 'circular':
                        this.updateCircularMotion(camera, transform);
                        break;
                    case 'linear':
                        this.updateLinearMotion(camera, transform, delta);
                        break;
                }
            }
        }
    }

    private updateCircularMotion(camera: PerspectiveCameraComponent, transform: TransformComponent) {
        const { radius, speed, axis = 'x' } = camera.animation ?? { radius : 1, speed : 1, axis : 'x'};
        
        switch (axis) {
            case 'x':
                transform.position.x = Math.cos(this.elapsed * speed) * (radius ?? 1);
                break;
            case 'y':
                transform.position.y = Math.cos(this.elapsed * speed) * (radius ?? 1);
                break;
            case 'z':
                transform.position.z = Math.cos(this.elapsed * speed) * (radius ?? 1);
                break;
        }
    }

    private updateLinearMotion(camera: PerspectiveCameraComponent, transform: TransformComponent, delta: number) {
    const { speed } = camera.animation ?? { speed : 1 };
        transform.position.x += speed * delta;
    }
}