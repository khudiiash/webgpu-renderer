import { Vector3 } from './Vector3.js';
import { quat } from 'wgpu-matrix';
import { Euler } from './Euler.js';
import { RAD2DEG } from './MathUtils.js';

class Quaternion extends Float32Array {

    constructor(x = 0, y = 0, z = 0, w = 1) {
        super([x, y, z, w]);
        Object.defineProperties(this, {
            isQuaternion: {
                value: true,
                writable: false,
                enumerable: false,
            },
            needsUpdate: {
                value: false,
                writable: true,
                enumerable: false,
            },
        });
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

    get w() {
        return this[3];
    }

    set w(value) {
        this[3] = value;
        this._onChangeCallback();
    }
    
    add(q1, q2) {
        quat.add(q1, q2, this);
        return this;
    }
    
    rotateY(angle) {
        quat.rotateY(this, angle, this);
        this._onChangeCallback();
        return this;
    }
    
    setFromMatrix(matrix) {
        quat.fromMat(matrix, this);
        this._onChangeCallback();
        return this;
    }
    
    setFromAxisAngle(axis, angle) {
        if (!(axis instanceof Vector3)) {
            console.error('Quaternion: setFromAxisAngle expects a Vector3 as the first argument');
        }
        quat.fromAxisAngle(axis, angle, this);
        this._onChangeCallback();
        
        return this;
    }
    
    
    getForwardVector(out) {
        const [x, y, z, w] = this;
        const forwardX = 2 * (x * z - w * y);
        const forwardY = 2 * (y * z + w * x);
        const forwardZ = 1 - 2 * (x * x + y * y);
        
        const magnitude = Math.sqrt(forwardX * forwardX + forwardY * forwardY + forwardZ * forwardZ);
        if (magnitude === 0) {
            out.set(0, 0, 0);
        } else {
            out.set(forwardX / magnitude, forwardY / magnitude, forwardZ / magnitude);
        }
        return out;
    }

    
    inverse() {
        quat.inverse(this, this);
        this._onChangeCallback();
        
        return this;
    }
    
    setFromEuler(euler, update) {
        quat.fromEuler(euler.x, euler.y, euler.z, euler.order, this);
        if (update) this._onChangeCallback();
        return this; 
    }
    
    multiply(q1, q2) {
        quat.mul(q1, q2, this);
        return this;
    }
    
    premultiply(q) {
        quat.mul(q, this, this);
        
        this._onChangeCallback();
    }
    
    invert() {
        quat.inverse(this, this);
        
        this._onChangeCallback();
        return this;
    }

    
    setFromRotationMatrix(m) {
        quat.fromMat(m, this);
        this._onChangeCallback();
        return this;
    }
    
    onChange(callback) {
        this._onChangeCallback = callback;
        return this;
    }
    
    _onChangeCallback() {
        
    }

    set(x, y, z, w) {
        this[0] = x;
        this[1] = y;
        this[2] = z;
        this[3] = w;
        
        this._onChangeCallback();
        return this;
    }
    
    fromArray(array) {
        this.set(...array);
        this._onChangeCallback();
        return this;
    }
    
    equalsArray(array, offset = 0) {
        return this.x === array[offset] && this.y === array[offset + 1] && this.z === array[offset + 2] && this.w === array[offset + 3];
    }
    
    toArray(array = [], offset = 0) {
        const { x, y, z, w } = this;
        array[offset] = x;
        array[offset + 1] = y;
        array[offset + 2] = z;
        array[offset + 3] = w;
        
        return array;
    }
    
    slerpQuaternions(q1, q2, t) {
        quat.slerp(q1, q2, t, this);
        return this;
    }
    
    copy(q) {
        quat.copy(q, this);
        
        return this;
    }
    
    print() {
        return `Quat { x: ${this[0]}, y: ${this[1]}, z: ${this[2]}, w: ${this[3]} }`;
    }
    
    printEuler() {
        const euler = Euler.instance.setFromQuaternion(this);
        return euler.print();
    }
}

export { Quaternion };