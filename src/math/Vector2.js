import { vec2 } from 'wgpu-matrix';

class Vector2 {
    static byteSize = 2 * Float32Array.BYTES_PER_ELEMENT;

    constructor(x = 0, y = 0) {
        this.data = new Float32Array(2);
        vec2.create(x, y, this.data);
    }
    
    get x() {
        return this.data[0];
    }

    set x(value) {
        this.data[0] = value;
    }

    get y() {
        return this.data[1];
    }

    set y(value) {
        this.data[1] = value;
    }

    set(x, y) {
        vec2.set(x, y, this.data);
        return this;
    }

    add(v) {
        vec2.add(v.data, this.data, this.data);
        return this;
    }

    sub(v1, v2) {
        vec2.sub(v1.data, v2.data, this.data);
        return this;
    }

    copy(v) {
        vec2.copy(v.data, this.data);
        return this;
    }

    clone() {
        return new Vector2().copy(this);
    }

    distanceTo(v) {
        return vec2.distance(this.data, v.data);
    }

    length() {
        return vec2.length(this.data);
    }

    normalize() {
        vec2.normalize(this.data, this.data);
        return this;
    }

    mul(scalar) {
        vec2.scale(this.data, scalar, this.data);
        return this;
    }

    dot(v) {
        return vec2.dot(this.data, v.data);
    }

    cross(v) {
        vec2.cross(this.data, v.data, this.data);
        return this;
    }

    lerp(v, t) {
        vec2.lerp(this.data, v.data, t, this.data);
        return this;
    }

    equals(v) {
        return vec2.equals(this.data, v.data);
    }

    toString() {
        return `Vector2(${this.x}, ${this.y})`;
    }

    static get ZERO() {
        return new Vector2();
    }

    static get ONE() {
        return new Vector2(1, 1);
    }

    static get UP() {
        return new Vector2(0, 1);
    }

    static get DOWN() {
        return new Vector2(0, -1);
    }

    static get LEFT() {
        return new Vector2(-1, 0);
    }

    static get RIGHT() {
        return new Vector2(1, 0);
    }

    static add(v1, v2) {
        return new Vector2().add(v1, v2);
    }

    static sub(v1, v2) {
        return new Vector2().sub(v1, v2);
    }
    
    static copy(v) {
        return new Vector2().copy(v);
    }

    static distance(v1, v2) {
        return vec2.distance(v1.data, v2.data);
    }

    static length(v) {
        return vec2.length(v.data);
    }
    
    static normalize(v) {
        return new Vector2().copy(v).normalize();
    }

    static dot(v1, v2) {
        return vec2.dot(v1.data, v2.data);
    }

    static cross(v1, v2) {
        return new Vector2().cross(v1, v2);
    }

    static lerp(v1, v2, t) {
        return new Vector2().lerp(v1, v2, t);
    }

    static equals(v1, v2) {
        return vec2.equals(v1.data, v2.data);
    }

    static mul(v, scalar) {
        return new Vector2().copy(v).mul(scalar);
    }
    
}

export {
    Vector2
}