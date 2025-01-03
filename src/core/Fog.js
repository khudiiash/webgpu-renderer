import { Color } from '../math/Color';
import { DataMonitor } from '../utils/DataMonitor';

class Fog extends Float32Array{
    constructor(config) {
        super(8);
        config = {
            color: 0xffffff,
            type: Fog.LINEAR,
            density: 0.00025,
            start: 10,
            end: 100,
            ...config
        };

        let color = new Color(config.color).onChange(() => {
            this.set([color.r, color.g, color.b, color.a]);
            this.monitor.check();
        });

        Object.defineProperties(this, {
            monitor: { value: new DataMonitor(this, this), writable: false },
            color: { 
                set: (newColor) => {
                    color = newColor;
                    this.set([color.r, color.g, color.b, color.a]);
                    color.onChange(() => this.set([color.r, color.g, color.b, color.a]));
                    this.monitor.check();
                },
                get: () => color 
            },
            isFog : { value: true, writable: false },
        });

        this.set([
            config.color.r,
            config.color.g,
            config.color.b,
            config.color.a,
            config.type,
            config.start,
            config.end,
            config.density,
        ]);
    }

    get type() { return this[4]; }
    get start() { return this[5]; }
    get end() { return this[6]; }
    get density() { return this[7]; }

    set type(value) { this[4] = value; this.monitor.check(); }
    set start(value) { this[5] = value; this.monitor.check(); }
    set end(value) { this[6] = value; this.monitor.check(); }
    set density(value) { this[7] = value; this.monitor.check(); }
    
}

Fog.LINEAR = 0;
Fog.EXPONENTIAL = 1;
Fog.EXPONENTIAL_SQUARED = 2;

export { Fog };