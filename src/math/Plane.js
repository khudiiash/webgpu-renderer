import { Vector3 } from './Vector3.js';

class Plane {
    constructor(normal = new Vector3(), constant = 0) {
        this.normal = normal;
        this.constant = constant;
        this.data = new Float32Array([normal.x, normal.y, normal.z, constant]);
    }

    setComponents(x, y, z, w) {
        this.normal.set(x, y, z);
        this.constant = w;
        this.data.set([x, y, z, w]);
        return this;
    }

    normalize() {
        const inverseNormalLength = 1.0 / this.normal.length();
        this.normal.multiplyScalar(inverseNormalLength);
        this.constant *= inverseNormalLength;
        this.data.set(this.normal.data, 0);
        return this;
    }

    distanceToPoint(point) {
        return this.normal.dot(point) + this.constant;
    }
}

export { Plane };