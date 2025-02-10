import { Renderer } from '@/renderer/Renderer';
import { Scene } from '@/core/Scene';
import { Camera } from '@/camera/Camera';
import { RenderPass } from './RenderPass';

export class RenderGraph {
    private passes: RenderPass[] = [];
    private renderer: Renderer;

    constructor(renderer: Renderer) {
        this.renderer = renderer;
    }

    // Add a render pass to the graph
    public addPass(pass: RenderPass): void {
        this.passes.push(pass);
    }

    // Optionally, retrieve a pass by its class/type
    public getPass<T extends RenderPass>(type: new (...args: any[]) => T): T | undefined {
        return this.passes.find(pass => pass instanceof type) as T | undefined;
    }

    // Execute all registered passes in sequence
    public execute(scene: Scene, camera: Camera): void {
        const commandEncoder = this.renderer.device.createCommandEncoder();
        let previousPass: RenderPass | null = null;
        for (const pass of this.passes) {
            if (previousPass) { 
                for (const [name, resource] of previousPass.outputs.entries()) {
                    pass.inputs.set(name, resource);
                }
            };
            pass.execute(commandEncoder, scene, camera);
            previousPass = pass;
        }
        this.renderer.device.queue.submit([commandEncoder.finish()]);
    }

    // Clear the graph (remove all passes)
    public clear(): void {
        this.passes = [];
    }
}