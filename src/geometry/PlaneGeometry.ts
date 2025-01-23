import { Float32BufferAttribute } from "./BufferAttribute";
import { Geometry } from "./Geometry";

class PlaneGeometry extends Geometry {
    width: number;
    height: number;
    widthSegments: number;
    heightSegments: number;

    constructor(width = 1, height = 1, widthSegments = 1, heightSegments = 1) {
        super();
        this.width = width;
        this.height = height;
        this.widthSegments = widthSegments;
        this.heightSegments = heightSegments;
        this.build();
    }

    calculateUVs() {
        const positions = this.attributes.position.data;
        if (!positions) return;
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let i = 0; i < positions.length; i += 3) {
            minX = Math.min(minX, positions[i]);
            maxX = Math.max(maxX, positions[i]);
            minY = Math.min(minY, positions[i + 1]);
            maxY = Math.max(maxY, positions[i + 1]);
        }
        const width = maxX - minX;
        const height = maxY - minY;
        const uvs = [];
        for (let i = 0; i < positions.length; i += 3) {
            const u = (positions[i] - minX) / width;
            const v = (positions[i + 1] - minY) / height;
            uvs.push(u, v);
        }
        this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    }
    
    build() {
        const w = this.width / 2;
        const h = this.height / 2;
        const positions = [
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

        this.setFromArrays({ indices, positions, normals });
    }
}

export { PlaneGeometry };