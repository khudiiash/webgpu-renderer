import { Vector3 } from '../math/Vector3.js';

class FirstPersonControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.enabled = true;
        this.movementSpeed = 10.0;
        this.lookSpeed = 0.05;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;
        this.moveDown = false;
        this.viewHalfX = 0;
        this.viewHalfY = 0;
        this.lat = 0;
        this.lon = 0;
        this.phi = 0;
        this.theta = 0;
        this.moveState = {
            up: 0,
            down: 0,
            left: 0,
            right: 0,
            forward: 0,
            back: 0
        };
        this.vec = new Vector3();
        this.viewHalfX = window.innerWidth / 2;
        this.viewHalfY = window.innerHeight / 2;
        this.onMouseMove = (event) => {
            if (this.enabled === false) {
                return;
            }
            const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
            this.lon -= movementX * this.lookSpeed;
            this.lat += movementY * this.lookSpeed;
        };
        this.onKeyDown = (event) => {
            console.log(event.keyCode);
            switch (event.keyCode) {
                case 87:
                    this.moveState.forward = 1;
                    break;
                case 83:
                    this.moveState.back = 1;
                    break;
                case 65:
                    this.moveState.left = 1;
                    break;
                case 68:
                    this.moveState.right = 1;
                    break;
                case 82:
                    this.moveState.up = 1;
                    break;
                case 70:
                    this.moveState.down = 1;
                    break;
            }
        };
        this.onKeyUp = (event) => {
            switch (event.keyCode) {
                case 87:
                    this.moveState.forward = 0;
                    break;
                case 83:
                    this.moveState.back = 0;
                    break;
                case 65:
                    this.moveState.left = 0;
                    break;
                case 68:
                    this.moveState.right = 0;
                    break;
                case 82:
                    this.moveState.up = 0;
                    break;
                case 70:
                    this.moveState.down = 0;
                    break;
            }
        }
        
        this.domElement.addEventListener('contextmenu', (event) => event.preventDefault(), false);
        this.domElement.addEventListener('mousemove', this.onMouseMove, false);
        window.addEventListener('keydown', this.onKeyDown, false);
        window.addEventListener('keyup', this.onKeyUp, false);
        console.log('FirstPersonControls');
    }
    
    update(dt) {
        if (this.enabled === false) {
            return;
        }
        this.vec.set(0, 0, 0);

        const actualMoveSpeed = this.movementSpeed;
        if (this.moveState.forward || (this.autoForward && !this.moveState.back)) {
            this.vec.add(this.camera.direction);
        }
        if (this.moveState.back || (this.autoForward && !this.moveState.forward)) {
            this.vec.sub(this.camera.direction);
        }
        if (this.moveState.left) {
            this.vec.sub(this.camera.rightDirection);
        }
        if (this.moveState.right) {
            this.vec.add(this.camera.rightDirection);
        }
        if (this.moveState.up) {
            this.vec.add(this.camera.up);
        }
        if (this.moveState.down) {
            this.vec.sub(this.camera.up);
        }
        const phi = (90 - this.lat) * Math.PI / 180;
        const theta = this.lon * Math.PI / 180;
        this.camera.position.add(this.vec.mulScalar(actualMoveSpeed * dt));

        const targetPosition = this.camera.position.clone();
        targetPosition.x += 100 * Math.sin(phi) * Math.cos(theta);
        targetPosition.y += 100 * Math.cos(phi);
        targetPosition.z += 100 * Math.sin(phi) * Math.sin(theta);

        this.camera.updateViewMatrix();
    }
    
}

export { FirstPersonControls };