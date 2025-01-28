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
    
        //console.log('Camera found:', camera?.get(PerspectiveCameraComponent).camera);
        //console.log('Scene found:', scene?.get(SceneComponent).scene);
    
        if (!camera || !scene) {
            throw new Error('Required camera or scene entity not found');
        }
    
        //const sceneComponent = scene.get(SceneComponent);
        //const cameraComponent = camera.get(PerspectiveCameraComponent);
    
        //console.log('Scene meshes:', sceneComponent.scene.meshes);
        //console.log('Camera position:', cameraComponent.camera.position);
    
        let lastTime = performance.now();
    
        const animate = () => {
            const now = performance.now();
            const delta = (now - lastTime) / 1000;
            lastTime = now;

            // Update scene time
            scene.get(SceneComponent).scene.update();
            
            // Update world with proper delta
            this.world.update(delta);
            
            engine.renderer.render(scene.get(SceneComponent).scene, camera.get(PerspectiveCameraComponent).camera);
            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }
}