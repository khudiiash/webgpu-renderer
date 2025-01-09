import { Engine } from './engine/Engine';

const engine = new Engine({ fullscreen: true, canvas: document.getElementById('canvas') as HTMLCanvasElement });
await engine.init().catch(error => console.error('Engine initialization failed:', error));
