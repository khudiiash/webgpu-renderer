import { Vector3 } from '@/math/Vector3.js';
import { Camera } from '../Camera';

interface MoveState {
    up: number;
    down: number;
    left: number;
    right: number;
    forward: number;
    back: number;
}

export class FirstPersonControls {
    private camera: Camera;
    private domElement: HTMLElement;
    private enabled: boolean;
    private movementSpeed: number;
    private lookSpeed: number;
    private lat: number;
    private lon: number;
    private moveState: MoveState;
    private vec: Vector3;
    private autoForward?: boolean;

    constructor(camera: Camera, domElement: HTMLElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.enabled = true;
        this.movementSpeed = 10.0;
        this.lookSpeed = 0.05;
        this.lat = 0;
        this.lon = 0;
        this.moveState = {
            up: 0,
            down: 0,
            left: 0,
            right: 0,
            forward: 0,
            back: 0
        };
        this.vec = new Vector3();

        this.domElement.addEventListener('contextmenu', (event: Event) => event.preventDefault(), false);
        this.domElement.addEventListener('mousemove', this.onMouseMove, false);
        window.addEventListener('keydown', this.onKeyDown, false);
        window.addEventListener('keyup', this.onKeyUp, false);
    }

    private onMouseMove = (event: MouseEvent): void => {
        if (this.enabled === false) return;

        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;

        this.lon -= movementX * this.lookSpeed;
        this.lat += movementY * this.lookSpeed;
    };

    private onKeyDown = (event: KeyboardEvent): void => {
        switch (event.keyCode) {
            case 87: // W
                this.moveState.forward = 1;
                break;
            case 83: // S
                this.moveState.back = 1;
                break;
            case 65: // A
                this.moveState.left = 1;
                break;
            case 68: // D
                this.moveState.right = 1;
                break;
            case 82: // R
                this.moveState.up = 1;
                break;
            case 70: // F
                this.moveState.down = 1;
                break;
        }
    };

    private onKeyUp = (event: KeyboardEvent): void => {
        switch (event.keyCode) {
            case 87: // W
                this.moveState.forward = 0;
                break;
            case 83: // S
                this.moveState.back = 0;
                break;
            case 65: // A
                this.moveState.left = 0;
                break;
            case 68: // D
                this.moveState.right = 0;
                break;
            case 82: // R
                this.moveState.up = 0;
                break;
            case 70: // F
                this.moveState.down = 0;
                break;
        }
    };

    public update(dt: number): void {
        if (this.enabled === false) return;

        this.vec.setXYZ(0, 0, 0);
        const actualMoveSpeed = this.movementSpeed;

        if (this.moveState.forward || (this.autoForward && !this.moveState.back)) {
            this.vec.add(this.camera.forward);
        }
        if (this.moveState.back || (this.autoForward && !this.moveState.forward)) {
            this.vec.sub(this.camera.forward);
        }
        if (this.moveState.left) {
            this.vec.sub(this.camera.right);
        }
        if (this.moveState.right) {
            this.vec.add(this.camera.right);
        }
        if (this.moveState.up) {
            this.vec.add(this.camera.up);
        }
        if (this.moveState.down) {
            this.vec.sub(this.camera.up);
        }

        const phi = (90 - this.lat) * Math.PI / 180;
        const theta = this.lon * Math.PI / 180;
        this.camera.position.add(this.vec.scale(actualMoveSpeed * dt));

        const targetPosition = this.camera.position.clone();
        targetPosition.x += 100 * Math.sin(phi) * Math.cos(theta);
        targetPosition.y += 100 * Math.cos(phi);
        targetPosition.z += 100 * Math.sin(phi) * Math.sin(theta);

        this.camera.updateViewMatrix();
    }
}