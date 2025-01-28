import { GrassSystem } from '../systems/GrassSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { LightAnimationSystem } from '../systems/LightAnimationSystem';
import { CameraAnimationSystem } from '../systems/CameraAnimationSystem';
import { TransformAnimationSystem } from '../systems/TransformAnimationSystem';

export const systemRegistry = new Map<string, any>([
    ['GrassSystem', GrassSystem],
    ['ParticleSystem', ParticleSystem],
    ['LightAnimationSystem', LightAnimationSystem],
    ['CameraAnimationSystem', CameraAnimationSystem],
    ['TransformAnimationSystem', TransformAnimationSystem]
]);