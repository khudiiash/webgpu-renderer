import { Vector3 } from './Vector3.js';
import { quat } from 'wgpu-matrix';
import { Euler } from './Euler.js';
import { RAD2DEG } from './MathUtils.js';

class Quaternion {
    constructor(x = 0, y = 0, z = 0, w = 1) {
        this.isQuaternion = true;
        this.data = quat.create(x, y, z, w);
        this.needsUpdate = false;
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

    get w() {
        return this.data[3];
    }

    set w(value) {
        this.data[3] = value;
        this._onChangeCallback();
    }
    
    add(q1, q2) {
        quat.add(q1.q, q2.q, this.data);
        return this;
    }
    
    rotateY(angle) {
        quat.rotateY(angle, this.data);
        this._onChangeCallback();
        return this;
    }
    
    setFromMatrix(matrix) {
        quat.fromMat(matrix.data, this.data);
        this._onChangeCallback();
        return this;
    }
    
    setFromAxisAngle(axis, angle) {
        if (!(axis instanceof Vector3)) {
            console.error('Quaternion: setFromAxisAngle expects a Vector3 as the first argument');
        }
        quat.fromAxisAngle(axis.toArray(), angle, this.data);
        this._onChangeCallback();
        
        return this;
    }
    
    set(x, y, z, w) {
        quat.set(x, y, z, w, this.data);
        this._onChangeCallback();
        
        return this;
    }
    
    getForwardVector(out) {
        const { x, y, z, w } = this;
        const forwardX = 2 * (x * z - w * y);
        const forwardY = 2 * (y * z + w * x);
        const forwardZ = 1 - 2 * (x * x + y * y);
        
        const magnitude = Math.sqrt(forwardX * forwardX + forwardY * forwardY + forwardZ * forwardZ);
        if (magnitude === 0) return out.set(0, 0, 0);
        out.set(forwardX / magnitude, forwardY / magnitude, forwardZ / magnitude);
    }

    
    inverse() {
        quat.inverse(this.data, this.data);
        
        return this;
    }
    
    setFromEuler(euler, update) {
        quat.fromEuler(euler.x, euler.y, euler.z, euler.order, this.data);
        if (update) this._onChangeCallback();
        return this; 
    }
    
    setFromEulerAngles(x, y, z, order = 'xyz') {
        quat.fromEuler(x, y, z, order, this.data);
        this._onChangeCallback();
        return this;
    }
    
    multiply(q1, q2) {
        quat.mul(q1.q, q2.q, this.data);
        
        return this;
    }
    
    premultiply(q) {
        quat.mul(q.data, this.data, this.data);
        
        this._onChangeCallback();
    }
    
    invert() {
        quat.inverse(this.data, this.data);
        
        this._onChangeCallback();
        return this;
    }

    
    setFromRotationMatrix(m) {
        quat.fromMat(m.data, this.data);
        this._onChangeCallback();
        return this;
    }
    
    onChange(callback) {
        this._onChangeCallback = callback;
    }
    
    _onChangeCallback() {
        
    }
    
    fromArray(array) {
        this.data.set(array);
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
        quat.slerp(q1.data, q2.data, t, this.data);
        
        return this;
    }
    
    copy(q) {
        quat.copy(q.data, this.data);
        
        return this;
    }
    
    print() {
        return `Quat { x: ${this.data[0]}, y: ${this.data[1]}, z: ${this.data[2]}, w: ${this.data[3]} }`;
    }
    
    printEuler() {
        const euler = _euler.setFromQuaternion(this);
        return `Euler { x: ${euler.x * RAD2DEG}, y: ${euler.y * RAD2DEG}, z: ${euler.z * RAD2DEG} }`;
    }
}

const _euler = new Euler();

export { Quaternion };