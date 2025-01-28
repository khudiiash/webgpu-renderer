import { System } from "../core/System";
import { World } from "../core/World";
import { PerspectiveCameraComponent } from "../components/PerspectiveCameraComponent";
import { PointLightComponent } from "../components/PointLightComponent";
import { TransformComponent } from "../components/TransformComponent";

export class TransformAnimationSystem implements System {
    private elapsed = 0;
 
    update(delta: number, world: World) {
        this.elapsed += delta;
 
        // Camera circular motion
        const cameraEntity = world.findEntity(e => e.has(PerspectiveCameraComponent));
        if (cameraEntity) {
            const camera = cameraEntity.get(PerspectiveCameraComponent).camera;
            const pos = cameraEntity.get(TransformComponent).position;
            camera.position.x = pos.x;
        }
 
    }
 }