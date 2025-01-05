import { Object3D } from "../Object3D";

export class Scene extends Object3D {
    public background: string | number = 0x000000;
    public fog: boolean = false;
    public ambientLight: number = 0xffffff;

    constructor() {
        super();
    }
}