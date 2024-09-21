import { mat4 } from 'wgpu-matrix';
import { Vector3 } from './Vector3';
const _v1 = new Vector3();

class Matrix4 {
    static byteSize = 16 * Float32Array.BYTES_PER_ELEMENT;
    

    constructor() {
        this.isMatrix4 = true;
        this.data = new Float32Array([
            1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
        ]);
        this.up = new Vector3(0, 1, 0);
        this.needsUpdate = true;
    }
    
    lookAt(eye, target, up = this.up) {
        if (mat4.equals(this.data, mat4.lookAt(eye.data, target.data, up.data))) return this;
        mat4.lookAt(eye.data, target.data, up.data, this.data);
        this.needsUpdate = true;
        return this;
    }
    
    identity() {
        mat4.identity(this.data);
        return this;
    }
    
    copy(matrix) {
        if (mat4.equals(this.data, matrix.data)) return this;
        mat4.copy(matrix.data, this.data);
        this.needsUpdate = true;
        return this;
    }
    
    setFromQuaternion(q) {
        if (mat4.equals(this.data, mat4.fromQuat(q.data))) return this;
        mat4.fromQuat(q.data, this.data);
        this.needsUpdate = true;
        return this;
    }
    
    compose(position, quaternion, scale) {
        this.data[0] = scale.data[0] * (1 - 2 * quaternion.data[1] * quaternion.data[1] - 2 * quaternion.data[2] * quaternion.data[2]);
        this.data[1] = scale.data[0] * (2 * quaternion.data[0] * quaternion.data[1] - 2 * quaternion.data[3] * quaternion.data[2]);
        this.data[2] = scale.data[0] * (2 * quaternion.data[0] * quaternion.data[2] + 2 * quaternion.data[3] * quaternion.data[1]);
        this.data[3] = 0;
        this.data[4] = scale.data[1] * (2 * quaternion.data[0] * quaternion.data[1] + 2 * quaternion.data[3] * quaternion.data[2]);
        this.data[5] = scale.data[1] * (1 - 2 * quaternion.data[0] * quaternion.data[0] - 2 * quaternion.data[2] * quaternion.data[2]);
        this.data[6] = scale.data[1] * (2 * quaternion.data[1] * quaternion.data[2] - 2 * quaternion.data[3] * quaternion.data[0]);
        this.data[7] = 0;
        this.data[8] = scale.data[2] * (2 * quaternion.data[0] * quaternion.data[2] - 2 * quaternion.data[3] * quaternion.data[1]);
        this.data[9] = scale.data[2] * (2 * quaternion.data[1] * quaternion.data[2] + 2 * quaternion.data[3] * quaternion.data[0]);
        this.data[10] = scale.data[2] * (1 - 2 * quaternion.data[0] * quaternion.data[0] - 2 * quaternion.data[1] * quaternion.data[1]);
        this.data[11] = 0;
        this.data[12] = position.data[0];
        this.data[13] = position.data[1];
        this.data[14] = position.data[2];
        this.data[15] = 1;
        this.needsUpdate = true;
    }
    
    multiplyMatrices(a, b) {
        if (mat4.equals(this.data, mat4.multiply(a.data, b.data))) return this;
        mat4.multiply(a.data, b.data, this.data);
        this.needsUpdate = true;
        return this;
    }
    
    multiply(m) {
        if (mat4.equals(this.data, mat4.multiply(this.data, m.data))) return this;
        mat4.multiply(this.data, m.data, this.data);
        this.needsUpdate = true;
        return this;
    }
    
    ortho(left, right, bottom, top, near, far) {
        mat4.ortho(left, right, bottom, top, near, far, this.data);
        this.needsUpdate = true;
        return this;
    }
    
    perspective(fov, aspect, near, far) {
        if (mat4.equals(this.data, mat4.perspective(fov, aspect, near, far))) {
            return this;
        }
        mat4.perspective(fov, aspect, near, far, this.data);
        this.needsUpdate = true;
        return this;
    }
    
    extractRotation( m ) {

		// this method does not support reflection matrices

		const te = this.data;
		const me = m.data;

		const scaleX = 1 / _v1.setFromMatrixColumn( m, 0 ).length();
		const scaleY = 1 / _v1.setFromMatrixColumn( m, 1 ).length();
		const scaleZ = 1 / _v1.setFromMatrixColumn( m, 2 ).length();

		te[ 0 ] = me[ 0 ] * scaleX;
		te[ 1 ] = me[ 1 ] * scaleX;
		te[ 2 ] = me[ 2 ] * scaleX;
		te[ 3 ] = 0;

		te[ 4 ] = me[ 4 ] * scaleY;
		te[ 5 ] = me[ 5 ] * scaleY;
		te[ 6 ] = me[ 6 ] * scaleY;
		te[ 7 ] = 0;

		te[ 8 ] = me[ 8 ] * scaleZ;
		te[ 9 ] = me[ 9 ] * scaleZ;
		te[ 10 ] = me[ 10 ] * scaleZ;
		te[ 11 ] = 0;

		te[ 12 ] = 0;
		te[ 13 ] = 0;
		te[ 14 ] = 0;
		te[ 15 ] = 1;

		return this;

	}
    
    cameraAim(eye, target, up) {
        if (mat4.equals(this.data, mat4.cameraAim(eye.data, target.data, up.data))) return this;
        mat4.cameraAim(eye.data, target.data, up.data, this.data);
        this.needsUpdate = true;   
        return this;
    }
    
    rotate(m, axis, angleInRadians) {
        if (mat4.equals(this.data, mat4.rotate(m.data, axis.data, angleInRadians))) return this;
        mat4.rotate(m.data, axis.data, angleInRadians, this.data);
        this.needsUpdate = true;   
        return this;
    }
    
    transpose() {
        mat4.transpose(this.data, this.data);
        this.needsUpdate = true;   
        return this;
    }    
    
    frustum(left, right, bottom, top, near, far) {
        if (mat4.equals(this.data, mat4.frustum(left, right, bottom, top, near, far))) return this;
        mat4.frustum(left, right, bottom, top, near, far, this.data);
        this.needsUpdate = true;   
        return this;
    }
    
    clone() {
        return new Matrix4().copy(this);
    }
    
    equals(m) {
        return mat4.equals(this.data, m.data);
    }
    
    invert() {
        mat4.invert(this.data, this.data);
        this.needsUpdate = true;   
        return this;
    }
    
    getAxis(axis) {
        return mat4.getAxis(this.data, axis);
    }
    
    set(v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15) {
        mat4.set(v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, this.data);
        this.needsUpdate = true;   
        return this;
    }
    
    scale(s) {
        mat4.scale(this.data, s.data, this.data);
        this.needsUpdate = true;   
        return this;
    }
    
    
    getTranslation() {
        return mat4.getTranslation(this.data);
    }
    
    getScaling() {
        return mat4.getScaling(this.data);
    }
    
    multiplyVec3(vector, out) {
        out = out || new Vector3();
        out.set(
            this.data[0]*vector.data[0] + this.data[1]*vector.data[1] + this.data[2]*vector.data[2],
            this.data[3]*vector.data[0] + this.data[4]*vector.data[1] + this.data[5]*vector.data[2],
            this.data[6]*vector.data[0] + this.data[7]*vector.data[1] + this.data[8]*vector.data[2]
        )
    }
    
    translate(x, y, z) {
        if (x instanceof Vector3) {
            mat4.translate(this.data, x.data, this.data);
            this.needsUpdate = true;   
        } else if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
            mat4.translate(this.data, [x, y, z], this.data);
            this.needsUpdate = true;
        }

        return this;
    }
    
    setPosition(x, y, z) {
        if (x.isVector3) {
            this.data[12] = x.data[0];
            this.data[13] = x.data[1];
            this.data[14] = x.data[2];
            this.needsUpdate = true;
        } else if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
            this.data[12] = x;
            this.data[13] = y;
            this.data[14] = z;
            this.needsUpdate = true;
        }
    }
    
    transformPoint(v) {
        const x = v.x;
        const y = v.y;
        const z = v.z;
        const data = this.data;
        v.x = data[0] * x + data[4] * y + data[8] * z + data[12];
        v.y = data[1] * x + data[5] * y + data[9] * z + data[13];
        v.z = data[2] * x + data[6] * y + data[10] * z + data[14];
        return v;
    }
    
    transformDirection(v) {
        const x = v.x;
        const y = v.y;
        const z = v.z;
        const data = this.data;
        v.x = data[0] * x + data[4] * y + data[8] * z;
        v.y = data[1] * x + data[5] * y + data[9] * z;
        v.z = data[2] * x + data[6] * y + data[10] * z;
        return v;
    }
    
    getPosition() {
        return new Vector3(this.data[12], this.data[13], this.data[14]);
    }
    
    rotateX(angle) {
        mat4.rotateX(this.data, angle, this.data);
        this.needsUpdate = true;
    }
    
    rotateY(angle) {
        mat4.rotateY(this.data, angle, this.data);
        this.needsUpdate = true;
    }
    
    rotateZ(angle) {
        mat4.rotateZ(this.data, angle, this.data);
        this.needsUpdate = true;
    }
    
    
    scale(x, y, z) {
        if (x instanceof Vector3) {
            mat4.scale(this.data, x.data, this.data);
            this.needsUpdate = true;
        } else if (typeof x === 'number' && y === undefined) {
            mat4.uniformScale(this.data, x, this.data);
            this.needsUpdate = true;
        } else if (typeof x === 'number' && typeof y === 'number' && z === 'number') {
            mat4.scale(this.data, [x, y, z], this.data);
            this.needsUpdate = true;
        }
    }
    
    fromArray( array, offset = 0 ) {
		for ( let i = 0; i < 16; i ++ ) {
			this.data[ i ] = array[ i + offset ];
		}

		return this;
	}

	toArray( array = [], offset = 0 ) {
        const data = this.data;
        for ( let i = 0; i < 16; i ++ ) {
            array[ offset + i ] = data[ i ];
        }

		return array;
	} 
    
    static multiply(a, b, out) {
        if (mat4.equals(out.data, mat4.multiply(a.data, b.data))) return out;
        mat4.multiply(a.data, b.data, out.data);
        out.needsUpdate = true;
        return out;
    }
    
}

export { Matrix4 };