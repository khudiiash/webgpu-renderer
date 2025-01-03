import { Object3D } from '../core/Object3D';
import { Frustum } from '../math/Frustum';
import { Matrix4 } from '../math/Matrix4';
import { Vector3 } from '../math/Vector3';
import { UniformData } from '../renderer/new/UniformData';
import { Utils } from '../utils';

const _projScreenMatrix = new Matrix4();
const _vector = new Vector3();

class Camera extends Object3D {
	
    constructor() {
		super();
		this.isCamera = true;
		this.type = 'camera';
		this.name = 'Camera';
		this.target = new Vector3(0, 0, 0);
		this.id = Utils.GUID('camera');

		this.matrixWorldInverse = new Matrix4();

		this.projectionMatrix = new Matrix4();
		this.viewMatrix = new Matrix4();
		this.projectionMatrixInverse = new Matrix4();
		this.projectionViewMatrix = new Matrix4();
		this.rightDirection = new Vector3();
		this.frustum = new Frustum();

		this.uniforms = new UniformData({
			name: 'camera',
			isGlobal: true,
			values: {
				projection: this.projectionMatrix,
				view: this.viewMatrix,
			}
		});

		this.subscribe('resize', this._onResize, this);
	}
	
	updateFrustum() {
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
		this.rightDirection.set(this.viewMatrix[0], this.viewMatrix[1], this.viewMatrix[2]);
		this.projectionViewMatrix.multiplyMatrices(this.projectionMatrix, this.viewMatrix);
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
}

export { Camera };