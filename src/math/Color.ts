import { BufferData } from '@/data/BufferData';
import { cleanFloat } from '@/util/general';
import { clamp } from '@/util/math';

class Color extends BufferData {
    static size = 4;

    constructor(r: number, g: number, b: number, a: number);
    constructor(r: number, g: number, b: number);
    constructor(hex: number | string);
    constructor(data: BufferData | ArrayLike<number>, offset?: number);
    constructor();

    constructor(...args: any) {
        super(4);
        if (args.length === 0 || args[0] === undefined || args[0] === null) {
            this.set(1, 1, 1, 1);
        }
        else if (args.length === 1) {
            this.set(args[0]);
        }
        else if (args.length === 3) {
            this.set(clamp(args[0]), clamp(args[1] ?? 1), clamp(args[2] ?? 1), 1);
        }
        else if (args.length === 4) {
            this.set(clamp(args[0]), clamp(args[1] ?? 1), clamp(args[2] ?? 1), clamp(args[3] ?? 1));
        } else {
            throw new Error('Invalid number of arguments');
        }
    }
    
    get r() { return this[0]; }
    get g() { return this[1]; }
    get b() { return this[2]; }
    get a() { return this[3]; }

    set r(value) { this[0] = clamp(value); this.monitor.check(0, 1); }
    set g(value) { this[1] = clamp(value); this.monitor.check(1, 2); }
    set b(value) { this[2] = clamp(value); this.monitor.check(2, 3); }
    set a(value) { this[3] = clamp(value); this.monitor.check(3, 4); }
    
    private checkDigits(str: string): boolean {
        return /^\d+$/.test(str);
    }

    linearToSRGB() {
        const gammaCorrect = (value: number) => value <= 0.0031308 ? 12.92 * value : 1.055 * Math.pow(value, 1.0 / 2.4) - 0.055;
        this[0] = clamp(gammaCorrect(this.r));
        this[1] = clamp(gammaCorrect(this.g));
        this[2] = clamp(gammaCorrect(this.b));
        return this;
    }

    SRGBToLinear() {
        const gammaCorrect = (value: number) => value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
        this[0] = clamp(gammaCorrect(this.r));
        this[1] = clamp(gammaCorrect(this.g));
        this[2] = clamp(gammaCorrect(this.b));
        return this;
    }


    private __fromHexString(string: string) {
        if (string[0] !== '#') {
            throw new Error('Color.fromString: string should start with #');
        }
        // Remove the '#' and check if the rest is a valid hex string
        const hexPart = string.slice(1,16);
        if (!/^[0-9A-Fa-f]{6}$/.test(hexPart)) {
            throw new Error('Invalid hex string');
        }
        const color = parseInt(hexPart, 16);

        this[0] = ((color >> 16) & 255) / 255;
        this[1] = ((color >> 8) & 255) / 255;
        this[2] = (color & 255) / 255;
        this[3] = 1;
        return this;
    }

    private __fromHexNumber(hex: number) {
        this[0] = ((hex >> 16) & 255) / 255;
        this[1] = ((hex >> 8) & 255) / 255;
        this[2] = (hex & 255) / 255;
        this[3] = 1;
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

    lerp(a: Color, b: Color, alpha: number) {
        this[0] = a.r + (b.r - a.r) * alpha;
        this[1] = a.g + (b.g - a.g) * alpha;
        this[2] = a.b + (b.b - a.b) * alpha;
        this[3] = a.a + (b.a - a.a) * alpha;
        return this;
    }

    set(r: number, g: number, b: number, a: number): this;
    set(r: number, g: number, b: number): this;
    set(color: BufferData | ArrayLike<number>, offset?: number): this;
    set(hex: string | number): this;

    set(...args: any): this {
        if (args.length === 1) {
            if (typeof args[0] === 'number') {
                this.__fromHexNumber(args[0]);
                this.monitor.check();
            } else if (typeof args[0] === 'string') {
                this.__fromHexString(args[0]);
                this.monitor.check();
            } else if (args[0] instanceof BufferData || Array.isArray(args[0])) {
                super.set(args[0], args[1] || 0);
            } else if (args[0] === undefined) {
                super.set([1, 1, 1, 1]);
            }
        } else {
            super.set(args.map((v: number) => clamp(v ?? 1)));
        }
        return this
    }

    setSilent(r: number, g: number, b: number, a: number): this;
    setSilent(r: number, g: number, b: number): this;
    setSilent(color: BufferData | ArrayLike<number>, offset?: number): this;
    setSilent(hex: string | number): this;

    setSilent(...args: any): this {
        if (args.length === 1) {
            if (typeof args[0] === 'number') {
                this.__fromHexNumber(args[0]);
            } else if (typeof args[0] === 'string') {
                this.__fromHexString(args[0]);
            } else if (args[0] instanceof BufferData || Array.isArray(args[0])) {
                super.setSilent(args[0], args[1] || 0);
            }
        } else {
            super.setSilent(args);
        }
        return this;
    }
    
    copy(color: Color) {
        this[0] = color[0];
        this[1] = color[1];
        this[2] = color[2];
        this[3] = color[3];
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