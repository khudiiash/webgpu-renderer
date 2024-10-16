import { vec4 } from 'wgpu-matrix';

class Vector4 {
    static byteSize = 4 * Float32Array.BYTES_PER_ELEMENT;
    
    constructor(x = 0, y = 0, z = 0, w = 0) {
        this.data = new Float32Array([x, y, z, w]);
        this.needsUpdate = false;
        this.isVector4 = true;
        vec4.create(x, y, z, w, this.data);
    }
    
    get width() {
        return this.data[3];
    }
    
    set width(value) {
        this.data[3] = value;
        this._onChangeCallback();
    }
    
    get height() {
        return this.data[4];
    }
    
    set height(value) {
        this.data[4] = value;
        this._onChangeCallback();
    }

    
    get x() {
        return this.data[0];
    }
    
    set x(value) {
        this.data[0] = value;
        this._onChangeCallback();
    }
    
    get y() {
        return this.data[1];
    }

    set y(value) {
        this.data[1] = value;
        this._onChangeCallback();
    }

    get z() {
        return this.data[2];
    }

    set z(value) {
        this.data[2] = value;
        this._onChangeCallback();
    }
    
    set w(value) {
        this.data[3] = value;
        this._onChangeCallback();
    }

    get w() {
        return this.data[3];
    }
    
    setX(x) {
        this.data[0] = x;
        this._onChangeCallback();
        return this;
    }
    
    setY(y) {
        this.data[1] = y;
        this._onChangeCallback();
        return this;
    }

    setZ(z) {
        this.data[2] = z;
        this._onChangeCallback();
        return this;
    }

    setW(w) {
        this.data[3] = w;
        this._onChangeCallback();
        return this;
    }
    
    manhattanLength() {
        return Math.abs(this.data[0]) + Math.abs(this.data[1]) + Math.abs(this.data[2]) + Math.abs(this.data[3]);
    }
    
    setComponent(index, value) {
        this.data[index] = value;
        this._onChangeCallback();
        return this;
    }
    
    getComponent(index) {
        return this.data[index];
    }
    
    setScalar(scalar) {
        vec4.set(scalar, scalar, scalar, scalar, this.data);
        this._onChangeCallback();
        return this;
    }
    
    print() {
        return `Vec4 { x: ${this.data[0]}, y: ${this.data[1]}, z: ${this.data[2]}, w: ${this.data[3]} }`;
    }
    
    invert() {
        vec4.negate(this.data, this.data);
        this._onChangeCallback();
        return this;
    }
    
    equals(v) {
        return vec4.equals(this.data, v.data);
    }
    
    min(v) {
        vec4.min(this.data, v.data, this.data);
        this._onChangeCallback();
        return this;
    }
    
    max(v) {
        vec4.max(this.data, v.data, this.data);
        this._onChangeCallback();
        return this;
    }
    
    setFromMatrixColumn(matrix, index) {
        return this.fromArray( matrix.data, index * 4 ); 
    }
    
    fromArray(array, offset = 0) {
        this.data[0] = array[offset];
        this.data[1] = array[offset + 1];
        this.data[2] = array[offset + 2];
        this.data[3] = array[offset + 3];
        this._onChangeCallback();
        return this
    }

    
    divScalar(scalar) {
        vec4.scale(this.data, 1 / scalar, this.data);
        this._onChangeCallback();
        return this;
    }
    
    set(x, y, z) {
        vec4.set(x, y, z, this.data);
        this._onChangeCallback();
        return this;
    }
    
    add(v) {
        vec4.add(v.data, this.data, this.data);
        return this;
    }
    
    addVectors(a, b) {
        vec4.add(a.data, b.data, this.data);
        return this;
    }
    
    sub(v1) {
        vec4.sub(this.data, v1.data, this.data);
        return this;
    }
    
    subVectors(a, b) {
        vec4.sub(a.data, b.data, this.data);
        this._onChangeCallback();
        return this;
    }
    
    copy(v) {
        vec4.copy(v.data, this.data);
        return this;
    }
    
    clone() {
        return new Vector4().copy(this);
    }
    
    distanceTo(v) {
        return vec4.distance(this.data, v.data);
    }
    
    dot(v) {
        return vec4.dot(this.data, v.data);
    }
    
    cross(v) {
        vec4.cross(this.data, v.data, this.data);
        return this;
    }
    
    length() {
        return vec4.length(this.data);
    }
    
    normalize() {
        vec4.normalize(this.data, this.data);
        return this;
    }
    
    applyMatrix4(matrix) {
        vec4.transformMat4(this.data, this.data, matrix);
        return this;
    }
    
    applyQuaternion(q) {
        vec4.transformQuat(this.data, this.data, q.data);
        return this;
    }
    
    multiplyScalar(s) {
        vec4.scale(this.data, s, this.data);
        return this;
    }
    
    toArray(array = [], offset = 0) {
        array[offset + 0] = this.data[0];
        array[offset + 1] = this.data[1];
        array[offset + 2] = this.data[2];
        array[offset + 3] = this.data[3];
        return array;
    }
    
    
    
    subVectors(a, b) {
        vec4.sub(a.data, b.data, this.data);
        this._onChangeCallback();
        return this;
    }
    
    equalsArray(array, offset = 0) {
        return this.data[0] === array[offset] && this.data[1] === array[offset + 1] && this.data[2] === array[offset + 2];
    }
    
    lengthSq() {
        return vec4.lengthSq(this.data);
    }
    
    crossVectors(a, b) {
        vec4.cross(a.data, b.data, this.data);
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
        this.data[0] = attribute.getX(index);
        this.data[1] = attribute.getY(index);
        this.data[2] = attribute.getZ(index);
        this.data[3] = attribute.getW(index);
        this._onChangeCallback();
        return this;
    }
    
    clear() {
        this.data.fill(0);
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