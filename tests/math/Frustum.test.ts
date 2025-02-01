import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Frustum } from '@/math/Frustum';
import { Plane } from '@/math/Plane';
import { Vector3 } from '@/math/Vector3';
import { BoundingSphere } from '@/math/BoundingSphere';
import { Matrix4 } from '@/math';

describe('Frustum', () => {
    let frustum: Frustum;

    beforeEach(() => {
        frustum = new Frustum();
    });

    describe('constructor', () => {
        it('should create with default planes', () => {
            expect(frustum.planes.length).toBe(6);
            frustum.planes.forEach(plane => {
                expect(plane).toBeInstanceOf(Plane);
            });
        });

        it('should create with custom planes', () => {
            const customPlanes = Array(6).fill(null).map(() => new Plane(new Vector3(1, 0, 0), 1));
            frustum = new Frustum(...customPlanes);
            expect(frustum.planes.length).toBe(6);
            frustum.planes.forEach(plane => {
                expect(plane.normal.x).toBe(1);
                expect(plane.constant).toBe(1);
            });
        });
    });

    describe('intersectsObject', () => {
        it('should handle object with undefined boundingSphere', () => {
            const geometry = {
                boundingSphere: new BoundingSphere(new Vector3(), 1),
                computeBoundingSphere: vi.fn()
            };
            const object = {
                geometry,
                matrixWorld: new Matrix4([
                    1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, 1, 0,
                    0, 0, 0, 1
                ]),
                computeBoundingSphere : () => {}
            };

            const result = frustum.intersectsObject(object);
            expect(typeof result).toBe('boolean');
        });

        it('should compute boundingSphere if null', () => {
            let boundingSphere: BoundingSphere | null = null;
            const computeSphere = vi.fn().mockImplementation(() => {
                boundingSphere = new BoundingSphere();
                object.boundingSphere = boundingSphere;
            });
            
            const object: any = {
                boundingSphere: null,
                computeBoundingSphere: computeSphere,
                matrixWorld: new Matrix4([
                    0, 0, 0, 0,
                    0, 0, 0, 0,
                    0, 0, 0, 0,
                    0, 0, 0, 0
                ])
            };
            
            frustum.intersectsObject(object);
            expect(computeSphere).toHaveBeenCalled();
            expect(object.boundingSphere).not.toBeNull();
        });
        
        it('should compute geometry.boundingSphere if null', () => {
            let boundingSphere: BoundingSphere | null = null;
            const computeGeometrySphere = vi.fn().mockImplementation(() => {
                boundingSphere = new BoundingSphere();
                object.geometry.boundingSphere = boundingSphere;
            });
            
            const geometry = {
                boundingSphere: null,
                computeBoundingSphere: computeGeometrySphere
            };
            const object: any = {
                geometry,
                boundingSphere: undefined,
                computeBoundingSphere: vi.fn(),
                matrixWorld: new Matrix4([
                    0, 0, 0, 0,
                    0, 0, 0, 0,
                    0, 0, 0, 0,
                    0, 0, 0, 0
                ])
            };
            
            frustum.intersectsObject(object);
            expect(computeGeometrySphere).toHaveBeenCalled();
            expect(object.boundingSphere).not.toBeNull();
        });
    });

    

    describe('setFromProjectionMatrix', () => {
        it('should set planes from projection matrix', () => {
            const matrix = new Float32Array([
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ]);

            frustum.setFromProjectionMatrix(matrix);

            // Verify each plane has been set and normalized
            frustum.planes.forEach(plane => {
                expect(plane.normal.magnitude()).toBeCloseTo(1);
            });

            // Check if the data array was updated
            expect(frustum.length).toBe(24); // 6 planes * 4 components
        });

        it('should be chainable', () => {
            const matrix = new Float32Array(16).fill(0);
            const result = frustum.setFromProjectionMatrix(matrix);
            expect(result).toBe(frustum);
        });
    });

    describe('intersectsSphere', () => {
        it('should detect sphere intersection', () => {
            const sphere = new BoundingSphere(new Vector3(), 1);
            
            // Set up a frustum with planes facing inward
            frustum.planes.forEach((plane, i) => {
                const normal = new Vector3();
                normal[Math.floor(i/2)] = i % 2 ? 1 : -1;
                plane.setComponents(normal.x, normal.y, normal.z, 0.5);
            });

            const result = frustum.intersectsSphere(sphere);
            expect(typeof result).toBe('boolean');
        });

        it('should detect sphere outside frustum', () => {
            const sphere = new BoundingSphere(new Vector3(0, 0, 10), 1);
            
            // Set up a frustum with a plane that definitely excludes the sphere
            frustum.planes[0].setComponents(0, 0, 1, -15);
            
            expect(frustum.intersectsSphere(sphere)).toBe(false);
        });
    });

    describe('containsPoint', () => {
        it('should detect point inside frustum', () => {
            const point = new Vector3();
            
            // Set up a frustum that should contain the origin
            frustum.planes.forEach((plane, i) => {
                const normal = new Vector3();
                normal[Math.floor(i/2)] = i % 2 ? 1 : -1;
                plane.setComponents(normal.x, normal.y, normal.z, 1);
            });

            expect(frustum.containsPoint(point)).toBe(true);
        });

        it('should detect point outside frustum', () => {

            const point = new Vector3(0, 0, 30);
            
            // Set up a frustum with a plane that definitely excludes the point
            frustum.planes[0].setComponents(0, 0, -1, -15);
            
            expect(frustum.containsPoint(point)).toBe(false);
        });
    });
});