import { describe, it, expect, beforeEach } from 'vitest';
import { Plane } from '@/math/Plane';
import { Vector3 } from '@/math/Vector3';

describe('Plane', () => {
    let plane: Plane;
    
    beforeEach(() => {
        plane = new Plane();
    });

    describe('constructor', () => {
        it('should create with default values', () => {
            expect(plane.normal.x).toBeCloseTo(0);
            expect(plane.normal.y).toBeCloseTo(0);
            expect(plane.normal.z).toBeCloseTo(0);
            expect(plane.constant).toBeCloseTo(0);
            expect(plane.data instanceof Float32Array).toBe(true);
            expect(plane.data.length).toBe(4);
            expect(Array.from(plane.data)).toEqual([0, 0, 0, 0]);
        });

        it('should create with custom normal and constant', () => {
            const normal = new Vector3(1, 2, 3);
            const constant = 5;
            plane = new Plane(normal, constant);

            expect(plane.normal).toBe(normal);
            expect(plane.constant).toBeCloseTo(constant);
            expect(Array.from(plane.data)).toEqual([1, 2, 3, 5]);
        });
    });

    describe('setComponents', () => {
        it('should set components correctly', () => {
            plane.setComponents(1, 2, 3, 4);

            expect(plane.normal.x).toBeCloseTo(1);
            expect(plane.normal.y).toBeCloseTo(2);
            expect(plane.normal.z).toBeCloseTo(3);
            expect(plane.constant).toBeCloseTo(4);
            expect(Array.from(plane.data)).toEqual([1, 2, 3, 4]);
        });

        it('should handle zero components', () => {
            plane.setComponents(0, 0, 0, 0);

            expect(plane.normal.x).toBeCloseTo(0);
            expect(plane.normal.y).toBeCloseTo(0);
            expect(plane.normal.z).toBeCloseTo(0);
            expect(plane.constant).toBeCloseTo(0);
            expect(Array.from(plane.data)).toEqual([0, 0, 0, 0]);
        });

        it('should be chainable', () => {
            const result = plane.setComponents(1, 2, 3, 4);
            expect(result).toBe(plane);
        });
    });

    describe('normalize', () => {
        it('should normalize plane correctly', () => {
            plane.setComponents(3, 4, 0, 10);
            plane.normalize();

            const expectedLength = Math.sqrt(3 * 3 + 4 * 4);
            const expectedNormalX = 3 / expectedLength;
            const expectedNormalY = 4 / expectedLength;
            const expectedConstant = 10 / expectedLength;

            expect(plane.normal.x).toBeCloseTo(expectedNormalX);
            expect(plane.normal.y).toBeCloseTo(expectedNormalY);
            expect(plane.normal.z).toBeCloseTo(0);
            expect(plane.constant).toBeCloseTo(expectedConstant);

            // Check data array is updated
            expect(plane.data[0]).toBeCloseTo(expectedNormalX);
            expect(plane.data[1]).toBeCloseTo(expectedNormalY);
            expect(plane.data[2]).toBeCloseTo(0);
            expect(plane.data[3]).toBeCloseTo(expectedConstant);

            // Check normal length is 1
            expect(plane.normal.magnitude()).toBeCloseTo(1);
        });

        it('should be chainable', () => {
            plane.setComponents(1, 0, 0, 5);
            const result = plane.normalize();
            expect(result).toBe(plane);
        });
    });

    describe('distanceToPoint', () => {
        it('should calculate correct distance to point', () => {
            // Create a plane with normal (0,1,0) and constant 5
            // This creates a horizontal plane 5 units up from origin
            plane.setComponents(0, 1, 0, 5);
            plane.normalize();

            // Test points
            const point1 = new Vector3(0, 10, 0);  // 5 units above plane
            const point2 = new Vector3(0, 0, 0);   // 5 units below plane
            const point3 = new Vector3(0, 5, 0);   // On plane
            const point4 = new Vector3(10, 5, 10); // On plane but away from origin

            expect(plane.distanceToPoint(point1)).toBeCloseTo(15);
            expect(plane.distanceToPoint(point2)).toBeCloseTo(5);
            expect(plane.distanceToPoint(point3)).toBeCloseTo(10);
            expect(plane.distanceToPoint(point4)).toBeCloseTo(10);
        });

        it('should handle points with normalized and non-normalized plane', () => {
            // Non-normalized plane
            plane.setComponents(0, 2, 0, 10);
            const point = new Vector3(0, 5, 0);
            const distanceNonNorm = plane.distanceToPoint(point);

            // Normalize the plane
            plane.normalize();
            const distanceNorm = plane.distanceToPoint(point);

            // Distances should be proportional to the normalization
            expect(distanceNonNorm).toBeCloseTo(distanceNorm * 2);
        });
    });
});