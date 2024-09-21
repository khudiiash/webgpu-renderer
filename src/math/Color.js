class Color {
    gpuType = 'vec4f';
    static byteSize = 16;

    constructor(r = 1, g, b, a = 1) {
        this._data = new Float32Array(4);
        if (typeof r === 'string') {
            if (r[0] === '#') {
                this.fromString(r);
            } else {
                this.fromHex(parseInt(r));
            }
            return;
        }
        if (typeof r === 'number' && g === undefined) {
            this.fromHex(r);
            return;
        }

        this._r = r;
        this._g = g;
        this._b = b;
        this._a = a || 1;
        this._data.set([this._r, this._g, this._b, this._a]);
        this.byteSize = this._data.byteLength;
    }
    
    get r() {
        return this._r;
    }

    set r(value) {
        this._r = value;
        this._data[0] = value;
        this.onChangeCallback();
    }

    get g() {
        return this._g;
    }

    set g(value) {
        this._g = value;
        this._data[1] = value;
        this.onChangeCallback();
    }

    get b() {
        return this._b;
    }

    set b(value) {
        this._b = value;
        this._data[2] = value;
        this.onChangeCallback();
    }

    get a() {
        return this._a;
    }

    set a(value) {
        this._a = value;
        this._data[3] = value;
        this.onChangeCallback();
    }

    get data() {
        return this._data;
    }
    
    fromHex(hex) {
        this._r = ((hex >> 16) & 255) / 255;
        this._g = ((hex >> 8) & 255) / 255;
        this._b = (hex & 255) / 255;
        this._a = 1;
        this._data.set([this._r, this._g, this._b, this._a]);
        this.onChangeCallback();
        return this;
    }
    
    fromString(str) {
        const color = parseInt(str.slice(1), 16);
        this._r = ((color >> 16) & 255) / 255;
        this._g = ((color >> 8) & 255) / 255;
        this._b = (color & 255) / 255;
        this._a = 1;
        this._data.set([this._r, this._g, this._b, this._a]);
        this.onChangeCallback();
        return this;
    }
    
    set(r, g, b, a = 1) {
        if (typeof r === 'string') {
            if (r[0] === '#') {
                return this.fromString(r);
            } else {
                return this.fromHex(parseInt(r));
            }
        }
        if (typeof r === 'number' && g === undefined) {
            return this.fromHex(r);
        }
        this._r = r;
        this._g = g;
        this._b = b;
        this._a = a || 1;
        this._data.set([this._r, this._g, this._b, this._a]);
        this.onChangeCallback();
        return this;
    }
    
    copy(color) {
        this._r = color.r;
        this._g = color.g;
        this._b = color.b;
        this._a = color.a;
        this._data.set([this._r, this._g, this._b, this._a]);
        this.onChangeCallback();
        return this;
    }
    
    clone() {
        return new Color(this._r, this._g, this._b, this._a);
    }
    
    printRGBA() {
        return `rgba(${this._r}, ${this._g}, ${this._b}, ${this._a})`;
    }
    
    printHex() {
        return `#${((this._r * 255) << 16 | (this._g * 255) << 8 | (this._b * 255)).toString(16)}`;
    }
    
    onChange(callback) {
        this.onChangeCallback = callback;
    }
    
    onChangeCallback() { }

    
}

export { Color };