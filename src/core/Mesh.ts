import { Matrix4 } from '@/math/Matrix4';
import { UniformData } from '@/data/UniformData';
import { Object3D } from './Object3D'
import { Geometry } from '@/geometry/Geometry';
import { Material } from '@/materials/Material';
import { uuid } from '@/util/general';
import { BufferData } from '@/data/BufferData';
import { Quaternion, Vector3 } from '@/math';

export class Mesh extends Object3D {
    public geometry: Geometry;
    public material: Material;
    public id: string = uuid('mesh');
    public uniforms: UniformData;
    public count = 1;
    public instanceMatrices: BufferData;

    protected isMesh: boolean = true;
    protected isInstanced: boolean = false;
    protected type: string = 'mesh';

    constructor(geometry: Geometry, material: Material, count: number = 1) {
        super();
        this.geometry = geometry;
        this.material = material;
        this.count = Math.max(1, count);
        this.isInstanced = count > 1;
        material.addMesh(this);

        this.instanceMatrices = new BufferData(this.count * 16);
        for (let i = 0; i < this.count; i++) {
            this.instanceMatrices.set(Matrix4.IDENTITY, i * 16);
        }

        if (this.isInstanced) {
            this.material.defines.MAX_INSTANCES = Math.max(this.count, this.material.defines.MAX_INSTANCES);
        }

        this.uniforms = new UniformData(this, {
            name: 'model',
            isGlobal: false,
            values: {
                transforms: this.instanceMatrices
            }
        })
    }

    getMatrixAt(index = 0, matrix = Matrix4.instance): Matrix4 {
        matrix.fromArray(this.instanceMatrices, index * 16); 
        return matrix;
    }

    setMatrixAt(index: number, matrix: Matrix4) {
        if (index >= 0 && index < this.count) {
            const offset = index * 16;
            this.instanceMatrices.set(matrix, offset);
        }
    }

    setPositionAt(index: number, x: number | Vector3, y: number = 0, z: number = 0) {
        if (x instanceof Vector3) {
            z = x.z;
            y = x.y;
            x = x.x;
        } 
        try {
            this.instanceMatrices.set([x, y, z], index * 16 + 12);
        } catch (e) {
            console.error(e, index * 16 + 12, this.instanceMatrices.length);
        }
    }

    setScaleAt(index: number, x: number | Vector3, y: number, z: number) {
        if (x instanceof Vector3) {
            z = x.z;
            y = x.y;
            x = x.x;
        } else if (y === undefined) {
            y = x;
        } else if (z === undefined) {
            z = x;
        }

        const m = this.getMatrixAt(index, _mat);
        m.scale(Vector3.instance.setXYZ(x, y, z));
        this.setMatrixAt(index, m);
    }

    lookAt(target: Object3D | Vector3, index = 0) {
        if (target instanceof Object3D) {
            target = target.position;
        }
        this.getMatrixAt(index, _mat);
        const pos = _mat.getPosition();
        _rotMat.lookAt(pos, target);
        _quat.setFromRotationMatrix(_rotMat).inverse();
        _mat.compose(_mat.getPosition(), _quat, _mat.getScale());

        this.setMatrixAt(index, _mat);
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
        // treat mesh as parent for instances
        // multiply its world matrix to instance matrices
        for (let i = 0; i < this.count; i++) {
            const m = this.getMatrixAt(i, _mat);
            m.multiply(this.matrixWorld);
            this.setMatrixAt(i, m);
        }
    }

    setMaterial(material: Material) {
        this.material = material;
    }

    setGeometry(geometry: Geometry) {
        this.geometry = geometry;
    }

    copy(source: Mesh) {
        super.copy(source);
        this.geometry = source.geometry;
        this.material = source.material;
        return this;
    }
}

const _mat = new Matrix4();
const _rotMat = new Matrix4();
const _quat = new Quaternion();
