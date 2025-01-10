import { Engine } from './engine/Engine';

declare global {
    var engine: Engine;
}

const engine = new Engine({ fullscreen: true, canvas: document.getElementById('canvas') as HTMLCanvasElement });
globalThis.engine = engine;

engine.init();
