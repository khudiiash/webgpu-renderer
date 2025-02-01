import { Geometry } from "./Geometry";

export class TriangleGeometry extends Geometry {
    constructor(size = 1) {
        super();
        this.setFromArrays({
            positions: [ size, 0, 0, -size, 0, 0, 0, size, 0, ],
            normals: [ 0, 0, size, 0, 0, size, 0, 0, size ],
            uvs: [ 0, 0, size, 0, size*0.5, size ],
            indices: [0, 2, 1, 0]
        });
    }
}