import { EngineSettings } from './settings';

export class Engine {

    public static settings: EngineSettings = {
        width: 800,
        height: 600,
        fullscreen: false,
    }

    constructor() {
        console.log('Engine created');
    }

    async init() {
     
    }
}
