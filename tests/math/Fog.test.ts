import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Fog } from '@/math/Fog';
import { Color } from '@/math/Color';

describe('Fog', () => {
    let fog: Fog;

    beforeEach(() => {
        fog = new Fog();
    });

    describe('constructor', () => {
        it('should create with default values', () => {
            expect(fog.type).toBe(Fog.LINEAR);
            expect(fog.density).toBeCloseTo(0.00025);
            expect(fog.start).toBe(10);
            expect(fog.end).toBe(100);
            // Default white color (1,1,1,1)
            expect(fog.color.r).toBeCloseTo(1);
            expect(fog.color.g).toBeCloseTo(1);
            expect(fog.color.b).toBeCloseTo(1);
            expect(fog.color.a).toBeCloseTo(1);
        });

        it('should create with custom config', () => {
            fog = new Fog({
                color: new Color(1, 0, 0, 1), // Red
                type: Fog.EXPONENTIAL,
                density: 0.5,
                start: 20,
                end: 200
            });

            expect(fog.type).toBe(Fog.EXPONENTIAL);
            expect(fog.density).toBeCloseTo(0.5);
            expect(fog.start).toBe(20);
            expect(fog.end).toBe(200);
            expect(fog.color.r).toBeCloseTo(1);
            expect(fog.color.g).toBeCloseTo(0);
            expect(fog.color.b).toBeCloseTo(0);
            expect(fog.color.a).toBeCloseTo(1);
        });

        it('should create with partial config', () => {
            fog = new Fog({
                color: new Color(0, 1, 0, 1), // Green
                type: Fog.EXPONENTIAL_SQUARED
            });

            expect(fog.type).toBe(Fog.EXPONENTIAL_SQUARED);
            expect(fog.density).toBeCloseTo(0.00025);
            expect(fog.start).toBe(10);
            expect(fog.end).toBe(100);
            expect(fog.color.r).toBeCloseTo(0);
            expect(fog.color.g).toBeCloseTo(1);
            expect(fog.color.b).toBeCloseTo(0);
            expect(fog.color.a).toBeCloseTo(1);
        });
    });

    it('should handle default values with empty config', () => {
        const fog = new Fog();
        expect(fog[5]).toBe(10);  // start
        expect(fog[6]).toBe(100); // end
        expect(fog[7]).toBeCloseTo(0.00025); // density
    });

    it('should handle partial config with only color', () => {
        const fog = new Fog({ color: new Color(1, 0, 0, 1) });
        expect(fog[5]).toBe(10);  // start (default)
        expect(fog[6]).toBe(100); // end (default)
        expect(fog[7]).toBeCloseTo(0.00025); // density (default)
    });

    it('should handle partial config with only type', () => {
        const fog = new Fog({ type: Fog.EXPONENTIAL });
        expect(fog[5]).toBe(10);  // start (default)
        expect(fog[6]).toBe(100); // end (default)
        expect(fog[7]).toBeCloseTo(0.00025); // density (default)
    });

    it('should override start value', () => {
        const fog = new Fog({ start: 300 });
        expect(fog[5]).toBe(300);  // start (overridden)
        expect(fog[6]).toBe(100); // end (default)
        expect(fog[7]).toBeCloseTo(0.00025); // density (default)
    });

    it('should override end value', () => {
        const fog = new Fog({ end: 2000 });
        expect(fog[5]).toBe(10);  // start (default)
        expect(fog[6]).toBe(2000); // end (overridden)
        expect(fog[7]).toBeCloseTo(0.00025); // density (default)
    });

    it('should override density value', () => {
        const fog = new Fog({ density: 0.5 });
        expect(fog[5]).toBe(10);  // start (default)
        expect(fog[6]).toBe(100); // end (default)
        expect(fog[7]).toBeCloseTo(0.5); // density (overridden)
    });

    it('should override all distance and density values', () => {
        const fog = new Fog({
            start: 100,
            end: 3000,
            density: 0.75
        });
        expect(fog[5]).toBe(100);  // start (overridden)
        expect(fog[6]).toBe(3000); // end (overridden)
        expect(fog[7]).toBeCloseTo(0.75); // density (overridden)
    });

    it('should override values with zero', () => {
        const fog = new Fog({
            start: 0,
            end: 0,
            density: 0
        });
        expect(fog[5]).toBe(500);  // start can be zero
        expect(fog[6]).toBe(1000);  // end can be zero
        expect(fog[7]).toBeCloseTo(0); // density can be zero
    });

    describe('getters and setters', () => {
        it('should get and set type', () => {
            fog.type = Fog.EXPONENTIAL;
            expect(fog.type).toBe(Fog.EXPONENTIAL);
            fog.type = Fog.EXPONENTIAL_SQUARED;
            expect(fog.type).toBe(Fog.EXPONENTIAL_SQUARED);
        });

        it('should get and set start', () => {
            fog.start = 50;
            expect(fog.start).toBe(50);
        });

        it('should get and set end', () => {
            fog.end = 150;
            expect(fog.end).toBe(150);
        });

        it('should get and set density', () => {
            fog.density = 0.1;
            expect(fog.density).toBeCloseTo(0.1);
        });

        it('should get and set color', () => {
            const newColor = new Color(0, 0, 1, 1); // Blue
            fog.color = newColor;
            expect(fog.color).toBe(newColor);
            expect(fog[0]).toBeCloseTo(newColor.r);
            expect(fog[1]).toBeCloseTo(newColor.g);
            expect(fog[2]).toBeCloseTo(newColor.b);
            expect(fog[3]).toBeCloseTo(newColor.a);
        });

        it('should update buffer when color components change', () => {
            fog.color.r = 1;
            fog.color.g = 0;
            fog.color.b = 0;
            fog.color.a = 1;
            expect(fog[0]).toBeCloseTo(1);
            expect(fog[1]).toBeCloseTo(0);
            expect(fog[2]).toBeCloseTo(0);
            expect(fog[3]).toBeCloseTo(1);
        });
    });

    describe('static properties', () => {
        it('should have correct fog types', () => {
            expect(Fog.LINEAR).toBe(0);
            expect(Fog.EXPONENTIAL).toBe(1);
            expect(Fog.EXPONENTIAL_SQUARED).toBe(2);
        });

    });
});

describe('Fog color setter', () => {
    let fog: Fog;
    let spyOffChange: any;
    let spyOnChange: any;
    let spySet: any;

    beforeEach(() => {
        fog = new Fog();
        // Spy on the offChange method of the current color
        spyOffChange = vi.spyOn(fog.color, 'offChange');
        // Spy on the onChange method of Color prototype
        spyOnChange = vi.spyOn(Color.prototype, 'onChange');
        // Spy on the set method of Fog
        spySet = vi.spyOn(fog, 'set');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should properly handle color change subscription', () => {
        const newColor = new Color(1, 0, 0, 1);
        fog.color = newColor;

        // Should have called offChange on the old color
        expect(spyOffChange).toHaveBeenCalledTimes(1);
        
        // Should have set up new onChange handler
        expect(spyOnChange).toHaveBeenCalledTimes(1);

        // Should have set the initial color values
        expect(spySet).toHaveBeenCalledWith([1, 0, 0, 1]);
        
        // Clear the previous set calls
        spySet.mockClear();

        // Modify the new color and verify the onChange handler works
        newColor.r = 0.5;
        expect(spySet).toHaveBeenCalledWith([0.5, 0, 0, 1]);
    });

    it('should update buffer when old color is replaced', () => {
        const oldColor = fog.color;
        const newColor = new Color(1, 0, 0, 1);
        
        // Set new color
        fog.color = newColor;
        
        // Verify old color's onChange was removed
        oldColor.r = 0.5;  // This should not trigger a buffer update
        expect(spySet).toHaveBeenCalledTimes(1);  // Only from the initial set
        
        // Clear mock
        spySet.mockClear();
        
        // Verify new color's onChange works
        newColor.r = 0.699999988079071;
        expect(spySet).toHaveBeenCalledWith([0.699999988079071, 0, 0, 1]);
    });

    it('should maintain onChange subscription through multiple color changes', () => {
        const color1 = new Color(1, 0, 0, 1);
        const color2 = new Color(0, 1, 0, 1);
        
        // First color change
        fog.color = color1;
        spySet.mockClear();
        
        // Modify first color
        color1.r = 0.5;
        expect(spySet).toHaveBeenCalledWith([0.5, 0, 0, 1]);
        
        // Second color change
        fog.color = color2;
        spySet.mockClear();
        
        // Modify first color again - should not trigger update
        color1.r = 0.8;
        expect(spySet).not.toHaveBeenCalled();
        
        // Modify second color - should trigger update
        color2.g = 0.5;
        expect(spySet).toHaveBeenCalledWith([0, 0.5, 0, 1]);
    });
});