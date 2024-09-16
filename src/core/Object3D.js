import { Vector3 } from '../math/Vector3.js';
import { Quaternion } from '../math/Quaternion.js';
import { Euler } from '../math/Euler.js';
import { Matrix4 } from '../math/Matrix4.js';

const _target = new Vector3();
const _position = new Vector3();
const _scale = new Vector3();

const _x = new Vector3();
const _y = new Vector3();
const _z = new Vector3();
const _m1 = new Matrix4();
const _q1 = new Quaternion();

class Object3D {
    constructor() {
        this.children = [];
        this.childrenMap = {};
        this.static = false;
        this.parent = null;
        this.id = Math.random(); 
        this.name = 'Unnamed';
        this.type = 'Object3D';
        this.isObject3D = true;
        this.version = 0;
        this.matrixWorldAutoUpdate = true;
        this.matrixAutoUpdate = true;
        this.matrixWorldNeedsUpdate = false;

        this.position = new Vector3();
        this.rotation = new Euler();
        this.quaternion = new Quaternion();
        this.scale = new Vector3(1, 1, 1); 
        
        function onRotationChange() {
            this.quaternion.setFromEuler(this.rotation, false);
            this.updateWorldMatrix(false, true);
        }
        
        function onQuaternionChange() {
            this.rotation.setFromQuaternion(this.quaternion, undefined, false);
            this.updateWorldMatrix(false, true);
        }
        
        function onPositionChange() {
            this.updateWorldMatrix(false, true);
        }
        
        this.rotation._onChange(onRotationChange.bind(this));
        this.quaternion._onChange(onQuaternionChange.bind(this));
        this.position._onChange(onPositionChange.bind(this));

        this.up = new Vector3(0, 1, 0);
        this.matrix = new Matrix4();
        this.matrixWorld = new Matrix4();
        this.direction = new Vector3(0, 0, -1);
        this.rotationMatrix = new Matrix4();
    }
    
    
    updateMatrix() {
        this.matrix.compose(this.position, this.quaternion, this.scale);
        this.matrixWorldNeedsUpdate = true;
	}
    
    updateMatrixWorld(force) {
        if ( this.matrixAutoUpdate ) this.updateMatrix();
        if ( this.matrixWorldNeedsUpdate || force ) {
            if ( this.parent === null ) {
                this.matrixWorld.copy(this.matrix);
            } else {
                if (this.parent.matrixWorld.needsUpdate) {
                    this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
                }
            }
            this.matrixWorldNeedsUpdate = false;
            force = true;
        }
        
        const children = this.children;

		for ( let i = 0, l = children.length; i < l; i ++ ) {
			const child = children[ i ];
			child.updateMatrixWorld(force);
		}
        
        _m1.extractRotation(this.matrixWorld);
        this.direction.set(this.matrixWorld.data[8], this.matrixWorld.data[9], this.matrixWorld.data[10]).normalize();
    }
    
    translate(x, y, z) {
        this.position.add(x, y, z);
    }
    
    localToWorld(v) {
        this.updateWorldMatrix(true, false);
        return v.applyMatrix4(this.matrixWorld);
    }
    
    worldToLocal(v) {
        this.updateMatrixWorld(true, false);
        return v.applyMatrix4( _m1.copy( this.matrixWorld ).invert() )
    }
    

    updateWorldMatrix( updateParents, updateChildren ) {
		const parent = this.parent;

		if ( updateParents === true && parent !== null ) {
			parent.updateWorldMatrix( true, false );
		}

		if ( this.matrixAutoUpdate ) this.updateMatrix();

		if ( this.matrixWorldAutoUpdate === true ) {
			if ( this.parent === null ) {
                this.matrixWorld.copy(this.matrix);
			} else {
                Matrix4.multiply(this.parent.matrixWorld, this.matrix, this.matrixWorld);
			}
		}

		// make sure descendants are updated
		if ( updateChildren === true ) {
			const children = this.children;
			for ( let i = 0, l = children.length; i < l; i ++ ) {
				const child = children[ i ];
				child.updateWorldMatrix( false, true );
			}
		}
        
        _m1.extractRotation(this.matrixWorld);
        this.direction.set(this.matrixWorld.data[8], this.matrixWorld.data[9], this.matrixWorld.data[10]).normalize();
	}
    
    setScale(x, y, z) {
        if (y === undefined) y = x;
        if (z === undefined) z = x;
        this.scale.set(x, y, z);
    }
    
    setPosition(x = 0, y = 0, z = 0) {
        this.position.set(x, y, z);
    }

    add(child) {
        child.parent = this;
        this.children.push(child);
        this.childrenMap[child.name] = child;
    }

    remove(child) {
        const index = this.children.indexOf(child);
        this.children.splice(index, 1);
        delete this.childrenMap[child.name];
    }
    
    findByName(name) {
        return this.childrenMap[name];
    }
    
    
    lookAt(x, y, z) {
        if ( x.isVector3 ) {

			_target.copy( x );

		} else {

			_target.set( x, y, z );

		}

		const parent = this.parent;

		this.updateWorldMatrix( true, false );

		_position.setFromMatrixPosition( this.matrixWorld );

		if ( this.isCamera || this.isLight ) {

			_m1.lookAt( _position, _target, this.up );

		} else {

			_m1.lookAt( _target, _position, this.up );

		}

		this.quaternion.setFromRotationMatrix( _m1 );

		if ( parent ) {

			_m1.extractRotation( parent.matrixWorld );
			_q1.setFromRotationMatrix( _m1 );
			this.quaternion.premultiply( _q1.invert() );

		}
    }
    
    
    getWorldDirection() {
        this.updateWorldMatrix( true, false );

		const e = this.matrixWorld.data;
        this.direction.set( e[ 8 ], e[ 9 ], e[ 10 ] ).normalize();

		return this.direction;
    }


    getLocalPosition() {

    }
    
    setLocalPosition(x, y, z) {

    }
    
    findByName(name) {
        for (let i = 0; i < this.children.length; i++) {
            if (this.children[i].name === name) {
                return this.children[i];
            }
        }
    }
    
}

export { }