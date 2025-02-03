import { describe, it, expect, vi } from 'vitest';
import { Color } from '@/math/Color';

describe('Color', () => {
    it('should create a default color', () => {
        const color = new Color();
        expect(color.r).toBe(1);
        expect(color.g).toBe(1);
        expect(color.b).toBe(1);
        expect(color.a).toBe(1);
    });

    it('should create a color from rgba values', () => {
        const color = new Color(0.5, 0.5, 0.5, 0.5);
        expect(color.r).toBe(0.5);
        expect(color.g).toBe(0.5);
        expect(color.b).toBe(0.5);
        expect(color.a).toBe(0.5);
    });

    it('should create a color from hex string', () => {
        const color = new Color('#ff0000');
        expect(color.r).toBeCloseTo(1);
        expect(color.g).toBeCloseTo(0);
        expect(color.b).toBeCloseTo(0);
        expect(color.a).toBeCloseTo(1);
    });

    it('should create a color from hex number', () => {
        const color = new Color(0x00ff00);
        expect(color.r).toBeCloseTo(0);
        expect(color.g).toBeCloseTo(1);
        expect(color.b).toBeCloseTo(0);
        expect(color.a).toBeCloseTo(1);
    });

    it('should set color values', () => {
        const color = new Color();
        color.set([0.2, 0.4, 0.6, 0.8]);
        expect(color.r).toBeCloseTo(0.2);
        expect(color.g).toBeCloseTo(0.4);
        expect(color.b).toBeCloseTo(0.6);
        expect(color.a).toBeCloseTo(0.8);
    });

    it('should copy color values', () => {
        const color1 = new Color(0.1, 0.2, 0.3, 0.4);
        const color2 = new Color();
        color2.copy(color1);
        expect(color2.r).toBeCloseTo(0.1);
        expect(color2.g).toBeCloseTo(0.2);
        expect(color2.b).toBeCloseTo(0.3);
        expect(color2.a).toBeCloseTo(0.4);
    });

    it('should clone color', () => {
        const color1 = new Color(0.1, 0.2, 0.3, 0.4);
        const color2 = color1.clone();
        expect(color2.r).toBeCloseTo(0.1);
        expect(color2.g).toBeCloseTo(0.2);
        expect(color2.b).toBeCloseTo(0.3);
        expect(color2.a).toBeCloseTo(0.4);
    });

    it('should print rgba string', () => {
        const color = new Color(0.1, 0.2, 0.3, 0.4);
        expect(color.printRGBA()).toBe('rgba(0.1, 0.2, 0.3, 0.4)');
    });

    it('should print hex string', () => {
        const color = new Color(1, 0, 0);
        expect(color.printHex()).toBe('#ff0000');
    });

    it('should trigger onChange callback', () => {
        const color = new Color();
        const callback = vi.fn();
        color.onChange(callback);
        color.r = 0.5;
        expect(callback).toHaveBeenCalled();
    });

    it('should set color from hex string', () => {
        const color = new Color();
        color.setHex('#00ff00');
        expect(color.r).toBeCloseTo(0);
        expect(color.g).toBeCloseTo(1);
        expect(color.b).toBeCloseTo(0);
        expect(color.a).toBeCloseTo(1);
    });

    it('should set color from hex number', () => {
        const color = new Color();
        color.setHex(0x0000ff);
        expect(color.r).toBeCloseTo(0);
        expect(color.g).toBeCloseTo(0);
        expect(color.b).toBeCloseTo(1);
        expect(color.a).toBeCloseTo(1);
    });

    it('should throw error for invalid hex string in constructor', () => {
        expect(() => new Color('zzzzzz')).toThrow('Color.fromString: string should start with #');
    });
    
    it('should throw error for invalid hex string in setHex method', () => {
        const color = new Color();
        expect(() => color.setHex('abcdefg')).toThrow('Color.fromString: string should start with #');
    });

    it('should trigger onChange callback when color changes', () => {
        const color = new Color();
        const callback = vi.fn();
        color.onChange(callback);
        color.r = 0.2;
        expect(callback).toHaveBeenCalled();
    });

    it('should set and get color values for r, g, b, and a', () => {
        const color = new Color();
        color.r = 0.3;
        color.g = 0.4;
        color.b = 0.5;
        color.a = 0.6;
        expect(color.r).toBeCloseTo(0.3);
        expect(color.g).toBeCloseTo(0.4);
        expect(color.b).toBeCloseTo(0.5);
        expect(color.a).toBeCloseTo(0.6);
    });
    
    it('should clone an existing Color instance when passed a Color instance', () => {
        const color1 = new Color(0.1, 0.2, 0.3, 0.4);
        const color2 = new Color(color1);  // This should trigger the cloning behavior
        expect(color2.r).toBeCloseTo(0.1);
        expect(color2.g).toBeCloseTo(0.2);
        expect(color2.b).toBeCloseTo(0.3);
        expect(color2.a).toBeCloseTo(0.4);
    });
    
    it('should set r, g, b, a individually', () => {
        const color = new Color();
        color.r = 0.5;
        color.g = 0.6;
        color.b = 0.7;
        color.a = 0.8;
        expect(color.r).toBeCloseTo(0.5);
        expect(color.g).toBeCloseTo(0.6);
        expect(color.b).toBeCloseTo(0.7);
        expect(color.a).toBeCloseTo(0.8);
    });
    
    it('should set color using the set() method', () => {
        const color = new Color();
        color.set([0.2, 0.4, 0.6, 0.8]);
        expect(color.r).toBeCloseTo(0.2);
        expect(color.g).toBeCloseTo(0.4);
        expect(color.b).toBeCloseTo(0.6);
        expect(color.a).toBeCloseTo(0.8);
    });

    it('should handle extreme values correctly in constructor', () => {
        const color = new Color(1000, -5, 10, 2);
        expect(color.r).toBe(1);
        expect(color.g).toBe(0);
        expect(color.b).toBe(1);
        expect(color.a).toBe(1);
        // @ts-ignore
        const color2 = new Color(1, 1, undefined, undefined);
        expect(color2.r).toBe(1);
        expect(color2.g).toBe(1);
        expect(color2.b).toBe(1);
        expect(color2.a).toBe(1);

    });
    
    it('should print RGBA correctly for extreme values', () => {
        const color = new Color(0, 0, 0, 0);
        expect(color.printRGBA()).toBe('rgba(0, 0, 0, 0)');
    });
    
    it('should clean floats for printRGBA', () => {
        const color = new Color(0.1234567, 0.2345678, 0.3456789, 0.4567891);
        // After cleaning, the values should be rounded to 6 decimal places
        expect(color.printRGBA()).toBe('rgba(0.123457, 0.234568, 0.345679, 0.456789)');
    });

    it('should print hex correctly for extreme values', () => {
        const color = new Color(1, 1, 1, 1);
        expect(color.printHex()).toBe('#ffffff');
    });

    it('set() should set hex from string', () => {
        const c = new Color();
        c.set('#ff0000');
        expect(c.toString()).toEqual(new Color(1, 0, 0).toString());
    });

    it('set() should set hex from number', () => {
        const c = new Color();
        c.set(0x00ff00);
        expect(c.toString()).toEqual(new Color(0, 1, 0).toString());
    });

    it('set() should set correct RGB values', () => {
        const c = new Color();
        const r = 255 / 255, g = 0, b = 0;

        c.set(r, g, b);
        expect(c.toString()).toEqual(new Color(r, g, b).toString());
    });

    it('set() should set correct RGBA values', () => {
        const c = new Color();
        const r = 10 / 255, g = 20 / 255, b = 0 / 30, a = 0.5;

        c.set(r, g, b, a);
        expect(c.toString()).toEqual(new Color(r, g, b, a).toString());
    });

    it('set() should handle invalid RGB values', () => {
        const c = new Color();
        const r = 300 / 255, g = -1, b = 255 / 255;  // Invalid RGB values

        c.set(r, g, b);
        expect(c.toString()).toEqual(new Color(1, 0, 1).toString());
    });

    it('set() should handle invalid RGBA values', () => {
        const c = new Color();
        const r = 355 / 255, g = 455 / 255, b = 555 / 255, a = 1.5;  // Invalid alpha value

        c.set(r, g, b, a);
        expect(c.toString()).toEqual(new Color(1, 1, 1, 1).toString());
    });
    
});