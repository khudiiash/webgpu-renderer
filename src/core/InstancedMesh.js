import { Object3D } from './Object3D';
import { Matrix4 } from '../math/Matrix4';
import { Vector3 } from '../math/Vector3';
import { UniformGroup } from '../renderer/shaders/UniformGroup';
import { Uniform } from '../renderer/shaders/Uniform';
import { Mesh } from './Mesh';
import { ShaderChunks } from '../renderer/shaders/ShaderChunks';
import { Quaternion } from '../math/Quaternion';

const _identity = new Matrix4();
const _mat = new Matrix4();  
const _mat2 = new Matrix4();
const _quat = new Quaternion();

class InstancedMesh extends Mesh {
    constructor(geometry, material, count) {
        super(geometry, material);
        this.isInstancedMesh = true;
        this.type = 'InstancedMesh';
        this.instanceMatrix = new Float32Array(count * 16);
        this.count = count;
        this.needsUpdate = true;
        
        material.uniforms[0] = new UniformGroup({
            name: 'instances',
            visibility: GPUShaderStage.VERTEX,
            type: 'storage',
            perMesh: true,
            typeString: 'storage, read',
            bufferType: 'read-only-storage',
            uniforms: [
                new Uniform('instances').storage(count * 16, 'array<mat4x4f>'),
            ]
        });
        
        material.chunks.vertex[0] = ShaderChunks.vertex.instance_position;

        for ( let i = 0; i < count; i ++ ) {
			this.setMatrixAt( _identity, i );
		}
    }
    

    
    setPositionAt(position, index) {
        this.getMatrixAt(_mat, index);
        _mat.setPosition(position);
        this.setMatrixAt(_mat, index);     
    }
    
    getPositionAt(index) {
        this.getMatrixAt(_mat, index);
        return _mat.getPosition();
    }   
    
    lookAt(target, index) {
        this.getMatrixAt(_mat, index);
        const position = _mat.getPosition();
        const rotationMat = _mat2.extractRotation(_mat).lookAtRotation(position, target);
        const quat = _quat.setFromRotationMatrix(rotationMat);
        const scale = _mat.getScale();
        _mat.compose(position, quat, scale);

        this.setMatrixAt(_mat, index);
    }
    
    rotateXAt(angle, index) {
        this.getMatrixAt(_mat, index);
        _mat.rotateX(angle);
        this.setMatrixAt(_mat, index);
    }
    
    rotateYAt(angle, index) {
        this.getMatrixAt(_mat, index);
        _mat.rotateY(angle);
        this.setMatrixAt(_mat, index);
    }
    
    rotateZAt(angle, index) {
        this.getMatrixAt(_mat, index);
        _mat.rotateZ(angle);
        this.setMatrixAt(_mat, index);
    }
    
    setScaleAt(scale, index) {
        this.getMatrixAt(_mat, index);
        _mat.scale(scale);
        this.setMatrixAt(_mat, index);
    }
    
    setMatrixAt( matrix, index ) {
		matrix.toArray( this.instanceMatrix, index * 16 );
        this.needsUpdate = true;
	}
    
    
    
    getMatrixAt( matrix, index ) {
        matrix.fromArray( this.instanceMatrix, index * 16 ); 
    }
            

}

export { InstancedMesh };