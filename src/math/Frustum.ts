import { Plane, BoundingSphere, Vector3 } from '.';
import { BufferData } from '@/data';

const _sphere = new BoundingSphere();

class Frustum extends BufferData {
    planes: Plane[];

    constructor(p0 = new Plane(), p1 = new Plane(), p2 = new Plane(), p3 = new Plane(), p4 = new Plane(), p5 = new Plane()) {
        super(6 * 4);
        this.planes = [p0, p1, p2, p3, p4, p5];
    }

    intersectsObject(object: { boundingSphere?: BoundingSphere | null, computeBoundingSphere: () => void, matrixWorld: any, geometry: { boundingSphere: BoundingSphere | null, computeBoundingSphere: () => void } }): boolean {
        if (object.boundingSphere !== undefined) {
            if (object.boundingSphere === null) object.computeBoundingSphere();
            _sphere.copy(object.boundingSphere as BoundingSphere).applyMatrix4(object.matrixWorld);
        } else {
            const geometry = object.geometry;
            if (geometry.boundingSphere === null) geometry.computeBoundingSphere();
            _sphere.copy(geometry.boundingSphere as BoundingSphere).applyMatrix4(object.matrixWorld);
        }

        return this.intersectsSphere(_sphere);
    }

    setFromProjectionMatrix(m: Float32Array): this {
        const planes = this.planes;
        const me = m;
        const me0 = me[0], me1 = me[1], me2 = me[2], me3 = me[3];
        const me4 = me[4], me5 = me[5], me6 = me[6], me7 = me[7];
        const me8 = me[8], me9 = me[9], me10 = me[10], me11 = me[11];
        const me12 = me[12], me13 = me[13], me14 = me[14], me15 = me[15];

        planes[0].setComponents(me3 - me0, me7 - me4, me11 - me8, me15 - me12).normalize();
        planes[1].setComponents(me3 + me0, me7 + me4, me11 + me8, me15 + me12).normalize();
        planes[2].setComponents(me3 + me1, me7 + me5, me11 + me9, me15 + me13).normalize();
        planes[3].setComponents(me3 - me1, me7 - me5, me11 - me9, me15 - me13).normalize();
        planes[4].setComponents(me3 - me2, me7 - me6, me11 - me10, me15 - me14).normalize();
        planes[5].setComponents(me2, me6, me10, me14).normalize();

        for (let i = 0; i < 6; i++) {
            const plane = planes[i];
            this.set(plane.data, i * 4);
        }

        return this;
    }

    intersectsSphere(sphere: BoundingSphere): boolean {
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

    containsPoint(point: Vector3): boolean {
        for (let i = 0; i < 6; i++) {
            if (this.planes[i].distanceToPoint(point) < 0) {
                return false;
            }
        }

        return true;
    }
}

export { Frustum };