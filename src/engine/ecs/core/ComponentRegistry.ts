import { TransformComponent } from '../components/TransformComponent';
import { PointLightComponent } from '../components/PointLightComponent';
import { ModelComponent } from '../components/ModelComponent';
import { ParticleComponent } from '../components/ParticleComponent';
import { PerspectiveCameraComponent } from '../components/PerspectiveCameraComponent';
import { SceneComponent } from '../components/SceneComponent';

export const componentRegistry = new Map<string, any>([
    ['TransformComponent', TransformComponent],
    ['PointLightComponent', PointLightComponent],
    ['ModelComponent', ModelComponent],
    ['ParticleComponent', ParticleComponent],
    ['PerspectiveCameraComponent', PerspectiveCameraComponent],
    ['SceneComponent', SceneComponent]
]);