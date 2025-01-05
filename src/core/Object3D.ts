import { Euler, Vector3, Quaternion, Matrix4 } from "@/core/math";

export class Object3D {
    public position: Vector3;
    public rotation: Euler;
    public scale: Vector3;
    public quaternion: Quaternion;

    constructor() {
        this.position = new Vector3();
        this.rotation = new Euler();
        this.scale = new Vector3(1, 1, 1);
        this.quaternion = new Quaternion(); 
    }
}