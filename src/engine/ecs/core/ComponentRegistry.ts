import { Transform } from '../components/Transform';
import { PointLightComponent } from '../components/PointLightComponent';
import { Model } from '../components/Model';
import { Particle } from '../components/Particle';
import { PerspectiveCameraComponent } from '../components/PerspectiveCameraComponent';
import { SceneComponent } from '../components/SceneComponent';

export const componentRegistry = new Map<string, any>([
    ['Transform', Transform],
    ['PointLightComponent', PointLightComponent],
    ['Model', Model],
    ['Particle', Particle],
    ['PerspectiveCameraComponent', PerspectiveCameraComponent],
    ['SceneComponent', SceneComponent]
]);