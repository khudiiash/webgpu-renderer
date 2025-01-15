import { BufferData } from "@/data/BufferData";

export class Vector2 extends BufferData {
    [index: number]: number;
    readonly length: number = 2;
    readonly isVector2: boolean = true;

    constructor(x: number = 0, y: number = 0) {
        super([x, y]);
    }

    add(v: Vector2): this {
        this[0] += v[0];
        this[1] += v[1];
        return this;
    }

    addVectors(a: Vector2, b: Vector2): this {
        this[0] = a[0] + b[0];
        this[1] = a[1] + b[1];
        return this;
    }

    sub(v: Vector2): this {
        this[0] -= v[0];
        this[1] -= v[1];
        return this;
    }

    subVectors(a: Vector2, b: Vector2): this {
        this[0] = a[0] - b[0];
        this[1] = a[1] - b[1];
        return this;
    }

    divide(v: Vector2): this {
        this[0] /= v[0];
        this[1] /= v[1];
        return this;
    }

    multiply(v: Vector2): this {
        this[0] *= v[0];
        this[1] *= v[1];
        return this;
    }

    dot(v: Vector2): number {
        return this[0] * v[0] + this[1] * v[1];
    }

    clone(): this {
        return new Vector2(this[0], this[1]) as this;
    }

    copy(v: this): this {
        this[0] = v[0];
        this[1] = v[1];
        return this;
    }

    equals(v: this): boolean {
        return this[0] === v[0] && this[1] === v[1];
    }

    setX(x: number): this {
        this[0] = x;
        return this;
    }

    setY(y: number): this {
        this[1] = y;
        return this;
    }

    setXY(x: number, y: number): this {
        this[0] = x;
        this[1] = y;
        return this;
    }

    scale(x: Vector2 | number, y?: number): this {
        if (x instanceof Vector2) {
            this[0] *= x[0];
            this[1] *= x[1];
        } else if (y == undefined) {
            this[0] *= x;
            this[1] *= x;
        } else {
            this[0] *= x;
            this[1] *= y!;
        }
        return this;
    }

    magnitude(): number {
        return Math.sqrt(this[0] * this[0] + this[1] * this[1]);
    }

    get x() { return this[0]; }
    get y() { return this[1]; }

    set x(value) { this[0] = value; this.monitor.check(0); }
    set y(value) { this[1] = value; this.monitor.check(1); }
}