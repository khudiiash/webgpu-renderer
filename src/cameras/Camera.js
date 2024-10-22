import { Object3D } from '../core/Object3D';
import { Frustum } from '../math/Frustum';
import { Matrix4 } from '../math/Matrix4';
import { Vector3 } from '../math/Vector3';

const _projScreenMatrix = new Matrix4();
const _vector = new Vector3();

class Camera extends Object3D {
	
	static struct = {
		projection: 'mat4x4f',
		view: 'mat4x4f',
		position: 'vec3f',
		_padding: 'f32',
		direction: 'vec3f',
		_padding2: 'f32',
	}
    
    constructor() {
		super();
		this.isCamera = true;
		this.type = 'camera';
		this.name = 'Camera';
		this.target = new Vector3(0, 0, 0);

		this.matrixWorldInverse = new Matrix4();

		this.projectionMatrix = new Matrix4();
		this.viewMatrix = new Matrix4();
		this.projectionMatrixInverse = new Matrix4();
		this.projectionViewMatrix = new Matrix4();
		this.rightDirection = new Vector3();
		this.frustum = new Frustum();
		let size = 64 + 64 + 16 + 16;
		size = Math.ceil(size / 16) * 16;
		this._data = new Float32Array(size / Float32Array.BYTES_PER_ELEMENT);
		this.offsets = new Map(); 
		this.offsets.set(this.projectionMatrix, 0);
		this.offsets.set(this.viewMatrix, 16);
		this.offsets.set(this.position, 32);
		this.offsets.set(this.direction, 36);
		this.subscribe('resize', this._onResize, this);
	}
	
	updateFrustum(shouldWrite = false) {
        _projScreenMatrix.multiplyMatrices(this.projectionMatrix, this.matrixWorld.invert());
        this.frustum.setFromProjectionMatrix(_projScreenMatrix);
	}
	
	_onResize({ aspect }) {
		if (this.aspect === aspect) return;
		this.aspect = aspect;
		this.updateProjectionMatrix();
	}

	copy( source, recursive ) {

		super.copy( source, recursive );

		this.matrixWorldInverse.copy( source.matrixWorldInverse );

		this.projectionMatrix.copy( source.projectionMatrix );
		this.projectionMatrixInverse.copy( source.projectionMatrixInverse );
		this._data.set(source._data);
		return this;
	}
	
	setPosition( x, y, z ) {
		if ( x.isVector3 ) {
			this.target.add(_vector.copy(x).sub(this.position));
		} else {
			const diff = _vector.set(x - this.position.x, y - this.position.y, z - this.position.z);
			this.target.add(diff);
		}
		super.setPosition( x, y, z );
	}
	
	updateViewMatrix() {
		this.viewMatrix.lookAt(this.position, this.target, this.up);
		this.rightDirection.set(this.viewMatrix.data[0], this.viewMatrix.data[1], this.viewMatrix.data[2]);

		this._data.set(this.viewMatrix.data, this.offsets.get(this.viewMatrix));
		this._data.set(this.position.data, this.offsets.get(this.position));
		this._data.set(this.direction.data, this.offsets.get(this.direction));
		this.projectionViewMatrix.multiplyMatrices(this.projectionMatrix, this.viewMatrix);
		this.write(this._data, 'camera');
	}
	
	
	updateProjectionMatrix() {
		// Implemented in subclasses
	}
	
	updateWorldMatrix( updateParents, updateChildren ) {

		super.updateWorldMatrix( updateParents, updateChildren );

		this.updateViewMatrix();
	}
	
	updateMatrixWorld( force ) {
		super.updateMatrixWorld( force );
		this.updateViewMatrix();
	}	
	
	clone() {
		return new this.constructor().copy( this );
	}
	
	onChange( callback ) {
		this._onChangeCallback = callback;
	}
	
	_onChangeCallback() { }
	
	
	get data() {
		return this._data;
	}	
}

export { Camera };