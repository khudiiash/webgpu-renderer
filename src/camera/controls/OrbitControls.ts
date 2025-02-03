import { EventEmitter } from '@/core/EventEmitter';
import { Vector2 } from '@/math/Vector2';
import { Vector3 } from '@/math/Vector3';
import { Camera } from '../Camera';

// Helper classes
class Spherical {
  radius: number;
  phi: number;
  theta: number;

  constructor(radius = 1, phi = 0, theta = 0) {
    this.radius = radius;
    this.phi = phi;
    this.theta = theta;
  }

  setFromVector3(v: Vector3): this {
    this.radius = v.magnitude();
    if (this.radius === 0) {
      this.theta = 0;
      this.phi = 0;
    } else {
      this.theta = Math.atan2(v.x, v.z);
      this.phi = Math.acos(Math.min(Math.max(v.y / this.radius, -1), 1));
    }
    return this;
  }

  makeSafe(): this {
    const EPS = 0.000001;
    this.phi = Math.max(EPS, Math.min(Math.PI - EPS, this.phi));
    return this;
  }

  setFromSphericalCoords(radius: number, phi: number, theta: number): this {
    this.radius = radius;
    this.phi = phi;
    this.theta = theta;
    return this;
  }
}

enum State {
  NONE,
  ROTATE,
  DOLLY,
  PAN,
}

export class OrbitControls extends EventEmitter {
  camera: Camera;
  domElement: HTMLElement;
  target: Vector3 = new Vector3();

  // Control parameters
  rotateSpeed: number = 1.0;
  zoomSpeed: number = 1.01;
  panSpeed: number = 1.0;
  minDistance: number = 0;
  maxDistance: number = Infinity;

  private state: State = State.NONE;

  private spherical = new Spherical();
  private sphericalDelta = new Spherical();

  private scale: number = 1;
  private panOffset = new Vector3();

  private rotateStart = new Vector2();
  private rotateEnd = new Vector2();
  private rotateDelta = new Vector2();

  private panStart = new Vector2();
  private panEnd = new Vector2();
  private panDelta = new Vector2();

  private zoomStart = new Vector2();
  private zoomEnd = new Vector2();
  private zoomDelta = new Vector2();
  public enabled: boolean = false;

  constructor(camera: Camera, domElement: HTMLElement) {
    super();
    this.camera = camera;
    this.domElement = domElement;

    // Event listeners
    this.domElement.addEventListener('contextmenu', (event) => event.preventDefault());
    this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.domElement.addEventListener('wheel', this.onMouseWheel.bind(this));
    this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));

    // Touch events can be added similarly
    this.update();
  }

  update() {
    // Offset from target
    const offset = this.camera.position.clone().sub(this.target);
    
    // Ensure the offset isn't zero
    if (offset.magnitudeSquared() === 0) {
      offset.z = 1;
    }
  
    this.spherical.setFromVector3(offset);
  
    this.spherical.theta += this.sphericalDelta.theta;
    this.spherical.phi += this.sphericalDelta.phi;
    
    // Make sure phi is within correct range
    this.spherical.makeSafe();
  
    // Adjust radius (zoom level)
    this.spherical.radius *= this.scale;
  
    // Restrict radius
    this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));
  
    // Set new offset based on spherical coordinates
    offset.setFromSphericalCoords(this.spherical.radius, this.spherical.phi, this.spherical.theta);
  
    // Apply any panning offset
    this.target.add(this.panOffset);
  
    // Apply to camera
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);
  
    // Reset deltas
    this.sphericalDelta.theta = 0;
    this.sphericalDelta.phi = 0;
    this.scale = 1;
    this.panOffset.set(0, 0, 0);
  }

  // Mouse event handlers
  onMouseDown(event: MouseEvent) {
    switch (event.button) {
      case 0: // Left button - rotate
        this.state = State.ROTATE;
        this.rotateStart.set(event.clientX, event.clientY);
        break;
      case 1: // Middle button - zoom
        this.state = State.DOLLY;
        this.zoomStart.set(event.clientX, event.clientY);
        break;
      case 2: // Right button - pan
        this.state = State.PAN;
        this.panStart.set(event.clientX, event.clientY);
        break;
    }
  }

  onMouseMove(event: MouseEvent) {
    switch (this.state) {
      case State.ROTATE:
        this.rotateEnd.set(event.clientX, event.clientY);
        this.rotateDelta
          .subVectors(this.rotateEnd, this.rotateStart)
          .scale((2 * Math.PI) / this.domElement.clientHeight)
          .scale(-this.rotateSpeed);

        this.sphericalDelta.theta += this.rotateDelta.x;
        this.sphericalDelta.phi += this.rotateDelta.y;

        this.rotateStart.copy(this.rotateEnd);
        this.update();
        break;

      case State.DOLLY:
        this.zoomEnd.setXY(event.clientX, event.clientY);
        this.zoomDelta.subVectors(this.zoomEnd, this.zoomStart);

        if (this.zoomDelta.y > 0) {
          this.dollyIn();
        } else if (this.zoomDelta.y < 0) {
          this.dollyOut();
        }

        this.zoomStart.copy(this.zoomEnd);
        this.update();
        break;

      case State.PAN:
        this.panEnd.setXY(event.clientX, event.clientY);
        this.panDelta
          .subVectors(this.panEnd, this.panStart)
          .scale(this.panSpeed);

        this.pan(this.panDelta.x, this.panDelta.y);

        this.panStart.copy(this.panEnd);
        this.update();
        break;
    }
  }

  onMouseUp() {
    this.state = State.NONE;
  }

  onMouseWheel(event: WheelEvent) {
    if (event.deltaY > 0) {
      this.dollyOut();
    } else if (event.deltaY < 0) {
      this.dollyIn();
    }
    this.update();
  }

  // Zoom methods
  dollyIn() {
    this.scale /= this.zoomSpeed;
  }

  dollyOut() {
    this.scale *= this.zoomSpeed;
  }

  // Pan method
  pan(deltaX: number, deltaY: number) {
    const offset = this.camera.position.clone().sub(this.target);
    const targetDistance = offset.magnitude();

    // Calculate pan movement
    const panX = (2 * deltaX * targetDistance) / this.domElement.clientHeight;
    const panY = (2 * deltaY * targetDistance) / this.domElement.clientHeight;

    const panOffset = new Vector3();
    panOffset.copy(this.camera.right).scale(-panX);
    panOffset.add(this.camera.up.clone().scale(panY));

    this.panOffset.add(panOffset);
  }
}