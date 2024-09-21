class OrbitControls {
    constructor(camera, canvas) {
        this.camera = camera;
        this.canvas = canvas;
        this.target = { x: 0, y: 0, z: 0 };
        this.minDistance = 0;
        this.maxDistance = Infinity;

        this.rotateSpeed = 1.0;
        this.zoomSpeed = 1.0;
        this.panSpeed = 1.0;

        this.enableRotate = true;
        this.enableZoom = true;
        this.enablePan = true;

        this.spherical = { radius: 1, phi: 0, theta: 0 };
        this.sphericalDelta = { phi: 0, theta: 0 };
        this.scale = 1;
        this.panOffset = { x: 0, y: 0, z: 0 };

        this.updateSpherical();
        this.bindEvents();
    }

    updateSpherical() {
        const offset = {
            x: this.camera.position.x - this.target.x,
            y: this.camera.position.y - this.target.y,
            z: this.camera.position.z - this.target.z
        };

        this.spherical.radius = Math.sqrt(
            offset.x * offset.x + offset.y * offset.y + offset.z * offset.z
        );

        this.spherical.theta = Math.atan2(offset.x, offset.z);
        this.spherical.phi = Math.acos(Math.min(Math.max(offset.y / this.spherical.radius, -1), 1));
    }

    update() {
        this.spherical.theta += this.sphericalDelta.theta;
        this.spherical.phi += this.sphericalDelta.phi;

        this.spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, this.spherical.phi));
        this.spherical.radius *= this.scale;

        this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));

        this.target.x += this.panOffset.x;
        this.target.y += this.panOffset.y;
        this.target.z += this.panOffset.z;

        const sinPhiRadius = this.spherical.radius * Math.sin(this.spherical.phi);

        this.camera.position.x = this.target.x + sinPhiRadius * Math.sin(this.spherical.theta);
        this.camera.position.y = this.target.y + this.spherical.radius * Math.cos(this.spherical.phi);
        this.camera.position.z = this.target.z + sinPhiRadius * Math.cos(this.spherical.theta);

        this.camera.target.set(this.target.x, this.target.y, this.target.z);
        this.camera.lookAt(this.target.x, this.target.y, this.target.z);

        this.sphericalDelta.theta = 0;
        this.sphericalDelta.phi = 0;
        this.scale = 1;
        this.panOffset.x = 0;
        this.panOffset.y = 0;
        this.panOffset.z = 0;
    }

    bindEvents() {
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('wheel', this.onMouseWheel.bind(this));
    }

    onMouseDown(event) {
        if (!this.enableRotate && !this.enablePan) return;

        const onMouseMove = (moveEvent) => {
            const movementX = moveEvent.movementX || moveEvent.mozMovementX || 0;
            const movementY = moveEvent.movementY || moveEvent.mozMovementY || 0;

            if (moveEvent.shiftKey && this.enablePan) {
                this.pan(movementX, movementY);
            } else if (this.enableRotate) {
                this.rotate(movementX, movementY);
            }

            this.update();
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    rotate(deltaX, deltaY) {
        this.sphericalDelta.theta -= 2 * Math.PI * deltaX / this.canvas.clientHeight * this.rotateSpeed;
        this.sphericalDelta.phi -= 2 * Math.PI * deltaY / this.canvas.clientHeight * this.rotateSpeed;
    }

    pan(deltaX, deltaY) {
        const cameraRight = this.camera.rightDirection;
        const cameraLeft = cameraRight.mulScalar(-1);

        const offset = {
            x: this.camera.position.x - this.target.x,
            y: this.camera.position.y - this.target.y,
            z: this.camera.position.z - this.target.z
        };

        const targetDistance = Math.sqrt(
            offset.x * offset.x + offset.y * offset.y + offset.z * offset.z
        );
        
        const panX = cameraLeft.x * deltaX * targetDistance / this.canvas.clientHeight;
        const panY = deltaY * targetDistance / this.canvas.clientHeight;
        const panZ = cameraRight.z * deltaX * targetDistance / this.canvas.clientHeight;
         
        this.panOffset.x += panX;
        this.panOffset.y += panY;
        this.panOffset.z += panZ;
    }

    onMouseWheel(event) {
        if (!this.enableZoom) return;

        event.preventDefault();

        if (event.deltaY > 0) {
            this.scale /= Math.pow(0.95, this.zoomSpeed);
        } else {
            this.scale *= Math.pow(0.95, this.zoomSpeed);
        }

        this.update();
    }
}

export { OrbitControls };