import { BufferData } from '@/data/BufferData';
import { cleanFloat } from '@/util/general';

class Color extends BufferData {
    constructor(r: string | number | Color = 0xffffff, g: number | undefined = undefined, b: number | undefined = undefined, a: number | undefined = undefined) {
        if (r instanceof Color) {
            return r.clone();
        }

        super(4);
        
        if (g !== undefined && typeof(r) ==='number') {
            // Clamp each value to the [0, 1] range
            const clamp = (value: number) => Math.max(0, Math.min(1, value));
            this.set([clamp(r ?? 0), clamp(g ?? 0), clamp(b ?? 0), clamp(a ?? 1)]);
        }
        else {
            this.setHex(r);   
        }
    }
    
    get r() { return this[0]; }
    get g() { return this[1]; }
    get b() { return this[2]; }
    get a() { return this[3]; }

    set r(value) { this[0] = value; this.monitor.check(); }
    set g(value) { this[1] = value; this.monitor.check(); }
    set b(value) { this[2] = value; this.monitor.check(); }
    set a(value) { this[3] = value; this.monitor.check(); }
    
    private checkDigits(str: string): boolean {
        return /^\d+$/.test(str);
    }

    private __fromHexString(string: string) {
        if (string[0] !== '#') {
            throw new Error('Color.fromString: string should start with #');
        }
        const color = parseInt(string.slice(1), 16);
        this.set([
            ((color >> 16) & 255) / 255,
            ((color >> 8) & 255) / 255,
            (color & 255) / 255,
            1 
        ])
        return this;
    }

    private __fromHexNumber(hex: number) {
        this.set([ 
            ((hex >> 16) & 255) / 255,
            ((hex >> 8) & 255) / 255,
            (hex & 255) / 255,
            1
        ]);
        return this;
    }

    setHex(r: number | string) {
        if (typeof r === 'string') {
            if (r[0] !== '#' && this.checkDigits(r)) {
                this.__fromHexNumber(parseInt(r))
            } else {
                this.__fromHexString(r);
            }
            return this;
        }
        if (typeof r === 'number') {
            this.__fromHexNumber(r);
            return this;
        }
    }
    
    setRGB(r: number, g: number, b: number) {
        this.set([r, g, b]);
        return this;
    }

    setRGBA(r: number, g: number, b: number, a: number) {
        this.set([r, g, b, a]);
        return this;
    }

    copy(color: Color) {
        this.set(color);
        return this;
    }
    
    clone(): this {
        return new Color(this.r, this.g, this.b, this.a) as this;
    }
    
    printRGBA() {
        return `rgba(${cleanFloat(this[0])}, ${cleanFloat(this[1])}, ${cleanFloat(this[2])}, ${cleanFloat(this[3])})`;
    }
    
    printHex() {
        const r = Math.round(this[0] * 255);
        const g = Math.round(this[1] * 255);
        const b = Math.round(this[2] * 255);
        return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    }
} 

export { Color };