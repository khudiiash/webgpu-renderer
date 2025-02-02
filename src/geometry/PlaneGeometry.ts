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

    build() {
        const width_half = this.width / 2;
        const height_half = this.height / 2;

        const gridX = Math.floor(this.widthSegments);
        const gridY = Math.floor(this.heightSegments);

        const gridX1 = gridX + 1;
        const gridY1 = gridY + 1;

        const segment_width = this.width / gridX;
        const segment_height = this.height / gridY;

        const indices = [];
        const vertices = [];
        const normals = [];
        const uvs = [];

        for (let iy = 0; iy < gridY1; iy++) {
            const y = iy * segment_height - height_half;
            for (let ix = 0; ix < gridX1; ix++) {
                const x = ix * segment_width - width_half;
                vertices.push(x, -y, 0);
                normals.push(0, 0, 1);
                uvs.push(ix / gridX, 1 - (iy / gridY));
            }
        }

        for (let iy = 0; iy < gridY; iy++) {
            for (let ix = 0; ix < gridX; ix++) {
                const a = ix + gridX1 * iy;
                const b = ix + gridX1 * (iy + 1);
                const c = (ix + 1) + gridX1 * (iy + 1);
                const d = (ix + 1) + gridX1 * iy;
                indices.push(a, b, d, b, c, d);
            }
        }

        this.setFromArrays({
            indices: indices,
            positions: vertices,
            normals: normals,
            uvs: uvs
        })
    }


    setHeights(heights: number[]) {
        const positions = this.attributes.position?.data as Float32Array;
        const indices = this.indices?.data as Uint16Array | Uint32Array; 
        const normals = this.attributes.normal?.data as Float32Array;

        if (!positions || !indices || !normals) {
            console.error('Geometry.setHeights(): Geometry must have positions, normals and be indexed');
            return;
        }

        // Update Y coordinates (heights)
        for (let i = 0; i < heights.length; i++) {
            positions[i * 3 + 1] = heights[i];
        }

        // Recalculate normals
        for (let i = 0; i < normals.length; i += 3) {
            normals[i] = 0;
            normals[i + 1] = 0;
            normals[i + 2] = 0;
        }

        // Calculate normals for each triangle
        for (let i = 0; i < indices.length; i += 3) {
            const a = indices[i] * 3;
            const b = indices[i + 1] * 3;
            const c = indices[i + 2] * 3;

            // Get vectors of triangle edges
            const v1x = positions[b] - positions[a];
            const v1y = positions[b + 1] - positions[a + 1];
            const v1z = positions[b + 2] - positions[a + 2];

            const v2x = positions[c] - positions[a];
            const v2y = positions[c + 1] - positions[a + 1];
            const v2z = positions[c + 2] - positions[a + 2];

            // Calculate cross product
            const nx = v1y * v2z - v1z * v2y;
            const ny = v1z * v2x - v1x * v2z;
            const nz = v1x * v2y - v1y * v2x;

            // Add to all three vertices of the triangle
            normals[a] += nx;
            normals[a + 1] += ny;
            normals[a + 2] += nz;

            normals[b] += nx;
            normals[b + 1] += ny;
            normals[b + 2] += nz;

            normals[c] += nx;
            normals[c + 1] += ny;
            normals[c + 2] += nz;
        }

        // Normalize all normal vectors
        for (let i = 0; i < normals.length; i += 3) {
            const x = normals[i];
            const y = normals[i + 1];
            const z = normals[i + 2];
            const length = Math.sqrt(x * x + y * y + z * z);

            normals[i] = x / length;
            normals[i + 1] = y / length;
            normals[i + 2] = z / length;
        }

        this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
        this.setAttribute('position', new Float32BufferAttribute(positions, 3));
        this.pack();
    }

    copy(source: PlaneGeometry) {
        super.copy(source);
        this.width = source.width;
        this.height = source.height;
        this.widthSegments = source.widthSegments;
        this.heightSegments = source.heightSegments;
        return this;
    }

    static fromJSON(data: { width: number, height: number, widthSegments: number, heightSegments: number }) {
        return new PlaneGeometry(data.width, data.height, data.widthSegments, data.heightSegments);
    }
}

export { PlaneGeometry };