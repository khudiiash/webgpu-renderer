import { Matrix4 } from '../math/Matrix4.js';
import { Bone } from './Bone.js';
//import { DataTexture, RGBAFormat, FloatType } from '../textures/DataTexture.js';

interface SkeletonJSON {
	uuid?: string;
	bones: string[];
	boneInverses: number[][];
	metadata?: {
		version: number;
		type: string;
		generator: string;
	};
}

const _offsetMatrix = new Matrix4();
const _inverseMatrix = new Matrix4();
const _identityMatrix = new Matrix4();

export class Skeleton {
	public uuid!: string;
	public bones: Bone[];
	public boneInverses: Matrix4[];
	public boneMatrices: Float32Array;
	public globalMatrixInverse: Matrix4;
	public inverseBindMatrices: Float32Array;

	constructor(bones: Bone[], boneInverses: Matrix4[]) {
		this.bones = bones.slice(0);
		this.boneInverses = boneInverses.slice(0);
		this.boneMatrices = new Float32Array(this.bones.length * 16);
		this.globalMatrixInverse = new Matrix4();
		this.inverseBindMatrices = new Float32Array(this.boneInverses.length * 16);

		for (let i = 0; i < this.boneInverses.length; i++) {
			this.inverseBindMatrices.set(this.boneInverses[i], i * 16);
		}

		//this.boneTexture = null;
	}

	public calculateInverses(): void {
		this.boneInverses.length = 0;

		for (let i = 0, il = this.bones.length; i < il; i++) {
			const inverse = new Matrix4();

			if (this.bones[i]) {
				this.bones[i].updateMatrixWorld(true);
				inverse.copy(this.bones[i].matrixWorld).invert();
			}

			this.boneInverses.push(inverse);
			this.inverseBindMatrices.set(inverse, i * 16);
		}
	}

	public pose(): void {
		for (let i = 0, il = this.bones.length; i < il; i++) {
			const bone = this.bones[i];
			if (bone) {
				bone.matrixWorld.copy(this.boneInverses[i]).invert();
			}
		}

		for (let i = 0, il = this.bones.length; i < il; i++) {
			const bone = this.bones[i];
			if (bone) {
				if (bone.parent && (bone.parent as Bone).isBone) {
					bone.matrix.copy((bone.parent as Bone).matrixWorld).invert();
					bone.matrix.multiply(bone.matrixWorld);
				} else {
					bone.matrix.copy(bone.matrixWorld);
				}
				bone.matrix.decompose(bone.position, bone.quaternion, bone.scale);
			}
		}
	}

	public update(globalWorldMatrix: Matrix4): void {
		const bones = this.bones;
		const boneMatrices = this.boneMatrices;
		//const boneTexture = this.boneTexture;

		this.globalMatrixInverse.copy(globalWorldMatrix);

		for (let i = 0; i < bones.length; i++) {
			const bone = bones[i];
			_offsetMatrix.multiplyMatrices(this.globalMatrixInverse, bone.matrixWorld);
			boneMatrices.set(_offsetMatrix, i * 16);
		}

		// if (boneTexture !== null) {
		// 	boneTexture.needsUpdate = true;
		// }
	}

	public clone(): Skeleton {
		return new Skeleton(this.bones, this.boneInverses);
	}

	// public computeBoneTexture(): this {
	// 	let size = Math.sqrt(this.bones.length * 4);
	// 	size = Math.ceil(size / 4) * 4;
	// 	size = Math.max(size, 4);

	// 	const boneMatrices = new Float32Array(size * size * 4);
	// 	boneMatrices.set(this.boneMatrices);

	// 	const boneTexture = new DataTexture(boneMatrices, size, size, RGBAFormat, FloatType);
	// 	boneTexture.needsUpdate = true;

	// 	this.boneMatrices = boneMatrices;
	// 	this.boneTexture = boneTexture;

	// 	return this;
	// }

	public getBoneByName(name: string): Bone | undefined {
		for (let i = 0, il = this.bones.length; i < il; i++) {
			const bone = this.bones[i];
			if (bone.name === name) {
				return bone;
			}
		}
		return undefined;
	}

	public dispose(): void {
		// if (this.boneTexture !== null) {
		// 	this.boneTexture.dispose();
		// 	this.boneTexture = null;
		// }
	}

	public fromJSON(json: SkeletonJSON, bones: Record<string, Bone>): this {
		this.uuid = json.uuid || '';
		for (let i = 0, l = json.bones.length; i < l; i++) {
			const uuid = json.bones[i];
			let bone = bones[uuid];
			if (bone === undefined) {
				console.warn('Skeleton: No bone found with UUID:', uuid);
				bone = new Bone();
			}
			this.bones.push(bone);
			this.boneInverses.push(new Matrix4().fromArray(json.boneInverses[i]));
		}
		this.init();
		return this;
	}

	public toJSON(): SkeletonJSON {
		const data: SkeletonJSON = {
			metadata: {
				version: 4.6,
				type: 'Skeleton',
				generator: 'Skeleton.toJSON'
			},
			bones: [],
			boneInverses: []
		};

		data.uuid = this.uuid;
		const bones = this.bones;
		const boneInverses = this.boneInverses;

		for (let i = 0, l = bones.length; i < l; i++) {
			const bone = bones[i];
			data.bones.push(bone.id);
			const boneInverse = boneInverses[i];
			data.boneInverses.push(boneInverse.toArray());
		}
		return data;
	}

	private init(): void {
		this.boneMatrices = new Float32Array(this.bones.length * 16);
		this.globalMatrixInverse = new Matrix4();
		this.inverseBindMatrices = new Float32Array(this.boneInverses.length * 16);
		for (let i = 0; i < this.boneInverses.length; i++) {
			this.inverseBindMatrices.set(this.boneInverses[i], i * 16);
		}
		//this.boneTexture = null;
	}
}
