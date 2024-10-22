import { Vector3 } from './Vector3.js';
const _v1 = new Vector3();

class BoundingSphere {
    constructor(center = new Vector3(), radius = 0) {  
        this._center = center;
        this._radius = radius;
		this.data = new Float32Array([center.x, center.y, center.z, radius]);
    } 
	
	get radius() {
		return this._radius;
	}
	
	set radius(value) {
		this._radius = value;
		this.data[3] = value;
	}
	
	get center() {
		return this._center;
	}
	
	set center(value) {
		this._center = value;
		this.data[0] = value.x;
		this.data[1] = value.y;
		this.data[2] = value.z;
	}
    
    set(center, radius) {
        this.center.copy(center);
        this.radius = radius;
		this.data.set([center.x, center.y, center.z, radius]);
        return this;
    }
    
    setFromPoints( points, optionalCenter ) {

		const center = this.center;

		if ( optionalCenter !== undefined ) {

			center.copy( optionalCenter );

		} else {

			_box.setFromPoints( points ).getCenter( center );

		}

		let maxRadiusSq = 0;

		for ( let i = 0, il = points.length; i < il; i ++ ) {

			maxRadiusSq = Math.max( maxRadiusSq, center.distanceToSquared( points[ i ] ) );

		}

		this.radius = Math.sqrt( maxRadiusSq );
		this.data.set([center.x, center.y, center.z, this.radius]);

		return this;

	}
    
    copy( sphere ) {

		this.center.copy( sphere.center );
		this.radius = sphere.radius;

		return this;

	}

	isEmpty() {

		return ( this.radius < 0 );

	}

	makeEmpty() {

		this.center.set( 0, 0, 0 );
		this.radius = - 1;

		return this;

	}

	containsPoint( point ) {

		return ( point.distanceToSquared( this.center ) <= ( this.radius * this.radius ) );

	}

	distanceToPoint( point ) {

		return ( point.distanceTo( this.center ) - this.radius );

	}

	intersectsSphere( sphere ) {

		const radiusSum = this.radius + sphere.radius;

		return sphere.center.distanceToSquared( this.center ) <= ( radiusSum * radiusSum );

	}

	intersectsBox( box ) {

		return box.intersectsSphere( this );

	}

	intersectsPlane( plane ) {

		return Math.abs( plane.distanceToPoint( this.center ) ) <= this.radius;

	}

	clampPoint( point, target ) {

		const deltaLengthSq = this.center.distanceToSquared( point );

		target.copy( point );

		if ( deltaLengthSq > ( this.radius * this.radius ) ) {

			target.sub( this.center ).normalize();
			target.multiplyScalar( this.radius ).add( this.center );

		}

		return target;

	}

	getBoundingBox( target ) {

		if ( this.isEmpty() ) {

			// Empty sphere produces empty bounding box
			target.makeEmpty();
			return target;

		}

		target.set( this.center, this.center );
		target.expandByScalar( this.radius );

		return target;

	}

	applyMatrix4( matrix ) {

		this.center.applyMatrix4( matrix );
		this.radius = this.radius * matrix.getMaxScaleOnAxis();
		this.data.set([this.center.x, this.center.y, this.center.z, this.radius]);
		return this;

	}

	translate( offset ) {
		this.center.add( offset );
		this.data.set([this.center.x, this.center.y, this.center.z, this.radius]);
		return this;

	}

	expandByPoint( point ) {

		if ( this.isEmpty() ) {

			this.center.copy( point );

			this.radius = 0;

			return this;

		}

		_v1.subVectors( point, this.center );

		const lengthSq = _v1.lengthSq();

		if ( lengthSq > ( this.radius * this.radius ) ) {

			// calculate the minimal sphere

			const length = Math.sqrt( lengthSq );

			const delta = ( length - this.radius ) * 0.5;

			this.center.addScaledVector( _v1, delta / length );

			this.radius += delta;

		}
		
		this.data.set([this.center.x, this.center.y, this.center.z, this.radius]);

		return this;

	}

	union( sphere ) {

		if ( sphere.isEmpty() ) {

			return this;

		}

		if ( this.isEmpty() ) {

			this.copy( sphere );

			return this;

		}

		if ( this.center.equals( sphere.center ) === true ) {

			 this.radius = Math.max( this.radius, sphere.radius );

		} else {

			_v2.subVectors( sphere.center, this.center ).setLength( sphere.radius );

			this.expandByPoint( _v1.copy( sphere.center ).add( _v2 ) );

			this.expandByPoint( _v1.copy( sphere.center ).sub( _v2 ) );

		}

		return this;

	}

	equals( sphere ) {

		return sphere.center.equals( this.center ) && ( sphere.radius === this.radius );

	}

	clone() {

		return new this.constructor().copy( this );

	}
    
    
}

export { BoundingSphere };