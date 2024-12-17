import { Color } from '../../math/Color';
import { jest } from '@jest/globals';

describe('Color', () => {
    test('should create a default color', () => {
        const color = new Color();
        expect(color.r).toBe(1);
        expect(color.g).toBe(1);
        expect(color.b).toBe(1);
        expect(color.a).toBe(1);
    });

    test('should create a color from rgba values', () => {
        const color = new Color(0.5, 0.5, 0.5, 0.5);
        expect(color.r).toBe(0.5);
        expect(color.g).toBe(0.5);
        expect(color.b).toBe(0.5);
        expect(color.a).toBe(0.5);
    });

    test('should create a color from hex string', () => {
        const color = new Color('#ff0000');
        expect(color.r).toBeCloseTo(1);
        expect(color.g).toBeCloseTo(0);
        expect(color.b).toBeCloseTo(0);
        expect(color.a).toBeCloseTo(1);
    });

    test('should create a color from hex number', () => {
        const color = new Color(0x00ff00);
        expect(color.r).toBeCloseTo(0);
        expect(color.g).toBeCloseTo(1);
        expect(color.b).toBeCloseTo(0);
        expect(color.a).toBeCloseTo(1);
    });

    test('should set color values', () => {
        const color = new Color();
        color.set(0.2, 0.4, 0.6, 0.8);
        expect(color.r).toBe(0.2);
        expect(color.g).toBe(0.4);
        expect(color.b).toBe(0.6);
        expect(color.a).toBe(0.8);
    });

    test('should copy color values', () => {
        const color1 = new Color(0.1, 0.2, 0.3, 0.4);
        const color2 = new Color();
        color2.copy(color1);
        expect(color2.r).toBe(0.1);
        expect(color2.g).toBe(0.2);
        expect(color2.b).toBe(0.3);
        expect(color2.a).toBe(0.4);
    });

    test('should clone color', () => {
        const color1 = new Color(0.1, 0.2, 0.3, 0.4);
        const color2 = color1.clone();
        expect(color2.r).toBe(0.1);
        expect(color2.g).toBe(0.2);
        expect(color2.b).toBe(0.3);
        expect(color2.a).toBe(0.4);
    });

    test('should print rgba string', () => {
        const color = new Color(0.1, 0.2, 0.3, 0.4);
        expect(color.printRGBA()).toBe('rgba(0.1, 0.2, 0.3, 0.4)');
    });

    test('should print hex string', () => {
        const color = new Color(1, 0, 0);
        expect(color.printHex()).toBe('#ff0000');
    });

    test('should trigger onChange callback', () => {
        const color = new Color();
        const callback = jest.fn();
        color.onChange(callback);
        color.r = 0.5;
        expect(callback).toHaveBeenCalled();
    });
});