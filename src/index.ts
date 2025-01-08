import { Engine } from './engine/Engine';

const engine = new Engine({ fullscreen: true, canvas: document.getElementById('canvas') as HTMLCanvasElement });
engine.init();
