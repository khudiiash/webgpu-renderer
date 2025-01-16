import { Engine } from '@/engine/Engine';
import { Demo1Scene } from './scenes/Demo1Scene';

async function main() {
    const engine = await Engine.getInstance().init();
    const demo = new Demo1Scene(engine);
    await demo.init();
    demo.start();
}

main();