import { Object3D } from './Object3D';
import { Matrix4 } from '../math/Matrix4';
import { Vector3 } from '../math/Vector3';
const _identity = new Matrix4();


class InstancedMesh extends Object3D {
    constructor(geometry, material, count) {
        super(geometry, material);
        this.isInstancedMesh = true;
        this.type = 'InstancedMesh';
        this.instanceMatrix = new InstancedBufferAttribute(new Float32Array(count * 16), 16);
        this.count = count;
    }
    
    setMatrixAt
    
    setMatrixAt( index, matrix ) {

		matrix.toArray( this.instanceMatrix.array, index * 16 );

	}

}

export { InstancedMesh };