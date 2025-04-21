import { BufferData } from '@/data/BufferData';
import { BoundingBox } from './BoundingBox';
import { Matrix4 } from './Matrix4';
import { Vector3 } from './Vector3';
import { Struct } from '@/data/Struct';

export class BoundingSphere extends BufferData {
    center: Vector3;
    radius: number;

    static struct = new Struct("BoundingSphere", {
        center: "vec3f",
        radius: "f32",
    })

    constructor(center: Vector3 = new Vector3(), radius: number = 0) {
        super([center.x, center.y, center.z, radius]);
        this.center = center;
        this.radius = radius;
    }

    set(center: Vector3, radius: number): this {
        this.center.copy(center);
        this.radius = radius;
        super.setSilent([this.center.x, this.center.y, this.center.z, this.radius])
        return this;
    }

    copy(sphere: BoundingSphere): this {
        if (!sphere) return this;
        this.center.copy(sphere.center);
        this.radius = sphere.radius;
        super.setSilent([this.center.x, this.center.y, this.center.z, this.radius])
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
        super.setSilent([this.center.x, this.center.y, this.center.z, this.radius]);
        return this;
    }

    applyMatrix4(matrix: Matrix4): this {
        this.center.applyMatrix4(matrix);
        this.radius = this.radius * matrix.getMaxScaleOnAxis();
        super.setSilent([this.center.x, this.center.y, this.center.z, this.radius]);
        return this;
    }

    makeEmpty(): this {
        this.center.set([0, 0, 0]);
        this.radius = 0;
        super.setSilent([0, 0, 0, 0]);
        return this;
    }
}
