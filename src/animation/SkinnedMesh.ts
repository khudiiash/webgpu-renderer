import { Mesh } from '../core/Mesh.js';
import { Matrix4 } from '../math/Matrix4.js';
import { Vector3 } from '../math/Vector3.js';
import { Vector4 } from '../math/Vector4.js';
import { Uniform } from '../renderer/shaders/Uniform.js';
import { UniformGroup } from '../renderer/shaders/UniformGroup.js';
import { BoundingSphere } from '../math/BoundingSphere.js';
import type { Box3 } from '../math/Box3.js';
import type { Raycaster } from '../core/Raycaster.js';
import type { Ray } from '../math/Ray.js';
import type { Skeleton } from './Skeleton.js';

// Example interface for geometry (adjust as needed)
interface SkinnedGeometry {
	getAttribute(name: string): {
		count: number;
		setXYZW(index: number, x: number, y: number, z: number, w: number): void;
	};
	attributes: {
		joints: {
			getComponent(i: number): number;
			setXYZW?(i: number, x: number, y: number, z: number, w: number): void;
		};
		weights: {
			count: number;
			getComponent(i: number): number;
			setXYZW(index: number, x: number, y: number, z: number, w: number): void;
		};
	};
}

const AttachedBindMode = 0;
const DetachedBindMode = 1;

const _basePosition = new Vector3();
const _indices = new Vector4();
const _weights = new Vector4();
const _vector3 = new Vector3();
const _matrix4 = new Matrix4();
const _vertex = new Vector3();
const _inverseMatrix = new Matrix4();

// Temp placeholders for global objects
const _sphere = new BoundingSphere();
const _ray = {} as Ray;

class SkinnedMesh extends Mesh {
	isSkinnedMesh: boolean;
	type: string;
	bindMode: number;
	bindMatrix: Matrix4;
	bindMatrixInverse: Matrix4;
	boundingBox: Box3 | null;
	boundingSphere: BoundingSphere | null;
	bonesMatrices: Float32Array;
	inverseBindMatrices: Float32Array;
	skeleton: Skeleton;

	constructor(
		geometry: SkinnedGeometry,
		material: any,
		skeleton: Skeleton
	) {
		super(geometry, material);

		this.isSkinnedMesh = true;
		this.type = 'skinned_mesh';
		this.bindMode = AttachedBindMode;
		this.bindMatrix = new Matrix4();
		this.bindMatrixInverse = new Matrix4();
		this.boundingBox = null;
		this.boundingSphere = null;
		this.bonesMatrices = new Float32Array(16 * skeleton.bones.length);
		this.inverseBindMatrices = new Float32Array(16 * skeleton.bones.length);
		// this.material.uniforms.unshift(
		// 	new UniformGroup({
		// 		name: 'joint_matrices',
		// 		perMesh: true,
		// 		bufferType: 'storage',
		// 		visibility: GPUShaderStage.VERTEX,
		// 		uniforms: [
		// 			new Uniform('joint_matrices').storage('mat4x4f', skeleton.bones.length),
		// 		],
		// 	}),
		// 	new UniformGroup({
		// 		name: 'inverse_bind_matrices',
		// 		perMesh: true,
		// 		bufferType: 'storage',
		// 		visibility: GPUShaderStage.VERTEX,
		// 		uniforms: [
		// 			new Uniform('inverse_bind_matrices').storage(
		// 				'mat4x4f',
		// 				skeleton.bones.length
		// 			),
		// 		],
		// 	})
		// );
		this.bind(skeleton);
	}

	computeBoundingBox(): void {
		const geometry = this.geometry as SkinnedGeometry;
		if (this.boundingBox === null) {
			// Define Box3 or import it
			this.boundingBox = new (class implements Box3 {
				makeEmpty(): this {
					return this;
				}
				expandByPoint(): void {}
				clone(): Box3 {
					return this;
				}
			})();
		}
		this.boundingBox.makeEmpty();

		const positionAttribute = geometry.getAttribute('position');
		for (let i = 0; i < positionAttribute.count; i++) {
			this.getVertexPosition(i, _vertex);
			this.boundingBox.expandByPoint(_vertex);
		}
	}

	computeBoundingSphere(): void {
		const geometry = this.geometry as SkinnedGeometry;
		if (this.boundingSphere === null) {
			this.boundingSphere = new BoundingSphere();
		}
		this.boundingSphere.makeEmpty();

		const positionAttribute = geometry.getAttribute('position');
		for (let i = 0; i < positionAttribute.count; i++) {
			this.getVertexPosition(i, _vertex);
			this.boundingSphere.expandByPoint(_vertex);
		}
	}

	copy(source: SkinnedMesh, recursive?: boolean): this {
		super.copy(source, recursive);

		this.bindMode = source.bindMode;
		this.bindMatrix.copy(source.bindMatrix);
		this.bindMatrixInverse.copy(source.bindMatrixInverse);
		this.skeleton = source.skeleton;

		if (source.boundingBox !== null) this.boundingBox = source.boundingBox.clone();
		if (source.boundingSphere !== null)
			this.boundingSphere = source.boundingSphere.clone();

		return this;
	}

	raycast(raycaster: Raycaster, intersects: any[]): void {
		const material = this.material;
		const matrixWorld = this.matrixWorld;

		if (material === undefined) return;

		if (this.boundingSphere === null) this.computeBoundingSphere();
		_sphere.copy(this.boundingSphere as BoundingSphere);
		_sphere.applyMatrix4(matrixWorld);

		if (raycaster.ray.intersectsSphere(_sphere) === false) return;

		_inverseMatrix.copy(matrixWorld).invert();
		_ray.copy(raycaster.ray).applyMatrix4(_inverseMatrix);

		if (this.boundingBox !== null) {
			if (_ray.intersectsBox(this.boundingBox) === false) return;
		}

		this._computeIntersections(raycaster, intersects, _ray);
	}

	getVertexPosition(index: number, target: Vector3): Vector3 {
		super.getVertexPosition(index, target);
		this.applyBoneTransform(index, target);
		return target;
	}

	bind(skeleton: Skeleton, bindMatrix?: Matrix4): void {
		this.skeleton = skeleton;
		// if needed, copy or compute bindMatrix
	}

	pose(): void {
		this.skeleton.pose();
	}

	normalizeSkinWeights(): void {
		const vector = new Vector4();
		const skinWeight = (this.geometry as SkinnedGeometry).attributes.weights;

		for (let i = 0, l = skinWeight.count; i < l; i++) {
			vector.setFromBufferAttribute(skinWeight, i);
			const scale = 1.0 / vector.manhattanLength();
			if (scale !== Infinity) {
				vector.multiplyScalar(scale);
			} else {
				vector.set(1, 0, 0, 0);
			}
			skinWeight.setXYZW(i, vector.x, vector.y, vector.z, vector.w);
		}
	}

	updateMatrixWorld(force?: boolean): void {
		super.updateMatrixWorld(force);
		if (this.bindMode === AttachedBindMode) {
			this.bindMatrixInverse.copy(this.matrixWorld).invert();
		} else if (this.bindMode === DetachedBindMode) {
			this.bindMatrixInverse.copy(this.bindMatrix).invert();
		} else {
			console.warn('SkinnedMesh: Unrecognized bindMode: ' + this.bindMode);
		}
	}

	updateWorldMatrix(updateParents: boolean, updateChildren: boolean): void {
		super.updateWorldMatrix(updateParents, updateChildren);
		if (this.bindMode === AttachedBindMode) {
			this.bindMatrixInverse.copy(this.matrixWorld).invert();
		} else if (this.bindMode === DetachedBindMode) {
			this.bindMatrixInverse.copy(this.bindMatrix).invert();
		} else {
			console.warn('SkinnedMesh: Unrecognized bindMode: ' + this.bindMode);
		}
	}

	applyBoneTransform(index: number, vector: Vector3): Vector3 {
		const skeleton = this.skeleton;
		const geometry = this.geometry as SkinnedGeometry;

		_indices.setFromBufferAttribute(geometry.attributes.joints, index);
		_weights.setFromBufferAttribute(geometry.attributes.weights, index);
		_basePosition.copy(vector).applyMatrix4(this.bindMatrix);

		vector.set(0, 0, 0);
		for (let i = 0; i < 4; i++) {
			const weight = _weights.getComponent(i);
			if (weight !== 0) {
				const boneIndex = _indices.getComponent(i);
				_matrix4.multiplyMatrices(
					skeleton.bones[boneIndex].matrixWorld,
					skeleton.boneInverses[boneIndex]
				);
				vector.addScaledVector(
					_vector3.copy(_basePosition).applyMatrix4(_matrix4),
					weight
				);
			}
		}
		return vector.applyMatrix4(this.bindMatrixInverse);
	}

	update(): void {
		this.updateWorldMatrix(true, true);
		this.skeleton.update(this.bindMatrixInverse);
		this.write(this.skeleton.boneMatrices, 'joint_matrices');
		this.write(this.skeleton.inverseBindMatrices, 'inverse_bind_matrices');
	}
}

export { SkinnedMesh };
