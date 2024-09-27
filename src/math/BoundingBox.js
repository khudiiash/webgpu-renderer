import { Vector3 } from './Vector3.js';
import { randomFloat, clamp } from './MathUtils.js';

class BoundingBox {
    constructor(min, max) {
        this.min = min;  // Vector3
        this.max = max;  // Vector3
    }

    get center() {
        return this.min.clone().add(this.max).mulScalar(0.5);
    }

    get size() {
        return this.max.clone().sub(this.min);
    }

    intersects(other) {
        return (this.min.x <= other.max.x && this.max.x >= other.min.x) &&
               (this.min.y <= other.max.y && this.max.y >= other.min.y) &&
               (this.min.z <= other.max.z && this.max.z >= other.min.z);
    }
    
    contains(point) {
        return (point.x >= this.min.x && point.x <= this.max.x) &&
               (point.y >= this.min.y && point.y <= this.max.y) &&
               (point.z >= this.min.z && point.z <= this.max.z);
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
}

export { BoundingBox };