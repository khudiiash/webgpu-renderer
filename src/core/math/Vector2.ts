import { BufferData } from "@/core/data/BufferData";

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

    sub(v: Vector2): this {
        this[0] -= v[0];
        this[1] -= v[1];
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

    toArray(array?: number[], offset?: number): number[] {
        if (array === undefined) array = [];
        if (offset === undefined) offset = 0;

        array[offset] = this[0];
        array[offset + 1] = this[1];

        return array;
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

    set(array: ArrayLike<number>, offset: number = 0): this {
        this[0] = array[offset];
        this[1] = array[offset + 1];
        return this;
    }

    setX(x: number): this {
        this[0] = x;
        return this;
    }

    setY(y: number): this {
        this[1] = y;
        return this;
    }

    magnitude(): number {
        return Math.sqrt(this[0] * this[0] + this[1] * this[1]);
    }

    get x() { return this[0]; }
    get y() { return this[1]; }

    set x(value) { this[0] = value; this.monitor.check(); }
    set y(value) { this[1] = value; this.monitor.check(); }
}