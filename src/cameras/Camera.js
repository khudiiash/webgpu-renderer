import { Object3D } from '../core/Object3D';
import { Matrix4 } from '../math/Matrix4';
import { Vector3 } from '../math/Vector3';

class Camera extends Object3D {
    
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
	}

	copy( source, recursive ) {

		super.copy( source, recursive );

		this.matrixWorldInverse.copy( source.matrixWorldInverse );

		this.projectionMatrix.copy( source.projectionMatrix );
		this.projectionMatrixInverse.copy( source.projectionMatrixInverse );


		return this;

	}
	
	updateViewMatrix() {
		this.viewMatrix.lookAt( this.position, this.target, this.up );
		this.projectionViewMatrix.multiplyMatrices( this.projectionMatrix, this.viewMatrix );
	}

	updateMatrixWorld( force ) {

		super.updateMatrixWorld( force );

		this.matrixWorldInverse.copy( this.matrixWorld ).invert();

	}
	

	updateWorldMatrix( updateParents, updateChildren ) {

		super.updateWorldMatrix( updateParents, updateChildren );

		this.matrixWorldInverse.copy( this.matrixWorld ).invert();

	}
	
	clone() {
		return new this.constructor().copy( this );
	}
}

export { Camera };