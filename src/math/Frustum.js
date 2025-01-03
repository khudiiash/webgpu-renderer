import { Plane } from './Plane.js';
import { BoundingSphere } from './BoundingSphere.js';
import { Vector3 } from './Vector3.js';

const _sphere = new BoundingSphere();
const _vector = new Vector3();

class Frustum {
    constructor( p0 = new Plane(), p1 = new Plane(), p2 = new Plane(), p3 = new Plane(), p4 = new Plane(), p5 = new Plane() ) {
		this.planes = [ p0, p1, p2, p3, p4, p5 ];
        this.data = new Float32Array(6 * 4);
	}

    intersectsObject(object) {
        if (object.boundingSphere !== undefined ) {
			if ( object.boundingSphere === null ) object.computeBoundingSphere();
			_sphere.copy( object.boundingSphere ).applyMatrix4( object.matrixWorld );
		} else {
			const geometry = object.geometry;
			if ( geometry.boundingSphere === null ) geometry.computeBoundingSphere();
			_sphere.copy( geometry.boundingSphere ).applyMatrix4( object.matrixWorld );
		}

		return this.intersectsSphere( _sphere );

    }
    setFromProjectionMatrix(m) {
		const planes = this.planes;
		const me = m;
		const me0 = me[ 0 ], me1 = me[ 1 ], me2 = me[ 2 ], me3 = me[ 3 ];
		const me4 = me[ 4 ], me5 = me[ 5 ], me6 = me[ 6 ], me7 = me[ 7 ];
		const me8 = me[ 8 ], me9 = me[ 9 ], me10 = me[ 10 ], me11 = me[ 11 ];
		const me12 = me[ 12 ], me13 = me[ 13 ], me14 = me[ 14 ], me15 = me[ 15 ];

		planes[ 0 ].setComponents( me3 - me0, me7 - me4, me11 - me8, me15 - me12 ).normalize();
		planes[ 1 ].setComponents( me3 + me0, me7 + me4, me11 + me8, me15 + me12 ).normalize();
		planes[ 2 ].setComponents( me3 + me1, me7 + me5, me11 + me9, me15 + me13 ).normalize();
		planes[ 3 ].setComponents( me3 - me1, me7 - me5, me11 - me9, me15 - me13 ).normalize();
		planes[ 4 ].setComponents( me3 - me2, me7 - me6, me11 - me10, me15 - me14 ).normalize();
		planes[ 5 ].setComponents( me2, me6, me10, me14 ).normalize();
        for (let i = 0; i < 6; i++) {
            const plane = planes[i];
            this.data.set(plane.data, i * 4);
        }
		return this;
	} 

    intersectsSphere(sphere) {
        const center = sphere.center;
        const negRadius = -sphere.radius;

        for (let i = 0; i < 6; i++) {
            const distance = this.planes[i].distanceToPoint(center);
            if (distance < negRadius) {
                return false;
            }
        }

        return true;
    }

    containsPoint(point) {
        for (let i = 0; i < 6; i++) {
            if (this.planes[i].distanceToPoint(point) < 0) {
                return false;
            }
        }

        return true;
    }
}


export { Frustum };