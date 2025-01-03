import { DataMonitor } from '../utils/DataMonitor';

class Color extends Float32Array {
    static byteSize = 16;
    
    static cleanFloat(value) {
        if (!isFinite(value)) {
            console.warn('Color value is not finite', value);
            return 0;
        }
        const str = value.toFixed(7);
        return parseFloat(str);
    }

    constructor(r = 0xffffff, g, b, a = 1) {
        if (r instanceof Color) {
            return r;
        }
        super(4);

        Object.defineProperties(this, {
            isColor: { value: true, writable: false },
            monitor: { value: new DataMonitor(this, this), writable: false },
        })

        if (typeof r === 'string') {
            if (r[0] === '#') {
                this.fromString(r);
            } else {
                this.fromHex(parseInt(r));
            }
            return;
        }
        if (typeof r === 'number' &&  g === undefined) {
            this.fromHex(r);
            return;
        }

        this[0] = Color.cleanFloat(r);
        this[1] = Color.cleanFloat(g);
        this[2] = Color.cleanFloat(b);
        this[3] = Color.cleanFloat(a || 1);
    }
    
    get r() { return Color.cleanFloat(this[0]); }
    get g() { return Color.cleanFloat(this[1]); }
    get b() { return Color.cleanFloat(this[2]); }
    get a() { return Color.cleanFloat(this[3]); }

    set r(value) { this[0] = Color.cleanFloat(value); this.monitor.check(); }
    set g(value) { this[1] = Color.cleanFloat(value); this.monitor.check(); }
    set b(value) { this[2] = Color.cleanFloat(value); this.monitor.check(); }
    set a(value) { this[3] = Color.cleanFloat(value); this.monitor.check(); }
    

    fromHex(hex) {
        this[0] = Color.cleanFloat(((hex >> 16) & 255) / 255);
        this[1] = Color.cleanFloat(((hex >> 8) & 255) / 255);
        this[2] = Color.cleanFloat((hex & 255) / 255);
        this[3] = 1;
        return this;
    }
    
    fromString(str) {
        const color = parseInt(str.slice(1), 16);
        this[0] = Color.cleanFloat(((color >> 16) & 255) / 255);
        this[1] = Color.cleanFloat(((color >> 8) & 255) / 255);
        this[2] = Color.cleanFloat((color & 255) / 255);
        this[3] = 1;
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
        this[0] = Color.cleanFloat(r);
        this[1] = Color.cleanFloat(g);
        this[2] = Color.cleanFloat(b);
        this[3] = Color.cleanFloat(a);
        return this;
    }
    
    copy(color) {
        this[0] = Color.cleanFloat(color.r);
        this[1] = Color.cleanFloat(color.g);
        this[2] = Color.cleanFloat(color.b);
        this[3] = Color.cleanFloat(color.a);
        return this;
    }
    
    clone() {
        return new Color(this.r, this.g, this.b, this.a);
    }
    
    printRGBA() {
        return `rgba(${Color.cleanFloat(this[0])}, ${Color.cleanFloat(this[1])}, ${Color.cleanFloat(this[2])}, ${Color.cleanFloat(this[3])})`;
    }
    
    printHex() {
        const r = Math.round(this[0] * 255);
        const g = Math.round(this[1] * 255);
        const b = Math.round(this[2] * 255);
        return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    }
} 

export { Color };