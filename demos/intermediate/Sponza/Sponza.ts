import { Engine } from '@/engine/Engine';
import { SponzaScene } from './scenes/SponzaScene';

async function main() {
    const engine = await Engine.getInstance({ fullscreen: true }).init();
    const demo = new SponzaScene(engine);
    await demo.init();
    demo.start();
}

main();