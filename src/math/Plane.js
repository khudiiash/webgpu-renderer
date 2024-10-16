import { Vector3 } from './Vector3.js';

class Plane {
    constructor(normal = new Vector3(), constant = 0) {
        this.normal = normal;
        this.constant = constant;
    }

    setComponents(x, y, z, w) {
        this.normal.set(x, y, z);
        this.constant = w;
        return this;
    }

    normalize() {
        const inverseNormalLength = 1.0 / this.normal.length();
        this.normal.multiplyScalar(inverseNormalLength);
        this.constant *= inverseNormalLength;
        return this;
    }

    distanceToPoint(point) {
        return this.normal.dot(point) + this.constant;
    }
}

export { Plane };