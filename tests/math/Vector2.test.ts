import { describe, it, expect, beforeEach } from 'vitest';
import { Vector2 } from '@/math/Vector2';
import { BufferData } from '@/data';

describe('Vector2', () => {
    it('creates with default values', () => {
        const v = new Vector2();
        expect(v.x).toBe(0);
        expect(v.y).toBe(0);
        expect(v.isVector2).toBe(true);
        expect(v.length).toBe(2);
    });

    it('creates with custom values', () => {
        const v = new Vector2(1, 2);
        expect(v.x).toBe(1);
        expect(v.y).toBe(2);
    });

    it('sets and gets values through properties', () => {
        const v = new Vector2();
        v.x = 1;
        v.y = 2;
        expect(v.x).toBe(1);
        expect(v.y).toBe(2);
    });

    it('adds vectors', () => {
        const v1 = new Vector2(1, 2);
        const v2 = new Vector2(2, 3);
        v1.add(v2);
        expect(v1.x).toBe(3);
        expect(v1.y).toBe(5);
    });

    it('subtracts vectors', () => {
        const v1 = new Vector2(3, 4);
        const v2 = new Vector2(1, 1);
        v1.sub(v2);
        expect(v1.x).toBe(2);
        expect(v1.y).toBe(3);
    });

    it('multiplies vectors', () => {
        const v1 = new Vector2(2, 3);
        const v2 = new Vector2(2, 2);
        v1.multiply(v2);
        expect(v1.x).toBe(4);
        expect(v1.y).toBe(6);
    });

    it('divides vectors', () => {
        const v1 = new Vector2(4, 6);
        const v2 = new Vector2(2, 2);
        v1.divide(v2);
        expect(v1.x).toBe(2);
        expect(v1.y).toBe(3);
    });

    it('calculates dot product', () => {
        const v1 = new Vector2(1, 2);
        const v2 = new Vector2(2, 3);
        const dot = v1.dot(v2);
        expect(dot).toBe(8); // 1*2 + 2*3
    });

    it('calculates magnitude', () => {
        const v = new Vector2(3, 4);
        expect(v.magnitude()).toBe(5); // sqrt(3^2 + 4^2) = 5
    });

    it('clones vector', () => {
        const v1 = new Vector2(1, 2);
        const v2 = v1.clone();
        expect(v2.x).toBe(1);
        expect(v2.y).toBe(2);
        expect(v2).not.toBe(v1); // Different instances
    });

    it('copies vector', () => {
        const v1 = new Vector2(1, 2);
        const v2 = new Vector2();
        v2.copy(v1);
        expect(v2.x).toBe(1);
        expect(v2.y).toBe(2);
    });

    it('checks equality', () => {
        const v1 = new Vector2(1, 2);
        const v2 = new Vector2(1, 2);
        const v3 = new Vector2(1, 3);
        expect(v1.equals(v2)).toBe(true);
        expect(v1.equals(v3)).toBe(false);
    });

    it('sets from array', () => {
        const v = new Vector2();
        const array = new BufferData([5, 6]);
        v.set(array, 0);
        expect(v.x).toBe(5);
        expect(v.y).toBe(6);
    });

    it('sets individual components', () => {
        const v = new Vector2();
        v.setX(5);
        v.setY(6);
        expect(v.x).toBe(5);
        expect(v.y).toBe(6);
    });

    it('converts to array with offset', () => {
        const v = new Vector2(1, 2);
        const array: number[] = [];
        v.toArray(array, 1);
        expect(array).toEqual([undefined, 1, 2]);
    });

    it('converts to array with default parameters', () => {
        const v = new Vector2(1, 2);
        const array = v.toArray();
        expect(array).toEqual([1, 2]);
    });

    it('handles array conversion with existing array', () => {
        const v = new Vector2(1, 2);
        const existingArray = [9, 9, 9];
        v.toArray(existingArray, 1);
        expect(existingArray).toEqual([9, 1, 2]);
    });

    describe('Vector2 methods', () => {
        let v: Vector2;
    
        beforeEach(() => {
            v = new Vector2();
        });
    
        describe('setXY', () => {
            it('should set x and y components', () => {
                v.setXY(2, 3);
                expect(v[0]).toBeCloseTo(2);
                expect(v[1]).toBeCloseTo(3);
            });
    
            it('should handle zero values', () => {
                v.setXY(0, 0);
                expect(v[0]).toBeCloseTo(0);
                expect(v[1]).toBeCloseTo(0);
            });
    
            it('should handle negative values', () => {
                v.setXY(-2, -3);
                expect(v[0]).toBeCloseTo(-2);
                expect(v[1]).toBeCloseTo(-3);
            });
    
            it('should be chainable', () => {
                const result = v.setXY(1, 1);
                expect(result).toBe(v);
            });
        });
    
        describe('scale', () => {

            beforeEach(() => {
                v.setXY(2, 3);  // Set initial values
            });
    
            it('should scale by Vector2', () => {
                const scaleVec = new Vector2(2, 3);
                v.scale(scaleVec);
                expect(v[0]).toBeCloseTo(4);  // 2 * 2
                expect(v[1]).toBeCloseTo(9);  // 3 * 3
            });
    
            it('should scale by single number', () => {
                v.scale(2);
                expect(v[0]).toBeCloseTo(4);  // 2 * 2
                expect(v[1]).toBeCloseTo(6);  // 3 * 2
            });
    
            it('should scale by separate x and y values', () => {
                v.scale(2, 3);
                expect(v[0]).toBeCloseTo(4);  // 2 * 2
                expect(v[1]).toBeCloseTo(9);  // 3 * 3
            });
    
            it('should handle zero scaling', () => {
                v.scale(0);
                expect(v[0]).toBeCloseTo(0);
                expect(v[1]).toBeCloseTo(0);
            });
    
            it('should handle negative scaling', () => {
                v.scale(-2);
                expect(v[0]).toBeCloseTo(-4);
                expect(v[1]).toBeCloseTo(-6);
            });
    
            it('should be chainable', () => {
                const result = v.scale(2);
                expect(result).toBe(v);
            });
        });
    
        describe('subVectors', () => {
            it('should subtract two vectors', () => {
                const a = new Vector2(3, 4);
                const b = new Vector2(1, 2);
                v.subVectors(a, b);
                expect(v[0]).toBeCloseTo(2);  // 3 - 1
                expect(v[1]).toBeCloseTo(2);  // 4 - 2
            });
    
            it('should handle zero subtraction', () => {
                const a = new Vector2(1, 1);
                const b = new Vector2(1, 1);
                v.subVectors(a, b);
                expect(v[0]).toBeCloseTo(0);
                expect(v[1]).toBeCloseTo(0);
            });
    
            it('should handle negative results', () => {
                const a = new Vector2(1, 1);
                const b = new Vector2(2, 3);
                v.subVectors(a, b);
                expect(v[0]).toBeCloseTo(-1);
                expect(v[1]).toBeCloseTo(-2);
            });
    
            it('should be chainable', () => {
                const a = new Vector2();
                const b = new Vector2();
                const result = v.subVectors(a, b);
                expect(result).toBe(v);
            });
        });
    });

    describe('Vector2 addVectors', () => {
        let v: Vector2;
    
        beforeEach(() => {
            v = new Vector2();
        });
    
        it('should add two vectors with positive components', () => {
            const a = new Vector2(3, 4);
            const b = new Vector2(1, 2);
            v.addVectors(a, b);
            expect(v[0]).toBeCloseTo(4);  // 3 + 1
            expect(v[1]).toBeCloseTo(6);  // 4 + 2
        });
    
        it('should add vectors with negative components', () => {
            const a = new Vector2(-1, -2);
            const b = new Vector2(-3, -4);
            v.addVectors(a, b);
            expect(v[0]).toBeCloseTo(-4);  // -1 + -3
            expect(v[1]).toBeCloseTo(-6);  // -2 + -4
        });
    
        it('should handle zero vector addition', () => {
            const a = new Vector2(0, 0);
            const b = new Vector2(0, 0);
            v.addVectors(a, b);
            expect(v[0]).toBeCloseTo(0);
            expect(v[1]).toBeCloseTo(0);
        });
    
        it('should handle mixed positive and negative components', () => {
            const a = new Vector2(1, -2);
            const b = new Vector2(-3, 4);
            v.addVectors(a, b);
            expect(v[0]).toBeCloseTo(-2);  // 1 + -3
            expect(v[1]).toBeCloseTo(2);   // -2 + 4
        });
    
        it('should be chainable', () => {
            const a = new Vector2();
            const b = new Vector2();
            const result = v.addVectors(a, b);
            expect(result).toBe(v);
        });
    });
    
});