import { Matrix4 } from './Matrix4';
import { Quaternion } from './Quaternion';
import { clamp, DEG2RAD, RAD2DEG } from './MathUtils';

const _matrix = new Matrix4();
const _quaternion = new Quaternion();

class Euler {
    constructor(x = 0, y = 0, z = 0, order = Euler.DEFAULT_ORDER) {
        this._x = x;
        this._y = y;
        this._z = z;
        this._order = order;
    }
    
    get x() {
        return this._x;
    }

    set x(value) {
        this._x = value;
        this._onChangeCallback();
    }

    get y() {
        return this._y;
    }

    set y(value) {
        this._y = value;
        this._onChangeCallback();
    }

    get z() {
        return this._z;
    }

    set z(value) {
        this._z = value;
        this._onChangeCallback();
    }
    
    get order() {
        return this._order;
    }
    
    set order(value) {
        this._order = value;
        this._onChangeCallback();
    }
    
    
    toArray(array = [], offset = 0) {
        array[offset + 0] = this._x;
        array[offset + 1] = this._y;
        array[offset + 2] = this._z;
        array[offset + 3] = this._order;
        return array;
    }
    
    setFromQuaternion(q, order, update) {
        _matrix.setFromQuaternion(q);
        if (update) this._onChangeCallback();
        return this.setFromRotationMatrix(_matrix, order, update);
    }
    
    print() {
        console.log(`Euler { x: ${this._x * RAD2DEG}, y: ${this._y * RAD2DEG}, z: ${this._z * RAD2DEG } }`);
    }
    
    onChange(callback) {
        this._onChangeCallback = callback;
        return this;
    }
    
    _onChangeCallback() {
        // empty
    }
    
    *[ Symbol.iterator ]() {

		yield this._x;
		yield this._y;
		yield this._z;
		yield this._order;

	}
    
    setFromRotationMatrix(m, order = this._order, update) {
        m = m.data;
		const m11 = m[ 0 ], m12 = m[ 4 ], m13 = m[ 8 ];
		const m21 = m[ 1 ], m22 = m[ 5 ], m23 = m[ 9 ];
		const m31 = m[ 2 ], m32 = m[ 6 ], m33 = m[ 10 ];

		switch ( order ) {

			case 'xyz':

				this._y = Math.asin( clamp( m13, - 1, 1 ) );

				if ( Math.abs( m13 ) < 0.9999999 ) {

					this._x = Math.atan2( - m23, m33 );
					this._z = Math.atan2( - m12, m11 );

				} else {

					this._x = Math.atan2( m32, m22 );
					this._z = 0;

				}

				break;

			case 'yxz':

				this._x = Math.asin( - clamp( m23, - 1, 1 ) );

				if ( Math.abs( m23 ) < 0.9999999 ) {

					this._y = Math.atan2( m13, m33 );
					this._z = Math.atan2( m21, m22 );

				} else {

					this._y = Math.atan2( - m31, m11 );
					this._z = 0;

				}

				break;

			case 'zxy':

				this._x = Math.asin( clamp( m32, - 1, 1 ) );

				if ( Math.abs( m32 ) < 0.9999999 ) {

					this._y = Math.atan2( - m31, m33 );
					this._z = Math.atan2( - m12, m22 );

				} else {

					this._y = 0;
					this._z = Math.atan2( m21, m11 );

				}

				break;

			case 'zyx':

				this._y = Math.asin( - clamp( m31, - 1, 1 ) );

				if ( Math.abs( m31 ) < 0.9999999 ) {

					this._x = Math.atan2( m32, m33 );
					this._z = Math.atan2( m21, m11 );

				} else {

					this._x = 0;
					this._z = Math.atan2( - m12, m22 );

				}

				break;

			case 'yzx':

				this._z = Math.asin( clamp( m21, - 1, 1 ) );

				if ( Math.abs( m21 ) < 0.9999999 ) {

					this._x = Math.atan2( - m23, m22 );
					this._y = Math.atan2( - m31, m11 );

				} else {

					this._x = 0;
					this._y = Math.atan2( m13, m33 );

				}

				break;

			case 'xzy':

				this._z = Math.asin( - clamp( m12, - 1, 1 ) );

				if ( Math.abs( m12 ) < 0.9999999 ) {

					this._x = Math.atan2( m32, m22 );
					this._y = Math.atan2( m13, m11 );

				} else {

					this._x = Math.atan2( - m23, m33 );
					this._y = 0;

				}

				break;

			default:

				console.warn( '.setFromRotationMatrix() encountered an unknown order: ' + order );

		}

		this._order = order;

		if ( update === true ) this._onChangeCallback();

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
        this._x = x;
        this._y = y;
        this._z = z;
        this._order = order;
        this._onChangeCallback();
        return this;
    }
    
    copy(euler) {
        this.x = euler.x;
        this.y = euler.y;
        this.z = euler.z;
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

export { Euler };