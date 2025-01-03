import { Matrix4 } from './Matrix4';
import { clamp, DEG2RAD, RAD2DEG } from './MathUtils';
import { arraysEqual } from '../utils/arraysEqual';
import { DataMonitor } from '../utils/DataMonitor';


class Euler extends Float32Array {
    constructor(x = 0, y = 0, z = 0, order = Euler.DEFAULT_ORDER) {
        super([x, y, z]);

        Object.defineProperties(this, {
            isEuler: { value: true, writable: false },
            monitor: { value: new DataMonitor(this, this), writable: false }, 
            _order: { value: order, writable: true },
        })
    }

    get x() { return this[0]; }
    get y() { return this[1]; }
    get z() { return this[2]; }
    get order() { return this._order; }

    set x(value) { this[0] = value; this.monitor.check(); }
    set y(value) { this[1] = value; this.monitor.check(); }
    set z(value) { this[2] = value; this.monitor.check(); }
    set order(value) { this._order = value; this.monitor.check(); }
    
    toArray(array = [], offset = 0) {
        array[ offset ] = this[0];
        array[ offset + 1 ] = this[1];
        array[ offset + 2 ] = this[2];
        return array;
    }
    
    setFromQuaternion(q, order = this._order, update) {
        Matrix4.instance.setFromQuaternion(q);
        return this.setFromRotationMatrix(Matrix4.instance, order, update);
    }
    
    print() {
        const x = Math.round(this[0] * RAD2DEG);
        const y = Math.round(this[1] * RAD2DEG);
        const z = Math.round(this[2] * RAD2DEG);
        return `Euler { x: ${x}°, y: ${y}°, z: ${z}° }`;
    }
    
    onChange(callback) {
        this._onChangeCallback = callback;
        return this;
    }
    
    _onChangeCallback() {
        // empty
    }
    
    *[ Symbol.iterator ]() {

		yield this[0];
		yield this[1];
		yield this[2];
		yield this._order;

	}

    setFromRotationMatrix(m, order = this.order) {
        // Assuming m is a 4x4 matrix stored as a flat array or Matrix4
        // For a 4x4 matrix, the rotation part is the upper 3x3:
        // m11 m12 m13 tx
        // m21 m22 m23 ty
        // m31 m32 m33 tz
        // 0   0   0   1
    
        // We'll implement for XYZ order as specified
        if (order !== 'xyz') {
            throw new Error('Only XYZ order is currently supported');
        }
    
        // Extract the rotation components from the 4x4 matrix
        // Using the paper's notation but accounting for 4x4 matrix layout
        const m11 = m[0];  // [0,0]
        const m12 = m[1];  // [0,1]
        const m13 = m[2];  // [0,2]
        const m21 = m[4];  // [1,0]
        const m22 = m[5];  // [1,1]
        const m23 = m[6];  // [1,2]
        const m31 = m[8];  // [2,0]
        const m32 = m[9];  // [2,1]
        const m33 = m[10]; // [2,2]
    
        // Calculate θ (y rotation)
        // From the paper: R31 = -sin(θ)
        const R31 = m31;
        
        if (Math.abs(R31) !== 1) {
            // Non-degenerate case
            // θ1 = -asin(R31)
            // θ2 = π - θ1
            const theta1 = -Math.asin(R31);
            const theta2 = Math.PI - theta1;
            
            // Calculate ψ (x rotation) for both θ values using equation 3
            // ψ = atan2(R32/cos(θ), R33/cos(θ))
            const psi1 = Math.atan2(m32 / Math.cos(theta1), m33 / Math.cos(theta1));
            const psi2 = Math.atan2(m32 / Math.cos(theta2), m33 / Math.cos(theta2));
            
            // Calculate φ (z rotation) for both θ values using equation 6
            // φ = atan2(R21/cos(θ), R11/cos(θ))
            const phi1 = Math.atan2(m21 / Math.cos(theta1), m11 / Math.cos(theta1));
            const phi2 = Math.atan2(m21 / Math.cos(theta2), m11 / Math.cos(theta2));
    
            // Choose the first solution
            this[0] = psi1;
            this[1] = theta1;
            this[2] = phi1;
            
        } else {
            // Gimbal lock case (cos(θ) = 0)
            // θ = ±π/2 depending on R31
            const theta = R31 === -1 ? Math.PI / 2 : -Math.PI / 2;
            
            // In gimbal lock, φ and ψ are linked
            // We can set φ = 0 and compute ψ
            const phi = 0;
            
            if (R31 === -1) {
                // θ = π/2 case
                // ψ = φ + atan2(R12, R13)
                const psi = phi + Math.atan2(m12, m13);
                this[0] = psi;
                this[1] = theta;
                this[2] = phi;
            } else {
                // θ = -π/2 case
                // ψ = -φ + atan2(-R12, -R13)
                const psi = -phi + Math.atan2(-m12, -m13);
                this[0] = psi;
                this[1] = theta;
                this[2] = phi;
            }
        }
    
        // Normalize angles to be between -π and π
        this.normalize();
        
        return this;
    }

    // Helper method to normalize angles to [-π, π]
    normalize() {
        this[0] = ((this.x + Math.PI) % (2 * Math.PI)) - Math.PI;
        this[1] = ((this.y + Math.PI) % (2 * Math.PI)) - Math.PI;
        this[2] = ((this.z + Math.PI) % (2 * Math.PI)) - Math.PI;
        return this;
    }
    
    setFromVector3(v, order = this._order) {
        return this.set(v.x, v.y, v.z, order);
    }
    
    reorder(newOrder) {
        _quaternion.setFromEuler(this);
        return this.setFromQuaternion(_quaternion, newOrder);
    }
    
    set(x, y, z, order = this._order) {
        this[0] = x;
        this[1] = y;
        this[2] = z;
        this._order = order;
        return this;
    }
    
    copy(euler) {
        this[0] = euler.x;
        this[1] = euler.y;
        this[2] = euler.z;
        this.order = euler.order;
        return this;
    }
    
    clone() {
        return new Euler(this.x, this.y, this.z, this.order);
    }

    equals(euler) {
        return (euler.x === this.x) && (euler.y === this.y) && (euler.z === this.z) && (euler.order === this.order);
    }

}

Euler.DEFAULT_ORDER = 'xyz';
Euler.instance = new Euler();

export { Euler };