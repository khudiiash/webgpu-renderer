import { System } from "../core/System";
import { World } from "../core/World";
import { PerspectiveCameraComponent } from "../components/PerspectiveCameraComponent";
import { PointLightComponent } from "../components/PointLightComponent";

export class TransformAnimationSystem implements System {
    private elapsed = 0;
 
    update(delta: number, world: World) {
        this.elapsed += delta;
 
        // Camera circular motion
        const cameraEntity = world.findEntity(e => e.has(PerspectiveCameraComponent));
        if (cameraEntity) {
            const camera = cameraEntity.get(PerspectiveCameraComponent).camera;
            camera.position.x = Math.sin(this.elapsed * 0.3) * 200;
        }
 
        // Light animations
        for (const entity of world.getEntities()) {
            const light = entity.get(PointLightComponent);
            if (light?.light) {
                if (light.animation?.type === 'circular') {
                    light.light.position.x = Math.cos(this.elapsed * 0.3) * 200;
                } else if (light.animation?.type === 'rotate') {
                    light.light.rotation.x += delta;
                    light.light.rotation.z += delta;
                }
            }
        }
    }
 }