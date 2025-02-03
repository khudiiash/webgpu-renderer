import { describe, it, expect } from 'vitest';
import { Camera } from '@/camera/Camera';

describe('Camera', () => {
    it('should have default properties set', () => {
        const cam = new Camera();
        expect(cam.name).toBe('Camera');
        expect(cam.matrixWorldInverse.isMatrix4).toBe(true);
        expect(cam.projectionMatrix.isMatrix4).toBe(true);
    });

    it('should set position correctly', () => {
        const cam = new Camera();
        cam.setPosition(1, 2, 3);
        expect(cam.position.x).toBe(1);
        expect(cam.position.y).toBe(2);
        expect(cam.position.z).toBe(3);
    });

    it('should update frustum', () => {
        const cam = new Camera();
        cam.updateFrustum();
        expect(cam.frustum.planes.length).toBe(6);
    });

    it('should update aspect ratio and projection matrix', () => {
        const cam = new Camera();
        cam._onResize({ aspect: 2 });
        expect(cam.aspect).toBe(2);
    });

    it('clone should create a copy with same properties', () => {
        const cam = new Camera();
        cam.setPosition(4, 5, 6);
        const clonedCam = cam.clone() as Camera;
        expect(clonedCam.position.x).toBe(4);
        expect(clonedCam.position.y).toBe(5);
        expect(clonedCam.position.z).toBe(6);
    });
});