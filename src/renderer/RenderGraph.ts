import { Renderer } from "@/renderer/Renderer";
import { Scene } from "@/core/Scene";
import { Camera } from "@/camera/Camera";
import { RenderPass } from "./RenderPass";

export class RenderGraph {
  private passes: RenderPass[] = [];
  private renderer: Renderer;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  public addPass(pass: RenderPass): void {
    this.passes.push(pass);
  }

  public getPass<T extends RenderPass>(type: new (...args: any[]) => T): T | undefined {
    return this.passes.find((pass) => pass instanceof type) as T | undefined;
  }

  public beforeRender(): void {
    for (const pass of this.passes) {
      if (!pass.beforeRender) continue;
      pass.beforeRender();
    }
  }

  public afterRender(): void {
    for (const pass of this.passes) {
      if (!pass.afterRender) continue;
      pass.afterRender();
    }
  }

  // Execute all registered passes in sequence
  async execute(scene: Scene, camera: Camera): Promise<void> {
    this.beforeRender();

    const commandEncoder = this.renderer.device.createCommandEncoder();
    let previousPass: RenderPass | null = null;
    for (const pass of this.passes) {
      if (!pass.execute) continue;
      if (previousPass) {
        for (const [name, resource] of previousPass.outputs.entries()) {
          pass.inputs.set(name, resource);
        }
      }
      pass.execute(commandEncoder, scene, camera);
      previousPass = pass;
    }
    this.renderer.device.queue.submit([commandEncoder.finish()]);

    this.afterRender();
  }

  // Clear the graph (remove all passes)
  public clear(): void {
    this.passes = [];
  }
}
