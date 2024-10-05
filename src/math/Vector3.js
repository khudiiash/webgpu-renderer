import { vec3 } from 'wgpu-matrix';

class Vector3 {
    static byteSize = 3 * Float32Array.BYTES_PER_ELEMENT;
    
    static ZERO = new Vector3(0, 0, 0);

    static RIGHT = new Vector3(1, 0, 0);
    static LEFT = new Vector3(-1, 0, 0);
    static UP = new Vector3(0, 1, 0);
    static DOWN = new Vector3(0, -1, 0);
    static FORWARD = new Vector3(0, 0, -1);
    static BACKWARD = new Vector3(0, 0, 1);

    constructor(x = 0, y = 0, z = 0) {
        this.data = new Float32Array([x, y, z]);
        this.needsUpdate = false;
        this.isVector3 = true;
        vec3.create(x, y, z, this.data);
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
    
    print() {
        return `Vec3 { x: ${this.data[0]}, y: ${this.data[1]}, z: ${this.data[2]} }`;
    }
    
    invert() {
        vec3.negate(this.data, this.data);
        this._onChangeCallback();
        return this;
    }
    
    equals(v) {
        return vec3.equals(this.data, v.data);
    }
    
    min(v) {
        vec3.min(this.data, v.data, this.data);
        this._onChangeCallback();
        return this;
    }
    
    max(v) {
        vec3.max(this.data, v.data, this.data);
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
        this._onChangeCallback();
        return this
    }

    setFromMatrixPosition(matrix) {
        this.data[0] = matrix.data[12];
        this.data[1] = matrix.data[13];
        this.data[2] = matrix.data[14];
        this._onChangeCallback();
        return this;
    }
    
    divScalar(scalar) {
        vec3.scale(this.data, 1 / scalar, this.data);
        this._onChangeCallback();
        return this;
    }
    
    set(x, y, z) {
        vec3.set(x, y, z, this.data);
        this._onChangeCallback();
        return this;
    }
    
    add(v) {
        vec3.add(v.data, this.data, this.data);
        return this;
    }
    
    addVectors(a, b) {
        vec3.add(a.data, b.data, this.data);
        return this;
    }
    
    sub(v1) {
        vec3.sub(this.data, v1.data, this.data);
        return this;
    }
    
    subVectors(a, b) {
        vec3.sub(a.data, b.data, this.data);
        this._onChangeCallback();
        return this;
    }
    
    copy(v) {
        vec3.copy(v.data, this.data);
        return this;
    }
    
    clone() {
        return new Vector3().copy(this);
    }
    
    distanceTo(v) {
        return vec3.distance(this.data, v.data);
    }
    
    dot(v) {
        return vec3.dot(this.data, v.data);
    }
    
    cross(v) {
        vec3.cross(this.data, v.data, this.data);
        return this;
    }
    
    length() {
        return vec3.length(this.data);
    }
    
    normalize() {
        vec3.normalize(this.data, this.data);
        return this;
    }
    
    applyMatrix4(matrix) {
        vec3.transformMat4(this.data, this.data, matrix);
        return this;
    }
    
    applyQuaternion(q) {
        vec3.transformQuat(this.data, this.data, q.data);
        return this;
    }
    
    mulScalar(s) {
        vec3.scale(this.data, s, this.data);
        return this;
    }
    
    toArray(array = [], offset = 0) {
        array[offset + 0] = this.data[0];
        array[offset + 1] = this.data[1];
        array[offset + 2] = this.data[2];
        return array;
    }
    
    
    
    subVectors(a, b) {
        vec3.sub(a.data, b.data, this.data);
        this._onChangeCallback();
        return this;
    }
    
    equalsArray(array, offset = 0) {
        return this.data[0] === array[offset] && this.data[1] === array[offset + 1] && this.data[2] === array[offset + 2];
    }
    
    lengthSq() {
        return vec3.lengthSq(this.data);
    }
    
    crossVectors(a, b) {
        vec3.cross(a.data, b.data, this.data);
        this._onChangeCallback();
        return this;
    }
    
    clampLength(min, max) {
        const length = this.length();
        this.mulScalar(Math.max(min, Math.min(max, length)) / length);
        this._onChangeCallback();
        return this;
    }
    
    lerpVectors(v1, v2, alpha) {
        vec3.lerp(v1.data, v2.data, alpha, this.data);
        return this;
    }
    
    lerp(v, alpha) {
        vec3.lerp(this.data, v.data, alpha, this.data);
        return this;
    }
    
    random(min, max) {
        this.x = Math.random() * (max - min) + min;
        this.y = Math.random() * (max - min) + min;
        this.z = Math.random() * (max - min) + min;
        return this;
    }
    
    setFromBufferAttribute(attribute, index) {
        this.data[0] = attribute.getX(index);
        this.data[1] = attribute.getY(index);
        this.data[2] = attribute.getZ(index);
        return this;
    }
    
    addScaledVector(v, s) {
        vec3.addScaled(this.data, v.data, s, this.data);
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
        return new Vector3().subVectors(a, b);
    }
    
    static addVectors(a, b) {
        return new Vector3().addVectors(a, b);
    }
    
    static crossVectors(a, b) {
        return new Vector3().crossVectors(a, b);
    }
    
}

export { Vector3 };