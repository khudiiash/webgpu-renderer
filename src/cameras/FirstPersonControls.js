import { Vector3 } from '../math/Vector3.js';

class FirstPersonControls {
    constructor(camera, canvas) {
        this.camera = camera;
        this.canvas = canvas;
        
        // Movement settings
        this.moveSpeed = 50;
        this.lookSpeed = 0.002;
        
        // Movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;
        this.moveDown = false;
        
        // Camera rotation
        this.pitch = 0;
        this.yaw = 0;
        
        
        // Vectors for movement calculation
        this.moveVector = new Vector3(0, 0, 0);
        this.direction = new Vector3(0, 0, -1);
        this.right = new Vector3(1, 0, 0);
        this.up = new Vector3(0, 1, 0);
        
        // Lock and hide cursor
        this.isLocked = false;
        
        this.bindEvents();
        this.setupPointerLock();
    }
    
    setupPointerLock() {
        this.canvas.addEventListener('click', () => {
            if (!this.isLocked) {
                this.canvas.requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.isLocked = document.pointerLockElement === this.canvas;
        });
    }
    
    bindEvents() {
        document.addEventListener('mousemove', (event) => {
            if (!this.isLocked) return;
            
            const movementX = event.movementX || 0;
            const movementY = event.movementY || 0;
            
            this.yaw -= movementX * this.lookSpeed;
            this.pitch -= movementY * this.lookSpeed;
            
            // Clamp pitch to prevent camera flipping
            this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
            
            this.updateCameraRotation();
        });
        
        document.addEventListener('keydown', (event) => this.updateMovementState(event, true));
        document.addEventListener('keyup', (event) => this.updateMovementState(event, false));
    }
    
    updateMovementState(event, isKeyDown) {
        switch (event.code) {
            case 'KeyW': this.moveForward = isKeyDown; break;
            case 'KeyS': this.moveBackward = isKeyDown; break;
            case 'KeyA': this.moveLeft = isKeyDown; break;
            case 'KeyD': this.moveRight = isKeyDown; break;
            case 'Space': this.moveUp = isKeyDown; break;
            case 'ShiftLeft': this.moveDown = isKeyDown; break;
        }
    }
    
    updateCameraRotation() {
        // Calculate direction vector from Euler angles
        const cosPitch = Math.cos(this.pitch);
        this.direction.set(
            Math.sin(this.yaw) * cosPitch,
            Math.sin(this.pitch),
            Math.cos(this.yaw) * cosPitch
        );
        
        // Update right vector
        this.right.crossVectors(this.up, this.direction).normalize();
        
        // Update camera direction and target
        this.camera.direction.copy(this.direction);
        const target = new Vector3()
            .copy(this.camera.position)
            .add(this.direction);
            
        this.camera.lookAt(target);
        this.camera.target.copy(target);
    }
    
    update(dt) {
        if (!this.isLocked) return;
        
        // Reset movement vector
        this.moveVector.set(0, 0, 0);
        
        // Calculate movement based on input
        if (this.moveForward) this.moveVector.add(this.direction);
        if (this.moveBackward) this.moveVector.sub(this.direction);
        if (this.moveRight) this.moveVector.sub(this.right);
        if (this.moveLeft) this.moveVector.add(this.right);
        if (this.moveUp) this.moveVector.add(this.up);
        if (this.moveDown) this.moveVector.sub(this.up);
        
        // Normalize and scale movement vector
        if (this.moveVector.length() > 0) {
            this.moveVector.normalize().multiplyScalar(this.moveSpeed * dt);
            const position = this.camera.position.clone();
            position.add(this.moveVector);
            this.camera.setPosition(position);
        }
    }
}

export { FirstPersonControls };