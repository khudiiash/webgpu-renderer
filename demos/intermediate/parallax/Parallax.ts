import { Engine } from '@/engine/Engine';
import { CubeScene } from './scenes/ParallaxScene';

async function main() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const engine = await Engine.getInstance({ fullscreen: true, canvas }).init();
    const demo = new CubeScene(engine);
    await demo.init();
    demo.start();
}

main();