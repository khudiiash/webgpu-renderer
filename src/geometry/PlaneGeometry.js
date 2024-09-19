import { Geometry } from "./geometry";

class PlaneGeometry extends Geometry {
    constructor(width = 1, height = 1, widthSegments = 1, heightSegments = 1) {
        super();
        this.width = width;
        this.height = height;
        this.widthSegments = widthSegments;
        this.heightSegments = heightSegments;
        this.build();
    }
    
    build() {
        const w = this.width / 2;
        const h = this.height / 2;
        const vertices = [
            -w, -h, 0,
            -w, h, 0,
            w, h, 0,
            -w, -h, 0,
            w, h, 0,
            w, -h, 0
        ];
        const normals = [
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1
        ];
        const uvs = [
            0, 0,
            0, 1,
            1, 1,
            0, 0,
            1, 1,
            1, 0
        ];
        const indices = [
            0, 1, 2,
            3, 4, 5
        ];

        this.setFromArrays(vertices, normals, uvs, indices);
    }
}

export { PlaneGeometry };