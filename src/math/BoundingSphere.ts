import { BoundingBox } from './BoundingBox';
import { Matrix4 } from './Matrix4';
import { Vector3 } from './Vector3';

export class BoundingSphere {
    center: Vector3;
    radius: number;

    constructor(center: Vector3 = new Vector3(), radius: number = 0) {
        this.center = center;
        this.radius = radius;
    }

    set(center: Vector3, radius: number): this {
        this.center.copy(center);
        this.radius = radius;
        return this;
    }

    copy(sphere: BoundingSphere): this {
        if (!sphere) return this;
        this.center.copy(sphere.center);
        this.radius = sphere.radius;
        return this;
    }

    clone(): BoundingSphere {
        return new BoundingSphere(this.center.clone(), this.radius);
    }

    intersectsSphere(sphere: BoundingSphere): boolean {
        const distance = this.center.distanceTo(sphere.center);
        return distance <= (this.radius + sphere.radius);
    }

    intersectsBox(box: BoundingBox): boolean {
        const clamped = Vector3.instance.copy(this.center).clamp(box.min, box.max);
        const distance = clamped.distanceTo(this.center);
        return distance <= this.radius;
    }

    expandByPoint(point: Vector3): this {
        const distance = this.center.distanceTo(point);
        if (distance > this.radius) {
            this.radius = distance;
        }
        return this;
    }

    applyMatrix4(matrix: Matrix4): this {
        this.center.applyMatrix4(matrix);
        this.radius = this.radius * matrix.getMaxScaleOnAxis();
        return this;
    }

    makeEmpty(): this {
        this.center.set([0, 0, 0]);
        this.radius = 0;
        return this;
    }
}
