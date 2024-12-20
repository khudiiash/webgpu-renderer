import { mat4 } from 'wgpu-matrix';
import { Vector3 } from './Vector3';
import { arraysEqual } from '../utils/arraysEqual';
import { Quaternion } from './Quaternion';

class Matrix4 {
    static byteSize = 16 * Float32Array.BYTES_PER_ELEMENT;
    

    constructor() {
        this.isMatrix4 = true;
        this.data = mat4.identity();
        this._lastData = new Float32Array([...this.data]);
        this._needsUpdate = false;
        this.up = new Vector3(0, 1, 0);
        
    }
    
    lookAt(eye, target, up = this.up) {
        mat4.lookAt(eye.data, target.data, up.data, this.data);
        this._onChangeCallback(); 
        return this;
    }
    
    lookAtRotation(eye, target, up = this.up) {
        const zAxis = Vector3.subVectors(target, eye).normalize();
        const xAxis = Vector3.crossVectors(up, zAxis).normalize();
        const yAxis = Vector3.crossVectors(zAxis, xAxis);

        this.set(
            xAxis.x, yAxis.x, zAxis.x, 0,
            xAxis.y, yAxis.y, zAxis.y, 0,
            xAxis.z, yAxis.z, zAxis.z, 0,
            0, 0, 0, 1
        );
         
        return this;
    }
    
    identity() {
        mat4.identity(this.data);
        this._onChangeCallback();
        return this;
    }
    
    print() {
        return `${this.data[0]} ${this.data[1]} ${this.data[2]} ${this.data[3]}\n${this.data[4]} ${this.data[5]} ${this.data[6]} ${this.data[7]}\n${this.data[8]} ${this.data[9]} ${this.data[10]} ${this.data[11]}\n${this.data[12]} ${this.data[13]} ${this.data[14]} ${this.data[15]}`;
    }
    
    copy(matrix) {
        mat4.copy(matrix.data, this.data);
        this._onChangeCallback();
        return this;
    }
    
    setFromQuaternion(q) {
        mat4.fromQuat(q.data, this.data);
        this._onChangeCallback();
        return this;
    }
    
    cameraAim(eye, target, up = this.up) {
        mat4.cameraAim(eye.data, target.data, up.data, this.data);
        this._onChangeCallback();
        return this
    }
    
    
    compose(position, quaternion, scale) {
        if (position.isVector3) {
            position = position.data;
        }
        if (quaternion.isQuaternion) {
            quaternion = quaternion.data;
        }
        
        if (scale.isVector3) {
            scale = scale.data;
        }
        
        const te = this.data;

		const x = quaternion[0], y = quaternion[1], z = quaternion[2], w = quaternion[3];
		const x2 = x + x, y2 = y + y, z2 = z + z;
		const xx = x * x2, xy = x * y2, xz = x * z2;
		const yy = y * y2, yz = y * z2, zz = z * z2;
		const wx = w * x2, wy = w * y2, wz = w * z2;

		const sx = scale[0], sy = scale[1], sz = scale[2];

		te[ 0 ] = ( 1 - ( yy + zz ) ) * sx;
		te[ 1 ] = ( xy + wz ) * sx;
		te[ 2 ] = ( xz - wy ) * sx;
		te[ 3 ] = 0;

		te[ 4 ] = ( xy - wz ) * sy;
		te[ 5 ] = ( 1 - ( xx + zz ) ) * sy;
		te[ 6 ] = ( yz + wx ) * sy;
		te[ 7 ] = 0;

		te[ 8 ] = ( xz + wy ) * sz;
		te[ 9 ] = ( yz - wx ) * sz;
		te[ 10 ] = ( 1 - ( xx + yy ) ) * sz;
		te[ 11 ] = 0;

		te[ 12 ] = position[0];
		te[ 13 ] = position[1];
		te[ 14 ] = position[2];
		te[ 15 ] = 1;


        this._onChangeCallback();
		return this;
    }
    
    multiplyMatrices(a, b) {
        mat4.multiply(a.data, b.data, this.data);
        
        return this;
    }
    
    multiply(m) {
        this._lastData.set(this.data);
        mat4.multiply(this.data, m.data, this.data);
        this._needsUpdate = !arraysEqual(this.data, this._lastData);
        this._onChangeCallback();
        return this;
    }
    
    ortho(left, right, bottom, top, near, far) {
        this._lastData.set(this.data);
        mat4.ortho(left, right, bottom, top, near, far, this.data);
        this._needsUpdate = !arraysEqual(this.data, this._lastData);
        this._onChangeCallback();
        return this;
    }
    
    perspective(fov, aspect, near, far) {
        this._lastData.set(this.data);
        mat4.perspective(fov, aspect, near, far, this.data);
        this._needsUpdate = !arraysEqual(this.data, this._lastData);
        this._onChangeCallback();
        return this;
    }
    
    extractRotation( m ) {
        this._lastData.set(this.data);
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

        this._needsUpdate = !arraysEqual(this.data, this._lastData);
        this._onChangeCallback();

		return this;

	}
    
    rotate(m, axis, angleInRadians) {
        this._lastData.set(this.data);
        mat4.rotate(m.data, axis.data, angleInRadians, this.data);
           
        this._needsUpdate = !arraysEqual(this.data, this._lastData);
        this._onChangeCallback();
        return this;
    }
    
    transpose() {
        this._lastData.set(this.data);
        mat4.transpose(this.data, this.data);
        this._needsUpdate = !arraysEqual(this.data, this._lastData);
        this._onChangeCallback();
        return this;
    }    
    
    frustum(left, right, bottom, top, near, far) {
        this._lastData.set(this.data);
        mat4.frustum(left, right, bottom, top, near, far, this.data);
        this._needsUpdate = !arraysEqual(this.data, this._lastData);
        this._onChangeCallback();
        return this;
    }
    
    clone() {
        return new Matrix4().copy(this);
    }
    
    equals(m) {
        return mat4.equals(this.data, m.data);
    }
    
    invert(out = this) {
        this._lastData.set(this.data);
        mat4.invert(this.data, out.data);
        this._needsUpdate = !arraysEqual(this.data, this._lastData);
           
        this._onChangeCallback();
        return this;
    }
    
    getAxis(axis) {
        return mat4.getAxis(this.data, axis);
    }
    
    set(v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15) {
        this._lastData.set(this.data);
        mat4.set(v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, this.data);
           
        this._needsUpdate = !arraysEqual(this.data, this._lastData);
        this._onChangeCallback();
        return this;
    }
    
    scale(s) {
        this._lastData.set(this.data);
        mat4.scale(this.data, s.data, this.data);
           
        this._needsUpdate = !arraysEqual(this.data, this._lastData);
        this._onChangeCallback();
        return this;
    }
    
    getScale(v) {
        if (!v) {
            v = new Vector3();
        }
        return v.fromArray(mat4.getScaling(this.data));
    }
    
    getRotation(q) {
        if (!q) {
            q = new Quaternion();
        }
        return q.setFromRotationMatrix(this);
    }
    
    determinant() {
        return mat4.determinant(this.data);
    }
    
    getMaxScaleOnAxis() {   
        const te = this.data;

		const scaleXSq = te[ 0 ] * te[ 0 ] + te[ 1 ] * te[ 1 ] + te[ 2 ] * te[ 2 ];
		const scaleYSq = te[ 4 ] * te[ 4 ] + te[ 5 ] * te[ 5 ] + te[ 6 ] * te[ 6 ];
		const scaleZSq = te[ 8 ] * te[ 8 ] + te[ 9 ] * te[ 9 ] + te[ 10 ] * te[ 10 ];

		return Math.sqrt( Math.max( scaleXSq, scaleYSq, scaleZSq ) );
    }
    
    decompose(position, quaternion, scale) {
            const te = this.data;
    
            let sx = _v1.set( te[ 0 ], te[ 1 ], te[ 2 ] ).length();
            const sy = _v1.set( te[ 4 ], te[ 5 ], te[ 6 ] ).length();
            const sz = _v1.set( te[ 8 ], te[ 9 ], te[ 10 ] ).length();
    
            // if determine is negative, we need to invert one scale
            const det = this.determinant();
            if ( det < 0 ) sx = - sx;
    
            position.x = te[ 12 ];
            position.y = te[ 13 ];
            position.z = te[ 14 ];
    
            // scale the rotation part
            _m1.copy( this );
    
            const invSX = 1 / sx;
            const invSY = 1 / sy;
            const invSZ = 1 / sz;
    
            _m1.data[ 0 ] *= invSX;
            _m1.data[ 1 ] *= invSX;
            _m1.data[ 2 ] *= invSX;
    
            _m1.data[ 4 ] *= invSY;
            _m1.data[ 5 ] *= invSY;
            _m1.data[ 6 ] *= invSY;
    
            _m1.data[ 8 ] *= invSZ;
            _m1.data[ 9 ] *= invSZ;
            _m1.data[ 10 ] *= invSZ;
    
            quaternion.setFromRotationMatrix( _m1 );
    
            scale.x = sx;
            scale.y = sy;
            scale.z = sz;
    
            return this;
    
    }
    
    translate(x, y, z) {
        if (x instanceof Vector3) {
            mat4.translate(this.data, x.data, this.data);
            this._needsUpdate = !arraysEqual(this.data, this._lastData);
            this._onChangeCallback();
        } else if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
            mat4.translate(this.data, [x, y, z], this.data);
            this._needsUpdate = !arraysEqual(this.data, this._lastData);
            this._onChangeCallback();
        }

        return this;
    }
    
    setPosition(x, y, z) {
        if (x.isVector3) {
            this.data[12] = x.data[0];
            this.data[13] = x.data[1];
            this.data[14] = x.data[2];
            
            this._needsUpdate = !arraysEqual(this.data, this._lastData);
            this._onChangeCallback();
        } else if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
            this.data[12] = x;
            this.data[13] = y;
            this.data[14] = z;
            
            this._needsUpdate = !arraysEqual(this.data, this._lastData);
            this._onChangeCallback();
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
        
        this._needsUpdate = !arraysEqual(this.data, this._lastData);
        this._onChangeCallback();
    }
    
    rotateY(angle) {
        mat4.rotateY(this.data, angle, this.data);
        this._needsUpdate = !arraysEqual(this.data, this._lastData);
        this._onChangeCallback();
    }
    
    rotateZ(angle) {
        mat4.rotateZ(this.data, angle, this.data);
        this._needsUpdate = !arraysEqual(this.data, this._lastData);
        this._onChangeCallback();
    }
    
    
    scale(x, y, z) {
        if (x instanceof Vector3) {
            mat4.scale(this.data, x.data, this.data);
            this._needsUpdate = !arraysEqual(this.data, this._lastData);     
            this._onChangeCallback();
        } else if (typeof x === 'number' && y === undefined) {
            mat4.uniformScale(this.data, x, this.data);
            this._needsUpdate = !arraysEqual(this.data, this._lastData);     
            this._onChangeCallback();
        } else if (typeof x === 'number' && typeof y === 'number' && z === 'number') {
            mat4.scale(this.data, [x, y, z], this.data);
            this._needsUpdate = !arraysEqual(this.data, this._lastData);     
            this._onChangeCallback();
        }
    }
    
    fromArray( array, offset = 0 ) {
		for ( let i = 0; i < 16; i ++ ) {
			this.data[ i ] = array[ i + offset ];
		}
        
        this._needsUpdate = !arraysEqual(this.data, this._lastData);     
        this._onChangeCallback();

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
        mat4.multiply(a.data, b.data, out.data);
        return out;
    }
    
    equalsArray(array, offset = 0) {
        for (let i = 0; i < 16; i++) {
            if (this.data[i] !== array[i + offset]) return false;
        }
        return true;
    }
    
    onChange(cb) {
        this._onChangeCallback = cb;
        return this;
    }
    
    _onChangeCallback() {

    }
    
    get needsUpdate() {
        return this._needsUpdate;
    }
    
    set needsUpdate(value) {
        this._needsUpdate = value;
    }

    
}

const _v1 = new Vector3();
const _m1 = new Matrix4();

export { Matrix4 };