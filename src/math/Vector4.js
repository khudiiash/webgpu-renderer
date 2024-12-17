import { vec4 } from 'wgpu-matrix';

class Vector4 extends Float32Array {
    static byteSize = 4 * Float32Array.BYTES_PER_ELEMENT;
    
    constructor(x = 0, y = 0, z = 0, w = 0) {
        super([x, y, z, w]);
        this.isVector4 = true;
    }
    
    get width() {
        return this[3];
    }
    
    set width(value) {
        this[3] = value;
        this._onChangeCallback();
    }
    
    get height() {
        return this[4];
    }
    
    set height(value) {
        this[4] = value;
        this._onChangeCallback();
    }

    
    get x() {
        return this[0];
    }
    
    set x(value) {
        this[0] = value;
        this._onChangeCallback();
    }
    
    get y() {
        return this[1];
    }

    set y(value) {
        this[1] = value;
        this._onChangeCallback();
    }

    get z() {
        return this[2];
    }

    set z(value) {
        this[2] = value;
        this._onChangeCallback();
    }
    
    set w(value) {
        this[3] = value;
        this._onChangeCallback();
    }

    get w() {
        return this[3];
    }
    
    setX(x) {
        this[0] = x;
        this._onChangeCallback();
        return this;
    }
    
    setY(y) {
        this[1] = y;
        this._onChangeCallback();
        return this;
    }

    setZ(z) {
        this[2] = z;
        this._onChangeCallback();
        return this;
    }

    setW(w) {
        this[3] = w;
        this._onChangeCallback();
        return this;
    }
    
    manhattanLength() {
        return Math.abs(this[0]) + Math.abs(this[1]) + Math.abs(this[2]) + Math.abs(this[3]);
    }
    
    setComponent(index, value) {
        this[index] = value;
        this._onChangeCallback();
        return this;
    }
    
    getComponent(index) {
        return this[index];
    }
    
    setScalar(scalar) {
        vec4.set(scalar, scalar, scalar, scalar, this);
        this._onChangeCallback();
        return this;
    }

    set(x, y, z, w) {
        this[0] = x;
        this[1] = y;
        this[2] = z;
        this[3] = w;
        this._onChangeCallback();
        return this;
    }
    
    print() {
        return `Vec4 { x: ${this[0]}, y: ${this[1]}, z: ${this[2]}, w: ${this[3]} }`;
    }
    
    invert() {
        vec4.negate(this, this);
        this._onChangeCallback();
        return this;
    }
    
    equals(v) {
        return vec4.equals(this, v);
    }
    
    min(v) {
        vec4.min(this, v, this);
        this._onChangeCallback();
        return this;
    }
    
    max(v) {
        vec4.max(this, v, this);
        this._onChangeCallback();
        return this;
    }
    
    setFromMatrixColumn(matrix, index) {
        return this.fromArray( matrix, index * 4 ); 
    }
    
    fromArray(array, offset = 0) {
        this[0] = array[offset];
        this[1] = array[offset + 1];
        this[2] = array[offset + 2];
        this[3] = array[offset + 3];
        this._onChangeCallback();
        return this
    }

    
    divScalar(scalar) {
        vec4.scale(this, 1 / scalar, this);
        this._onChangeCallback();
        return this;
    }
    
    set(x, y, z) {
        vec4.set(x, y, z, this);
        this._onChangeCallback();
        return this;
    }
    
    add(v) {
        vec4.add(v, this, this);
        return this;
    }
    
    addVectors(a, b) {
        vec4.add(a, b, this);
        return this;
    }
    
    sub(v1) {
        vec4.sub(this, v1, this);
        return this;
    }
    
    subVectors(a, b) {
        vec4.sub(a, b, this);
        this._onChangeCallback();
        return this;
    }
    
    copy(v) {
        vec4.copy(v, this);
        return this;
    }
    
    clone() {
        return new Vector4().copy(this);
    }
    
    distanceTo(v) {
        return vec4.distance(this, v);
    }
    
    dot(v) {
        return vec4.dot(this, v);
    }
    
    cross(v) {
        vec4.cross(this, v, this);
        return this;
    }
    
    length() {
        return vec4.length(this);
    }
    
    normalize() {
        vec4.normalize(this, this);
        this._onChangeCallback();
        return this;
    }
    
    applyMatrix4(matrix) {
        vec4.transformMat4(this, this, matrix);
        return this;
    }
    
    applyQuaternion(q) {
        vec4.transformQuat(this, this, q);
        return this;
    }
    
    multiplyScalar(s) {
        vec4.scale(this, s, this);
        this._onChangeCallback();
        return this;
    }
    
    toArray(array = [], offset = 0) {
        array[offset + 0] = this[0];
        array[offset + 1] = this[1];
        array[offset + 2] = this[2];
        array[offset + 3] = this[3];
        return array;
    }
    
    
    
    subVectors(a, b) {
        vec4.sub(a, b, this);
        this._onChangeCallback();
        return this;
    }
    
    equalsArray(array, offset = 0) {
        return this[0] === array[offset] && this[1] === array[offset + 1] && this[2] === array[offset + 2];
    }
    
    lengthSq() {
        return vec4.lengthSq(this);
    }
    
    crossVectors(a, b) {
        vec4.cross(a, b, this);
        this._onChangeCallback();
        return this;
    }
    
    clampLength(min, max) {
        const length = this.length();
        this.multiplyScalar(Math.max(min, Math.min(max, length)) / length);
        this._onChangeCallback();
        return this;
    }
    
    lerpVectors(v1, v2, alpha) {
        this.subVectors(v2, v1).multiplyScalar(alpha).add(v1);
        return this;
    }
    
    setFromBufferAttribute(attribute, index) { 
        this[0] = attribute.getX(index);
        this[1] = attribute.getY(index);
        this[2] = attribute.getZ(index);
        this[3] = attribute.getW(index);
        this._onChangeCallback();
        return this;
    }
    
    clear() {
        this.fill(0);
        this._onChangeCallback();
        return this;
    }

    onChange(callback) {
        this._onChangeCallback = callback;
        return this;
    }

    _onChangeCallback() {

    }
    
    
    static subVectors(a, b) {
        return new Vector4().subVectors(a, b);
    }
    
    static addVectors(a, b) {
        return new Vector4().addVectors(a, b);
    }
    
    static crossVectors(a, b) {
        return new Vector4().crossVectors(a, b);
    }
    
}

export { Vector4 };