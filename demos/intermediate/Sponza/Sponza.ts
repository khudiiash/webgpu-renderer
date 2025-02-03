import { Engine } from '@/engine/Engine';
import { SponzaScene } from './scenes/SponzaScene';

async function main() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const engine = await Engine.getInstance({ fullscreen: true, canvas }).init();
    const demo = new SponzaScene(engine);
    await demo.init();
    demo.start();
}

main();