import { BufferAttribute } from '@/geometry/BufferAttribute';
import { Vector3 } from './Vector3';

export class BoundingBox {
    public min: Vector3;
    public max: Vector3;

    constructor(min = new Vector3(), max = new Vector3()) {
        this.min = min;
        this.max = max;
    }

    public setFromAttribute(attribute: BufferAttribute) {
        const { data, itemSize } = attribute;
        this.min.set(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
        this.max.set(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);

        for (let i = 0; i < data.length; i += itemSize) {
            const x = data[i];
            const y = data[i + 1];
            const z = data[i + 2];
            this.min.x = Math.min(this.min.x, x);
            this.min.y = Math.min(this.min.y, y);
            this.min.z = Math.min(this.min.z, z);
            this.max.x = Math.max(this.max.x, x);
            this.max.y = Math.max(this.max.y, y);
            this.max.z = Math.max(this.max.z, z);
        }
    }

    public getCenter(out: Vector3 = new Vector3() ): Vector3 {
        return out.addVectors(this.min, this.max).scale(0.5);
    }

    public setFromPoints(points: Float32Array[]): void {
        this.min.set([Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY]);
        this.max.set([Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY]);

        if (!points.length) {
            return;
        }
    

        for (const p of points) {
            const [x, y, z] = p;
            this.min.x = Math.min(this.min.x, x);
            this.min.y = Math.min(this.min.y, y);
            this.min.z = Math.min(this.min.z, z);
            this.max.x = Math.max(this.max.x, x);
            this.max.y = Math.max(this.max.y, y);
            this.max.z = Math.max(this.max.z, z);
        }
    }

    public containsPoint(x: number, y: number, z: number): boolean {
        return (
            x >= this.min.x && x <= this.max.x &&
            y >= this.min.y && y <= this.max.y &&
            z >= this.min.z && z <= this.max.z
        );
    }

    public intersects(box: BoundingBox): boolean {
        return !(
            box.max.x < this.min.x || box.min.x > this.max.x ||
            box.max.y < this.min.y || box.min.y > this.max.y ||
            box.max.z < this.min.z || box.min.z > this.max.z
        );
    }
}
