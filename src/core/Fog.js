import { Color } from '../math/Color';

class Fog {
    static byteSize = 32;
    
    static struct = {
        color: 'vec4f',
        density: 'f32',
        start: 'f32',
        end: 'f32',
        fogType: 'f32'
    }

    constructor(config) {
        config = {
            color: 0xffffff,
            type: Fog.LINEAR,
            density: 0.00025,
            start: 10,
            end: 100,
            ...config
        };
        this._color = config.color instanceof Color ? config.color : new Color(config.color);
        this._start = config.start;
        this._end = config.end;
        this._density = config.density;
        this._type  = config.type;

        this.byteSize = 32;

        this.isFog = true;

        this._data = new Float32Array([
            this._color.r,
            this._color.g,
            this._color.b,
            this._color.a,
            this._density,
            this._start,
            this._end,
            this._type
        ]);
    }
    
    set color(value) {
        this._color = value;
        this._data.set(this._color.data, 0);
    }
    
    get color() {
        return this._color;
    }
    
    set start(value) {
        this._start = value;
        this._data[4] = value;
    }
    
    get start() {
        return this._start;
    }
    
    set end(value) {
        this._end = value;
        this._data[5] = value;
    }

    get end() {
        return this._end;
    }

    set density(value) {
        this._density = value;
        this._data[6] = value;
    }

    get density() {
        return this._density;
    }

    set type(value) {
        this._type = value;
        this._data[7] = value;
    }

    get type() {
        return this._type;
    }

    set data(value) {
        this._data = value;
    }

    get data() {
        return this._data;
    }
}

Fog.LINEAR = 0;
Fog.EXPONENTIAL = 1;
Fog.EXPONENTIAL_SQUARED = 2;

export { Fog };