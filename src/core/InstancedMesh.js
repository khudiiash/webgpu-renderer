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
const _vec1 = new Vector3();
const _vec2 = new Vector3();
const _zero = new Vector3();
const _rotMat = new Matrix4();


class InstancedMesh extends Mesh {
    constructor(geometry, material, count) {
        super(geometry, material);
        this.isInstancedMesh = true;
        geometry.isInstancedGeometry = true;
        this.type = 'instanced_mesh';
        this.instanceMatrix = new Float32Array(count * 16);
        this.count = count;
        this.needsUpdate = true;
        
        material.uniforms[0] = new UniformGroup({
            name: 'instances',
            visibility: GPUShaderStage.VERTEX,
            type: 'storage',
            perMesh: true,
            bufferType: 'storage',
            uniforms: [
                new Uniform('instances').storage(count, 'mat4x4f'),
            ]
        });
        
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
        const pos = _mat.getPosition();
        _rotMat.lookAt(pos, target);
        _quat.setFromRotationMatrix(_rotMat).invert();
        _mat.compose(_mat.getPosition(), _quat, _mat.getScale());

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
    
    setAllPositionsArray(positions) {
         for (let i = 0; i < this.count; i++) {
            this.getMatrixAt(_mat, i);
            _mat.setPosition(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
		    _mat.toArray( this.instanceMatrix, i * 16 );
         }
        this.geometry.computeBoundingBox();
         this.write(this.instanceMatrix, 'instances');
    }
    

    setAllDirectionsArray(directions) {
        for (let i = 0; i < this.count; i++) {
            this.getMatrixAt(_mat, i);
            _vec1.setFromMatrixPosition(_mat);
            _vec2.set(directions[i * 3], directions[i * 3 + 1], directions[i * 3 + 2]);
            _rotMat.lookAt(_vec2, _zero);
            _quat.setFromRotationMatrix(_rotMat).invert();
            _mat.compose(_vec1, _quat, _mat.getScale());
            
            _mat.toArray( this.instanceMatrix, i * 16 );
        }
        this.write(this.instanceMatrix, 'instances');
    }
    
    setScaleAt(scale, index) {
        this.getMatrixAt(_mat, index);
        _mat.scale(scale);
        this.setMatrixAt(_mat, index);
    }
    
    setMatrixAt( matrix, index ) {
		matrix.toArray( this.instanceMatrix, index * 16 );
        this.geometry.computeBoundingBox();
        this.write(matrix.data, 'instances', index * 16 * 4);
	}
    
    
    
    getMatrixAt( matrix, index ) {
        matrix.fromArray( this.instanceMatrix, index * 16 ); 
    }
            

}

export { InstancedMesh };