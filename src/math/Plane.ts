import { Vector3 } from './Vector3.js';

export class Plane {
    normal: Vector3;
    constant: number;
    data: Float32Array;

    constructor(normal: Vector3 = new Vector3(), constant: number = 0) {
        this.normal = normal;
        this.constant = constant;
        this.data = new Float32Array([normal.x, normal.y, normal.z, constant]);
    }

    setComponents(x: number, y: number, z: number, w: number): this {
        this.normal.set([x, y, z]);
        this.constant = w;
        this.data.set([x, y, z, w]);
        return this;
    }

    normalize(): this {
        const inverseNormalLength = 1.0 / this.normal.magnitude();
        this.normal.scale(inverseNormalLength);
        this.constant *= inverseNormalLength;
        this.data.set([this.normal.x, this.normal.y, this.normal.z, this.constant]);
        return this;
    }

    distanceToPoint(point: Vector3): number {
        return this.normal.dot(point) + this.constant;
    }
}