import { Vector3 } from '@/math/Vector3';
import { Camera } from '../Camera';

class FirstPersonControls {
    private camera: Camera;
    private domElement: HTMLElement;
    enabled: boolean;
    movementSpeed: number;
    lookSpeed: number;
    private moveState: {
        up: number;
        down: number;
        left: number;
        right: number;
        forward: number;
        back: number;
    };
    private vec: Vector3;
    private lat: number;
    private lon: number;
    private isLocked: boolean;

    constructor(camera: Camera, domElement: HTMLElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.enabled = true;
        this.movementSpeed = 1.0;
        this.lookSpeed = 0.1; // Reduced for more precise control
        this.lat = 0;
        this.lon = 0;
        this.isLocked = false;
        
        this.moveState = {
            up: 0,
            down: 0,
            left: 0,
            right: 0,
            forward: 0,
            back: 0
        };
        
        this.vec = new Vector3();

        // Prevent right-click menu
        this.domElement.addEventListener('contextmenu', (event) => event.preventDefault(), false);
        
        // Click to start
        this.domElement.addEventListener('click', this.requestPointerLock, false);
        
        // Pointer lock change events
        document.addEventListener('pointerlockchange', this.onPointerLockChange, false);
        document.addEventListener('mozpointerlockchange', this.onPointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', this.onPointerLockChange, false);
        
        // Mouse movement
        document.addEventListener('mousemove', this.onMouseMove, false);
        
        // Keyboard controls
        window.addEventListener('keydown', this.onKeyDown, false);
        window.addEventListener('keyup', this.onKeyUp, false);
    }

    private requestPointerLock = (): void => {
        if (!this.isLocked) {
            this.domElement.requestPointerLock = this.domElement.requestPointerLock ||
                (this.domElement as any).mozRequestPointerLock ||
                (this.domElement as any).webkitRequestPointerLock;
            this.domElement.requestPointerLock();
        }
    };

    private onPointerLockChange = (): void => {
        this.isLocked = document.pointerLockElement === this.domElement ||
            (document as any).mozPointerLockElement === this.domElement ||
            (document as any).webkitPointerLockElement === this.domElement;
        
        if (!this.isLocked) {
            this.enabled = false;
        } else {
            this.enabled = true;
        }
    };

    private onMouseMove = (event: MouseEvent): void => {
        if (!this.isLocked || !this.enabled) return;

        const movementX = event.movementX || (event as any).mozMovementX || (event as any).webkitMovementX || 0;
        const movementY = event.movementY || (event as any).mozMovementY || (event as any).webkitMovementY || 0;

        this.lon += movementX * this.lookSpeed;
        this.lat -= movementY * this.lookSpeed;

        // Clamp vertical rotation to prevent over-rotation
        this.lat = Math.max(-89, Math.min(89, this.lat));
    };

    private onKeyDown = (event: KeyboardEvent): void => {
        if (event.code === 'Escape') {
            document.exitPointerLock = document.exitPointerLock ||
                (document as any).mozExitPointerLock ||
                (document as any).webkitExitPointerLock;
            document.exitPointerLock();
            return;
        }

        switch (event.code) {
            case 'KeyW': this.moveState.forward = 1; break;
            case 'KeyS': this.moveState.back = 1; break;
            case 'KeyA': this.moveState.left = 1; break;
            case 'KeyD': this.moveState.right = 1; break;
            case 'KeyR': 
            case 'Space': this.moveState.up = 1; break;
            case 'KeyF': 
            case 'ShiftLeft': this.moveState.down = 1; break;
        }
    };

    private onKeyUp = (event: KeyboardEvent): void => {
        switch (event.code) {
            case 'KeyW': this.moveState.forward = 0; break;
            case 'KeyS': this.moveState.back = 0; break;
            case 'KeyA': this.moveState.left = 0; break;
            case 'KeyD': this.moveState.right = 0; break;
            case 'KeyR':
            case 'Space': this.moveState.up = 0; break;
            case 'KeyF':
            case 'ShiftLeft': this.moveState.down = 0; break;
        }
    };

    public update(dt: number): void {
        if (!this.enabled || !this.isLocked) return;

        // Movement vector
        this.vec.set(0, 0, 0);
        const actualMoveSpeed = this.movementSpeed * dt;

        // Update movement based on key states
        if (this.moveState.forward) this.vec.add(this.camera.forward);
        if (this.moveState.back) this.vec.sub(this.camera.forward);
        if (this.moveState.left) this.vec.sub(this.camera.right);
        if (this.moveState.right) this.vec.add(this.camera.right);
        if (this.moveState.up) this.vec.add(this.camera.up);
        if (this.moveState.down) this.vec.sub(this.camera.up);

        // Update camera position
        this.camera.position.add(this.vec.scale(actualMoveSpeed));

        // Update camera rotation
        const phi = (90 - this.lat) * Math.PI / 180;
        const theta = this.lon * Math.PI / 180;

        const targetPosition = this.camera.position.clone();
        targetPosition.x += Math.sin(phi) * Math.cos(theta);
        targetPosition.y += Math.cos(phi);
        targetPosition.z += Math.sin(phi) * Math.sin(theta);

        this.camera.lookAt(targetPosition);
    }

    public dispose(): void {
        document.removeEventListener('pointerlockchange', this.onPointerLockChange);
        document.removeEventListener('mozpointerlockchange', this.onPointerLockChange);
        document.removeEventListener('webkitpointerlockchange', this.onPointerLockChange);
        document.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        this.domElement.removeEventListener('contextmenu', (event) => event.preventDefault());
        this.domElement.removeEventListener('click', this.requestPointerLock);
    }
}

export { FirstPersonControls };