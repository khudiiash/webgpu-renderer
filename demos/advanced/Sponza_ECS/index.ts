import { Engine } from '@/engine/Engine';
import { SponzaScene } from './scenes/SponzaScene';
import configRaw from './config.yaml?raw'
import { parse } from 'yaml'

async function main() {
    
    const engine = Engine.getInstance( {fullscreen : true});
    await engine.init();
    
    const scene = new SponzaScene();
    const config = parse(configRaw);
    await scene.init(config);
    scene.start();
}

main();