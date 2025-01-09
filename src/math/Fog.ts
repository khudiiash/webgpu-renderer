import { Color } from '@/math/Color';
import { BufferData } from '@/data/BufferData';

export type FogConfig = {
    color?: Color | string | number,
    type?: number,
    density?: number,
    start?: number,
    end?: number,
}

export class Fog extends BufferData {

    static LINEAR: number = 0;
    static EXPONENTIAL: number = 1;
    static EXPONENTIAL_SQUARED: number = 2;

    private _color: Color;

    constructor(config: FogConfig = {}) {
        super(4 + 1 + 1 + 1 + 1);
        config = {
            color: 0xffffff,
            type: Fog.LINEAR,
            density: 0.00025,
            start: 10,
            end: 100,
            ...config
        };

        this._color = new Color(config.color).onChange(() => {
            this.set([this._color.r, this._color.g, this._color.b, this._color.a]);
            this.monitor.check();
        });


        this.set([
            this._color.r,
            this._color.g,
            this._color.b,
            this._color.a,
            config.type || Fog.LINEAR,
            config.start || 500,
            config.end || 1000,
            config.density || 0.00025,
        ]);
    }

    get type() { return this[4]; }
    get start() { return this[5]; }
    get end() { return this[6]; }
    get density() { return this[7]; }
    get color() { return this._color; }

    set type(value) { this[4] = value; this.monitor.check(); }
    set start(value) { this[5] = value; this.monitor.check(); }
    set end(value) { this[6] = value; this.monitor.check(); }
    set density(value) { this[7] = value; this.monitor.check(); }

    set color(value) { 
        this._color.offChange();
        this._color = value; 
        this.set([this._color.r, this._color.g, this._color.b, this._color.a]);
        this._color.onChange(() => {
            this.set([this._color.r, this._color.g, this._color.b, this._color.a]);
            this.monitor.check();
        });
        this.monitor.check(); 
    }
    
}