import { Object3D } from '../core/Object3D';
import { Matrix4 } from '../math/Matrix4';
import { Vector3 } from '../math/Vector3';

class Camera extends Object3D {
	
	static struct = {
		projection: 'mat4x4f',
		view: 'mat4x4f',
		position: 'vec3f',
		direction: 'vec3f',
	}
    
    constructor() {

		super();

		this.isCamera = true;

		this.type = 'Camera';
		this.target = new Vector3(0, 0, 0);

		this.matrixWorldInverse = new Matrix4();

		this.projectionMatrix = new Matrix4();
		this.viewMatrix = new Matrix4();
		this.projectionMatrixInverse = new Matrix4();
		this.projectionViewMatrix = new Matrix4();
		this.rightDirection = new Vector3();
		let size = 64 + 64 + 12 + 12;
		size = Math.ceil(size / 16) * 16;
		this._data = new Float32Array(size / Float32Array.BYTES_PER_ELEMENT);
	}

	copy( source, recursive ) {

		super.copy( source, recursive );

		this.matrixWorldInverse.copy( source.matrixWorldInverse );

		this.projectionMatrix.copy( source.projectionMatrix );
		this.projectionMatrixInverse.copy( source.projectionMatrixInverse );


		return this;
	}
	
	updateViewMatrix() {
		this.viewMatrix.lookAt(this.position, this.target, this.up);
		this.direction.subVectors(this.target, this.position).normalize();
		this.rightDirection.crossVectors(this.direction, this.up).normalize();
		this._data.set(this.viewMatrix.data, 16);
		this._data.set(this.position.data, 32);
		this._data.set(this.direction.data, 35);
	}
	
	
	updateProjectionMatrix() {
		// Implemented in subclasses
	}
	
	updateMatrixWorld( force ) {

		super.updateMatrixWorld( force );

		this.updateViewMatrix();

	}

	updateWorldMatrix( updateParents, updateChildren ) {

		super.updateWorldMatrix( updateParents, updateChildren );

		this.updateViewMatrix();
	}
	
	clone() {
		return new this.constructor().copy( this );
	}
	
	
	get data() {
		return this._data;
	}	
}

export { Camera };