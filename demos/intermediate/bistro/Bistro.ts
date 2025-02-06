import { Engine } from '@/engine/Engine';
import { BistroScene } from './scenes/BistroScene';

async function main() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const engine = await Engine.getInstance({ fullscreen: true, canvas }).init();
    const demo = new BistroScene(engine);
    await demo.init();
    demo.start();
}

main();