import { Vector3 } from './Vector3.js';
import { randomFloat, clamp } from './MathUtils.js';

const _vector = new Vector3();

class BoundingBox {
    constructor(min = new Vector3(-Infinity, -Infinity, -Infinity), max = new Vector3(Infinity, Infinity, Infinity)) {
        this.min = min;  // Vector3
        this.max = max;  // Vector3
    }

    get center() {
        return this.min.clone().add(this.max).multiplyScalar(0.5);
    }

    get size() {
        return this.max.clone().sub(this.min);
    }
    
    setFromCenterAndSize(center, size) {
        const halfSize = _vector.copy(size).multiplyScalar(0.5);
        this.min.copy(center).sub(halfSize);
        this.max.copy(center).add(halfSize);
        return this;
    }

    intersects(other) {
        return (this.min.x <= other.max.x && this.max.x >= other.min.x) &&
               (this.min.y <= other.max.y && this.max.y >= other.min.y) &&
               (this.min.z <= other.max.z && this.max.z >= other.min.z);
    }
    
    containsPoint(point) {
        return (point.x >= this.min.x && point.x <= this.max.x) &&
               (point.y >= this.min.y && point.y <= this.max.y) &&
               (point.z >= this.min.z && point.z <= this.max.z);
    }
    
    containsBox(box) {
		return this.min.x <= box.min.x && box.max.x <= this.max.x &&
			this.min.y <= box.min.y && box.max.y <= this.max.y &&
			this.min.z <= box.min.z && box.max.z <= this.max.z;
	}
    
    intersectsBox(box) {
        // using 6 splitting planes to rule out intersections.
        return box.max.x >= this.min.x && box.min.x <= this.max.x &&
        box.max.y >= this.min.y && box.min.y <= this.max.y &&
        box.max.z >= this.min.z && box.min.z <= this.max.z;
    }

    intersectsSphere( sphere ) {

        // Find the point on the AABB closest to the sphere center.
        this.clampPoint( sphere.center, _vector );

        // If that point is inside the sphere, the AABB and sphere intersect.
        return _vector.distanceToSquared( sphere.center ) <= ( sphere.radius * sphere.radius );

    }

    intersectsPlane( plane ) {

        // We compute the minimum and maximum dot product values. If those values
        // are on the same side (back or front) of the plane, then there is no intersection.

        let min, max;

        if ( plane.normal.x > 0 ) {

            min = plane.normal.x * this.min.x;
            max = plane.normal.x * this.max.x;

        } else {

            min = plane.normal.x * this.max.x;
            max = plane.normal.x * this.min.x;

        }

        if ( plane.normal.y > 0 ) {

            min += plane.normal.y * this.min.y;
            max += plane.normal.y * this.max.y;

        } else {

            min += plane.normal.y * this.max.y;
            max += plane.normal.y * this.min.y;

        }

        if ( plane.normal.z > 0 ) {

            min += plane.normal.z * this.min.z;
            max += plane.normal.z * this.max.z;

        } else {

            min += plane.normal.z * this.max.z;
            max += plane.normal.z * this.min.z;

        }

        return ( min <= - plane.constant && max >= - plane.constant );

    }
    
    getSize(out) {
        return out.copy(this.max).sub(this.min);
    }
    
    randomPoint(out) {
        out.set(
            randomFloat(this.min.x, this.max.x),
            randomFloat(this.min.y, this.max.y),
            randomFloat(this.min.z, this.max.z)
        );
        return out;
    }
    
    makeEmpty() {
        this.min.set(+Infinity, +Infinity, +Infinity);
        this.max.set(-Infinity, -Infinity, -Infinity);
        return this;
    }
    
    expandByPoint(point) {
        this.min.min(point);
        this.max.max(point);
        return this;
    }
    
    isEmpty() {
        return this.max.x < this.min.x || this.max.y < this.min.y || this.max.z < this.min.z;
    }
    
    getCenter(v = new Vector3()) {
        return v.addVectors(this.min, this.max).multiplyScalar(0.5);
    }
    
    getSize() {
        return this.isEmpty() ? new Vector3() : this.max.clone().sub(this.min);
    }
    
    
    setFromAttribute(attribute) {
        const array = attribute.array;
        const itemSize = attribute.itemSize;
        const count = array.length / itemSize;
        const min = this.min;
        const max = this.max;
        min.set(+Infinity, +Infinity, +Infinity);
        max.set(-Infinity, -Infinity, -Infinity);
        for (let i = 0; i < count; i++) {
            const x = array[i * itemSize + 0];
            const y = array[i * itemSize + 1];
            const z = array[i * itemSize + 2];
            min.min(x, y, z);
            max.max(x, y, z);
        }
        return this;
    }

}

export { BoundingBox };