import { vec3 } from 'wgpu-matrix';
import { DataMonitor } from '../utils/DataMonitor.js';


class Vector3 extends Float32Array {
    static byteSize = 3 * Float32Array.BYTES_PER_ELEMENT;
    
    static ZERO = new Vector3(0, 0, 0);

    static RIGHT = new Vector3(1, 0, 0);
    static LEFT = new Vector3(-1, 0, 0);
    static UP = new Vector3(0, 1, 0);
    static DOWN = new Vector3(0, -1, 0);
    static FORWARD = new Vector3(0, 0, -1);
    static BACKWARD = new Vector3(0, 0, 1);

    constructor(x = 0, y = 0, z = 0) {
        super([x, y, z]);
        Object.defineProperty(this, 'isVector3', { 
            value: true, 
            writable: false,
            enumerable: false,
        });

        Object.defineProperty(this, 'monitor', {
            value: new DataMonitor(this, this),
            writable: false,
            enumerable: false,
        })
    }
    
    get x() {
        return this[0];
    }
    
    set x(value) {
        this[0] = value;
        this.monitor.check();
    }
    
    get y() {
        return this[1];
    }

    set y(value) {
        this[1] = value;
        this.monitor.check();
    }

    get z() {
        return this[2];
    }

    set z(value) {
        this[2] = value;
        this.monitor.check();
    }
    
    print() {
        return `Vec3 { x: ${this[0]}, y: ${this[1]}, z: ${this[2]} }`;
    }
    
    invert() {
        vec3.negate(this, this);
        return this;
    }
    
    equals(v) {
        return vec3.equals(this, v);
    }
    
    min(x, y, z) {
        if (x instanceof Vector3) {
            vec3.min(this, x, this);
        } else {
            vec3.min(this, [x, y, z], this);
        }
        return this;
    }
    
    max(x, y, z) {
        if (x instanceof Vector3) { 
            vec3.max(this, x, this);
        } else { 
            vec3.max(this, [x, y, z], this);
        }
        
        return this;
    }
    
    setFromMatrixColumn(matrix, index) {
        return this.fromArray( matrix, index * 4 ); 
    }
    
    fromArray(array, offset = 0) {
        this[0] = array[offset];
        this[1] = array[offset + 1];
        this[2] = array[offset + 2];
        
        return this
    }

    setFromMatrixPosition(matrix) {
        this[0] = matrix[12];
        this[1] = matrix[13];
        this[2] = matrix[14];
        
        return this;
    }
    
    divScalar(scalar) {
        vec3.scale(this, 1 / scalar, this);
        return this;
    }
    
    set(x, y, z) {
        this[0] = x;
        this[1] = y;
        this[2] = z;
        return this;
    }

    add(v) {
        vec3.add(v, this, this);
        return this;
    }
    
    addVectors(a, b) {
        vec3.add(a, b, this);
        return this;
    }
    
    sub(v1) {
        vec3.sub(this, v1, this);
        return this;
    }
    
    subVectors(a, b) {
        vec3.sub(a, b, this);
        return this;
    }
    
    copy(v) {
        vec3.copy(v, this);
        return this;
    }
    
    clone() {
        return new Vector3().copy(this);
    }
    
    distanceTo(v) {
        return vec3.distance(this, v);
    }
    
    dot(v) {
        return vec3.dot(this, v);
    }
    
    cross(v) {
        vec3.cross(this, v, this);
        return this;
    }
    
    length() {
        return vec3.length(this);
    }
    
    normalize() {
        vec3.normalize(this, this);
        return this;
    }
    
    applyMatrix4(m) {
		const x = this.x, y = this.y, z = this.z;
		const e = m;

		const w = 1 / ( e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ] );

		this.x = ( e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ] ) * w;
		this.y = ( e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ] ) * w;
		this.z = ( e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ] ) * w;
        return this;
    }
    
    applyQuaternion(q) {
        vec3.transformQuat(this, this, q);
        return this;
    }
    
    multiplyScalar(s) {
        vec3.scale(this, s, this);
        return this;
    }
    
    toArray(array = [], offset = 0) {
        array[offset + 0] = this[0];
        array[offset + 1] = this[1];
        array[offset + 2] = this[2];
        return array;
    }
    
    subVectors(a, b) {
        vec3.sub(a, b, this);
        return this;
    }
    
    equalsArray(array, offset = 0) {
        return this[0] === array[offset] && this[1] === array[offset + 1] && this[2] === array[offset + 2];
    }
    
    lengthSq() {
        return vec3.lengthSq(this);
    }
    
    crossVectors(a, b) {
        vec3.cross(a, b, this);
        return this;
    }
    
    clampLength(min, max) {
        const length = this.length();
        this.multiplyScalar(Math.max(min, Math.min(max, length)) / length);
        return this;
    }
    
    distanceToSquared(v) {
        return vec3.distanceSq(this, v);
    }
    
    
    lerpVectors(v1, v2, alpha) {
        vec3.lerp(v1, v2, alpha, this);
        return this;
    }
    
    lerp(v, alpha) {
        vec3.lerp(this, v, alpha, this);
        return this;
    }
    
    random(min, max) {
        this.x = Math.random() * (max - min) + min;
        this.y = Math.random() * (max - min) + min;
        this.z = Math.random() * (max - min) + min;
        return this;
    }
    
    setFromAttribute(attribute, index) {
        this[0] = attribute.getX(index);
        this[1] = attribute.getY(index);
        this[2] = attribute.getZ(index);
        return this;
    }
    
    addScaledVector(v, s) {
        vec3.addScaled(this, v, s, this);
        return this;
    }
    
    clear() {
        this.fill(0);
        return this;
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