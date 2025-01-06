import { EngineSettings } from './settings';
import { Object3D, Scene } from './core';
import { Euler, Quaternion, Vector3 } from './math';

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
        const scene = new Scene();
    }
}
