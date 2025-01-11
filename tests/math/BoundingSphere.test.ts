import { describe, it, expect } from 'vitest';
import { BoundingSphere } from '@/math/BoundingSphere';
import { BoundingBox } from '@/math/BoundingBox';
import { Vector3 } from '@/math/Vector3';
import { Matrix4 } from '@/math/Matrix4';

describe('BoundingSphere', () => {
    it('creates with default center and radius', () => {
        const sphere = new BoundingSphere();
        expect(sphere.center.x).toBe(0);
        expect(sphere.center.y).toBe(0);
        expect(sphere.center.z).toBe(0);
        expect(sphere.radius).toBe(0);
    });

    it('sets center and radius', () => {
        const center = new Vector3(1, 2, 3);
        const sphere = new BoundingSphere();
        sphere.set(center, 5);
        expect(sphere.center.x).toBe(1);
        expect(sphere.center.y).toBe(2);
        expect(sphere.center.z).toBe(3);
        expect(sphere.radius).toBe(5);
    });

    it('copies another sphere', () => {
        const sphere1 = new BoundingSphere(new Vector3(1, 2, 3), 5);
        const sphere2 = new BoundingSphere();
        sphere2.copy(sphere1);

        expect(sphere2.center.x).toBe(1);
        expect(sphere2.center.y).toBe(2);
        expect(sphere2.center.z).toBe(3);
        expect(sphere2.radius).toBe(5);
    });

    it('clones itself', () => {
        const sphere1 = new BoundingSphere(new Vector3(1, 2, 3), 5);
        const sphere2 = sphere1.clone();

        expect(sphere2.center.x).toBe(1);
        expect(sphere2.center.y).toBe(2);
        expect(sphere2.center.z).toBe(3);
        expect(sphere2.radius).toBe(5);
        expect(sphere2).not.toBe(sphere1);
    });

    it('checks intersection with another sphere', () => {
        const sphere1 = new BoundingSphere(new Vector3(0, 0, 0), 5);
        const sphere2 = new BoundingSphere(new Vector3(3, 4, 0), 5);
        const sphere3 = new BoundingSphere(new Vector3(10, 10, 10), 1);

        expect(sphere1.intersectsSphere(sphere2)).toBe(true);
        expect(sphere1.intersectsSphere(sphere3)).toBe(false);
    });

    it('checks intersection with a bounding box', () => {
        const sphere = new BoundingSphere(new Vector3(1, 1, 1), 5);
        const box1 = new BoundingBox(new Vector3(0, 0, 0), new Vector3(2, 2, 2));
        const box2 = new BoundingBox(new Vector3(10, 10, 10), new Vector3(20, 20, 20));

        expect(sphere.intersectsBox(box1)).toBe(true);
        expect(sphere.intersectsBox(box2)).toBe(false);
    });

    it('expands to include a point', () => {
        const sphere = new BoundingSphere(new Vector3(0, 0, 0), 1);
        const point = new Vector3(3, 4, 0);

        sphere.expandByPoint(point);
        expect(sphere.radius).toBe(5);
    });

    it('applies a matrix transformation', () => {
        const sphere = new BoundingSphere(new Vector3(1, 1, 1), 2);
        const matrix = new Matrix4().makeScale(new Vector3(2, 3, 4));

        sphere.applyMatrix4(matrix);
        expect(sphere.center.x).toBe(2);
        expect(sphere.center.y).toBe(3);
        expect(sphere.center.z).toBe(4);
        expect(sphere.radius).toBe(8);
    });

    it('makes the sphere empty', () => {
        const sphere = new BoundingSphere(new Vector3(1, 1, 1), 5);
        sphere.makeEmpty();

        expect(sphere.center.x).toBe(0);
        expect(sphere.center.y).toBe(0);
        expect(sphere.center.z).toBe(0);
        expect(sphere.radius).toBe(0);
    });
});