import { World } from '@/engine/ecs/core/World';
import { PerspectiveCameraComponent } from '@/engine/ecs/components/PerspectiveCameraComponent';
import { SceneComponent } from '@/engine/ecs/components/SceneComponent';
import { Engine } from '@/engine/Engine';

export class SponzaScene {
    private world: World;

    constructor() {
        this.world = new World();
    }

    async init(config: any) {
        await this.world.loadFromYAML(config);

        const scene = this.world.findEntity(entity => entity.has(SceneComponent));
        scene?.get(SceneComponent).attachToWorld(this.world);

        await this.startRendering();
    }

    start() {
        
    }

    private async startRendering() {
        const engine = Engine.getInstance();
        const camera = this.world.findEntity(entity => entity.has(PerspectiveCameraComponent));
        const scene = this.world.findEntity(entity => entity.has(SceneComponent));
    
        console.log('Camera found:', camera?.get(PerspectiveCameraComponent).camera);
        console.log('Scene found:', scene?.get(SceneComponent).scene);
    
        if (!camera || !scene) {
            throw new Error('Required camera or scene entity not found');
        }
    
        const sceneComponent = scene.get(SceneComponent);
        const cameraComponent = camera.get(PerspectiveCameraComponent);
    
        console.log('Scene meshes:', sceneComponent.scene.meshes);
        console.log('Camera position:', cameraComponent.camera.position);
    
        const animate = () => {
            this.world.update(1000);
            engine.renderer.render(sceneComponent.scene, cameraComponent.camera);
            requestAnimationFrame(animate);
        };
    
        requestAnimationFrame(animate);
    }
}