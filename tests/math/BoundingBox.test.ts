import { describe, it, expect } from 'vitest';
import { BoundingBox } from '@/math/BoundingBox';
import { BufferAttribute } from '@/geometry/BufferAttribute';
import { Vector3 } from '@/math/Vector3';

describe('BoundingBox', () => {
    it('creates with default min and max values', () => {
        const box = new BoundingBox();
        expect(box.min.x).toBe(0);
        expect(box.min.y).toBe(0);
        expect(box.min.z).toBe(0);
        expect(box.max.x).toBe(0);
        expect(box.max.y).toBe(0);
        expect(box.max.z).toBe(0);
    });

    it('sets from BufferAttribute', () => {
        const data = new Float32Array([
            -1, -1, -1,
            1, 1, 1,
            -2, 0, 2
        ]);
        const attribute = new BufferAttribute(data, 3);
        const box = new BoundingBox();

        box.setFromAttribute(attribute);
        expect(box.min.x).toBe(-2);
        expect(box.min.y).toBe(-1);
        expect(box.min.z).toBe(-1);
        expect(box.max.x).toBe(1);
        expect(box.max.y).toBe(1);
        expect(box.max.z).toBe(2);
    });

    it('gets center point', () => {
        const box = new BoundingBox(
            new Vector3(-2, -2, -2),
            new Vector3(2, 2, 2)
        );
        const center = box.getCenter();
        expect(center.x).toBe(0);
        expect(center.y).toBe(0);
        expect(center.z).toBe(0);
    });

    it('sets from points', () => {
        const points = [
            new Float32Array([-1, -1, -1]),
            new Float32Array([1, 1, 1]),
            new Float32Array([-2, 0, 2])
        ];
        const box = new BoundingBox();

        box.setFromPoints(points);
        expect(box.min.x).toBe(-2);
        expect(box.min.y).toBe(-1);
        expect(box.min.z).toBe(-1);
        expect(box.max.x).toBe(1);
        expect(box.max.y).toBe(1);
        expect(box.max.z).toBe(2);
    });

    it('checks if it contains a point', () => {
        const box = new BoundingBox(
            new Vector3(-1, -1, -1),
            new Vector3(1, 1, 1)
        );

        expect(box.containsPoint(0, 0, 0)).toBe(true);
        expect(box.containsPoint(-1, -1, -1)).toBe(true);
        expect(box.containsPoint(1, 1, 1)).toBe(true);
        expect(box.containsPoint(2, 2, 2)).toBe(false);
    });

    it('checks intersection with another BoundingBox', () => {
        const box1 = new BoundingBox(
            new Vector3(-1, -1, -1),
            new Vector3(1, 1, 1)
        );
        const box2 = new BoundingBox(
            new Vector3(0, 0, 0),
            new Vector3(2, 2, 2)
        );
        const box3 = new BoundingBox(
            new Vector3(2, 2, 2),
            new Vector3(3, 3, 3)
        );

        expect(box1.intersects(box2)).toBe(true);
        expect(box1.intersects(box3)).toBe(false);
    });

    it('handles empty points for setFromPoints', () => {
        const box = new BoundingBox();
        box.setFromPoints([]);

        expect(box.min.x).toBe(Number.POSITIVE_INFINITY);
        expect(box.min.y).toBe(Number.POSITIVE_INFINITY);
        expect(box.min.z).toBe(Number.POSITIVE_INFINITY);
        expect(box.max.x).toBe(Number.NEGATIVE_INFINITY);
        expect(box.max.y).toBe(Number.NEGATIVE_INFINITY);
        expect(box.max.z).toBe(Number.NEGATIVE_INFINITY);
    });
});