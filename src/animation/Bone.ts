import { Object3D } from '../core/Object3D.js';
import { Matrix4 } from '../math/Matrix4.js';

export class Bone extends Object3D {
    type: string;
    isBone: boolean;
    inverseBindMatrix: Matrix4;
    bindMatrix: Matrix4;

    constructor() {
        super();
        this.type = 'Bone';
        this.isBone = true;
        this.inverseBindMatrix = new Matrix4();
        this.bindMatrix = new Matrix4();
    }
    
    
}