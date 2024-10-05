import { Mesh } from '../core/Mesh.js';
import { Matrix4 } from '../math/Matrix4.js';
import { Vector3 } from '../math/Vector3.js';
import { Vector4 } from '../math/Vector4.js';
import { ShaderChunks } from '../renderer/shaders/ShaderChunks.js';
import { Uniform } from '../renderer/shaders/Uniform.js';
import { UniformGroup } from '../renderer/shaders/UniformGroup.js';
const AttachedBindMode = 0;
const DetachedBindMode = 1;

const _basePosition =  new Vector3();

const _indices =  new Vector4();
const _weights =  new Vector4();

const _vector3 =  new Vector3();
const _matrix4 =  new Matrix4();
const _vertex =  new Vector3();

const _inverseMatrix =  new Matrix4();

class SkinnedMesh extends Mesh {
    
    constructor( geometry, material, skeleton ) {

		super( geometry, material );

		this.isSkinnedMesh = true;

		this.type = 'skinned_mesh';
		
		this.bindMode = AttachedBindMode;
		this.bindMatrix = new Matrix4();
		this.bindMatrixInverse = new Matrix4()

		this.boundingBox = null;
		this.boundingSphere = null;
		this.bonesMatrices = new Float32Array( 16 * skeleton.bones.length );
		this.inverseBindMatrices = new Float32Array( 16 * skeleton.bones.length );

		this.material.uniforms.unshift(
			new UniformGroup({
				name: 'joint_matrices',
				perMesh: true,
				bufferType: 'storage',
				visibility: GPUShaderStage.VERTEX,
				uniforms: [
					new Uniform('joint_matrices').storage(skeleton.bones.length, 'mat4x4f')
				]
			}),
			new UniformGroup({
				name: 'inverse_bind_matrices',
				perMesh: true,
				bufferType: 'storage',
				visibility: GPUShaderStage.VERTEX,
				uniforms: [
					new Uniform('inverse_bind_matrices').storage(skeleton.bones.length, 'mat4x4f')
				]
			})
	    );

		this.bind( skeleton );
	}

	computeBoundingBox() {

		const geometry = this.geometry;

		if ( this.boundingBox === null ) {

			this.boundingBox = new Box3();

		}

		this.boundingBox.makeEmpty();

		const positionAttribute = geometry.getAttribute( 'position' );

		for ( let i = 0; i < positionAttribute.count; i ++ ) {

			this.getVertexPosition( i, _vertex );
			this.boundingBox.expandByPoint( _vertex );

		}

	}

	computeBoundingSphere() {

		const geometry = this.geometry;

		if ( this.boundingSphere === null ) {

			this.boundingSphere = new Sphere();

		}

		this.boundingSphere.makeEmpty();

		const positionAttribute = geometry.getAttribute( 'position' );

		for ( let i = 0; i < positionAttribute.count; i ++ ) {

			this.getVertexPosition( i, _vertex );
			this.boundingSphere.expandByPoint( _vertex );

		}

	}

	copy( source, recursive ) {

		super.copy( source, recursive );

		this.bindMode = source.bindMode;
		this.bindMatrix.copy( source.bindMatrix );
		this.bindMatrixInverse.copy( source.bindMatrixInverse );

		this.skeleton = source.skeleton;

		if ( source.boundingBox !== null ) this.boundingBox = source.boundingBox.clone();
		if ( source.boundingSphere !== null ) this.boundingSphere = source.boundingSphere.clone();

		return this;

	}

	raycast( raycaster, intersects ) {

		const material = this.material;
		const matrixWorld = this.matrixWorld;

		if ( material === undefined ) return;

		// test with bounding sphere in world space

		if ( this.boundingSphere === null ) this.computeBoundingSphere();

		_sphere.copy( this.boundingSphere );
		_sphere.applyMatrix4( matrixWorld );

		if ( raycaster.ray.intersectsSphere( _sphere ) === false ) return;

		// convert ray to local space of skinned mesh

		_inverseMatrix.copy( matrixWorld ).invert();
		_ray.copy( raycaster.ray ).applyMatrix4( _inverseMatrix );

		// test with bounding box in local space

		if ( this.boundingBox !== null ) {

			if ( _ray.intersectsBox( this.boundingBox ) === false ) return;

		}

		// test for intersections with geometry

		this._computeIntersections( raycaster, intersects, _ray );

	}

	getVertexPosition( index, target ) {

		super.getVertexPosition( index, target );

		this.applyBoneTransform( index, target );

		return target;

	}

	bind( skeleton, bindMatrix ) {

		this.skeleton = skeleton;

		// if ( bindMatrix === undefined ) {

		// 	this.updateMatrixWorld( true );

		// 	this.skeleton.calculateInverses();

		// 	bindMatrix = this.matrixWorld;

		// }

		// this.bindMatrix.copy( bindMatrix );
		// this.bindMatrixInverse.copy( this.matrixWorld).invert();
	}

	pose() {

		this.skeleton.pose();

	}

	normalizeSkinWeights() {

		const vector = new Vector4();

		const skinWeight = this.geometry.attributes.weights;

		for ( let i = 0, l = skinWeight.count; i < l; i ++ ) {

			vector.setFromBufferAttribute( skinWeight, i );

			const scale = 1.0 / vector.manhattanLength();

			if ( scale !== Infinity ) {

				vector.mulScalar( scale );

			} else {

				vector.set( 1, 0, 0, 0 ); // do something reasonable

			}

			skinWeight.setXYZW( i, vector.x, vector.y, vector.z, vector.w );

		}

	}

 	updateMatrixWorld( force ) {

		super.updateMatrixWorld( force );

		if ( this.bindMode === AttachedBindMode ) {

			this.bindMatrixInverse.copy( this.matrixWorld ).invert();

		} else if ( this.bindMode === DetachedBindMode ) {

			this.bindMatrixInverse.copy( this.bindMatrix ).invert();

		} else {

			console.warn( 'SkinnedMesh: Unrecognized bindMode: ' + this.bindMode );

		}

	}

	applyBoneTransform( index, vector ) {
		const skeleton = this.skeleton;
		const geometry = this.geometry;

		_indices.setFromBufferAttribute( geometry.attributes.joint, index );
		_weights.setFromBufferAttribute( geometry.attributes.weight, index );

		_basePosition.copy( vector ).applyMatrix4( this.bindMatrix );

		vector.set( 0, 0, 0 );

		for ( let i = 0; i < 4; i ++ ) {

			const weight = _weights.getComponent( i );

			if ( weight !== 0 ) {

				const boneIndex = _indices.getComponent( i );

				_matrix4.multiplyMatrices( skeleton.bones[ boneIndex ].matrixWorld, skeleton.boneInverses[ boneIndex ] );

				vector.addScaledVector( _vector3.copy( _basePosition ).applyMatrix4( _matrix4 ), weight );

			}

		}

		return vector.applyMatrix4( this.bindMatrixInverse );

	}
	
	update() {
		this.skeleton.update(this.bindMatrixInverse);
		this.write(this.skeleton.boneMatrices, 'joint_matrices');
		this.write(this.skeleton.inverseBindMatrices, 'inverse_bind_matrices');
	}
}

export { SkinnedMesh };