import { Matrix4 } from '@/math/Matrix4';
import { UniformData } from '@/data/UniformData';
import { Object3D } from './Object3D'
import { Geometry } from '@/geometry/Geometry';
import { Material } from '@/materials/Material';
import { uuid } from '@/util/general';
import { BufferData } from '@/data/BufferData';
import { Euler, Quaternion, Vector3 } from '@/math';
import { Struct } from '@/data/Struct';

export class Mesh extends Object3D {
    public geometry!: Geometry;
    public material!: Material;
    public id: string = uuid('mesh');
    public count = 1;
    public instanceMatrices: BufferData;

    public isMesh: boolean = true;
    public isInstanced: boolean = false;
    public type: string = 'mesh';
    public localInstanceMatrices: BufferData;

    static struct = new Struct('MeshOptions', {
        useBillboard: 'u32',
    })

    constructor(geometry?: Geometry, material?: Material, count: number = 1) {
        super();
        if (geometry) {
            this.geometry = geometry;
        }
        if (material) {
            material.addMesh(this);
            this.material = material;
        }
        this.count = Math.max(1, count);
        this.isInstanced = count > 1;

        this.instanceMatrices = new BufferData(this.count, 16);
        this.localInstanceMatrices = new BufferData(this.count, 16);

        for (let i = 0; i < this.count; i++) {
            this.localInstanceMatrices.set(Matrix4.IDENTITY, i * 16);
        }
        for (let i = 0; i < this.count; i++) {
            this.instanceMatrices.set(Matrix4.IDENTITY, i * 16);
        }

        this.uniforms = new Map<string, UniformData>();
        this.uniforms.set('MeshInstances', new UniformData(this, {
                name: 'MeshInstances',
                isGlobal: false,
                type: 'storage',
                values: {
                    instances: this.instanceMatrices,
                }
            }),
        );

        this.uniforms.set('MeshOptions', new UniformData(this, {
                name: 'MeshOptions',
                isGlobal: false,
                struct: Mesh.struct,
                values: {
                    useBillboard: 0,
                }
            }),
        );
    }

    getMatrixAt(index = 0, matrix = Matrix4.instance): Matrix4 {
        matrix.fromArraySilent(this.instanceMatrices, index * 16); 
        return matrix;
    }

    setMatrixAt(index: number, matrix: Matrix4) {
        if (index >= 0 && index < this.count) {
            const offset = index * 16;
            this.localInstanceMatrices.set(matrix, offset);
            this.updateInstanceWorldMatrix(index);
        }
    }

    setPositionAt(index: number, x: number | Vector3, y: number = 0, z: number = 0) {
        if (x instanceof Vector3) {
            z = x.z;
            y = x.y;
            x = x.x;
        } 
        this.localInstanceMatrices.set([x, y, z], index * 16 + 12);
        this.updateInstanceWorldMatrix(index);
    }

    setScaleAt(index: number, x: number | Vector3, y?: number, z?: number) {
        if (x instanceof Vector3) {
            z = x.z;
            y = x.y;
            x = x.x;
        } else if (y === undefined || z === undefined) {
            y = z = x;
        }

        const m = this.getMatrixAt(index, _mat);
        m.setScale(x, y, z);
        this.setMatrixAt(index, m);
    }

    /** 
     * Set all instance positions at once
     * @param positions Continuous array of positions, must be 3 * count in length
     */
    setAllPositions(positions: ArrayLike<number>) {
        for (let i = 0; i < this.count; i++) {
            this.localInstanceMatrices[12 + i * 16] = positions[i * 3];
            this.localInstanceMatrices[13 + i * 16] = positions[i * 3 + 1];
            this.localInstanceMatrices[14 + i * 16] = positions[i * 3 + 2];
        }

        this.updateAllInstanceWorldMatrices();
    }

    setAllScales(scales: ArrayLike<number> | number) {
        if (typeof scales === 'number') {
            for (let i = 0; i < this.count; i++) {
                this.getMatrixAt(i, _mat);
                _mat.scale(Vector3.instance.setXYZ(scales, scales, scales));
                this.localInstanceMatrices.setSilent(_mat, i * 16);
            }
        } else {
            for (let i = 0; i < this.count; i++) {
                this.getMatrixAt(i, _mat);
                _mat.scale(Vector3.instance.setXYZ(scales[i * 3], scales[i * 3 + 1], scales[i * 3 + 2]));
                this.localInstanceMatrices.setSilent(_mat, i * 16);
            }
        }
        this.updateAllInstanceWorldMatrices();
    }

    setAllRotations(rotations: ArrayLike<number>) {
        for (let i = 0; i < this.count; i++) {
            this.getMatrixAt(i, _mat);
            const position = _mat.getPosition(Vector3.instance);
            const scale = _mat.getScale(_vec1);
            _mat.compose(position, Quaternion.instance.setFromEuler(Euler.instance.fromArray(rotations, i * 3)), scale);
            this.localInstanceMatrices.setSilent(_mat, i * 16);
        }
        this.updateAllInstanceWorldMatrices();
    }

    rotateXAt(index: number, angle: number) {
        this.getMatrixAt(index, _mat);
        _mat.rotateX(angle);
        this.setMatrixAt(index, _mat);
    }
    
    rotateYAt(index: number, angle: number) {
        this.getMatrixAt(index, _mat);
        _mat.rotateY(angle);
        this.setMatrixAt(index, _mat);
    }

    rotateZAt(index: number, angle: number) {
        this.getMatrixAt(index, _mat);
        _mat.rotateZ(angle);
        this.setMatrixAt(index, _mat);
    }

    updateMatrixWorld(fromParent: boolean = false) {
        super.updateMatrixWorld(fromParent);
        this.updateAllInstanceWorldMatrices();
    }

    getPositionAt(index: number, vector = Vector3.instance): Vector3 {
        vector.fromArray(this.localInstanceMatrices, index * 16 + 12);
        return vector;
    }

    getScaleAt(index: number, vector = Vector3.instance): Vector3 {
        this.getMatrixAt(index, _mat);
        return _mat.getScale(vector);
    }

    getWorldPositionAt(index: number, vector = Vector3.instance): Vector3 {
        this.getMatrixAt(index, _mat);
        return _mat.getPosition(vector);
    }

    private updateInstanceWorldMatrix(index: number) {
        const localMatrix = this.getLocalMatrixAt(index, _mat);
        const worldMatrix = Matrix4.instance.multiplyMatrices(this.matrixWorld, localMatrix);
        this.instanceMatrices.set(worldMatrix, index * 16);
    }

    private updateInstanceWorldMatrixSilent(index: number) {
        const localMatrix = this.getLocalMatrixAt(index, _mat);
        const worldMatrix = Matrix4.instance.multiplyMatrices(this.matrixWorld, localMatrix);
        this.instanceMatrices.setSilent(worldMatrix, index * 16);
    }

    private updateAllInstanceWorldMatrices() {
        for (let i = 0; i < this.count; i++) {
            this.updateInstanceWorldMatrixSilent(i);
        }

        this.instanceMatrices.monitor.check();
    }

    translateAt(index: number, x: number, y: number, z: number) {
        this.getMatrixAt(index, _mat);
        _mat.translate(Vector3.instance.setXYZ(x, y, z));
        this.localInstanceMatrices.setSilent(_mat, index * 16);
        this.updateInstanceWorldMatrix(index);
    }

    translateAll(translations: ArrayLike<number>) {
        for (let i = 0; i < this.count; i++) {
            this.getMatrixAt(i, _mat);
            _mat.translate(Vector3.instance.setXYZ(translations[i * 3], translations[i * 3 + 1], translations[i * 3 + 2]));
            this.localInstanceMatrices.setSilent(_mat, i * 16);
        }

        this.updateAllInstanceWorldMatrices();
    }

    getLocalMatrixAt(index: number, matrix = Matrix4.instance): Matrix4 {
        matrix.fromArraySilent(this.localInstanceMatrices, index * 16);
        return matrix;
    }

    setMaterial(material: Material) {
        this.material = material;
    }

    setGeometry(geometry: Geometry) {
        this.geometry = geometry;
    }

    copy(source: Mesh) {
        this.geometry = source.geometry;
        this.material = source.material;
        this.count = source.count;
        super.copy(source);
        this.uniforms.get('MeshInstances')!.notifyRebuild();
        this.uniforms.get('MeshOptions')!.notifyRebuild();
        return this;
    }
}

const _vec1 = new Vector3();
const _mat = new Matrix4();