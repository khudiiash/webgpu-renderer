import { Geometry } from './Geometry';
import { Vector3 } from '../math/Vector3';

class GrassGeometry extends Geometry {
    constructor(segments = 1, width = 0.2, height = 1) {
        super();
        this.height = height;
        this.width = width;
        this.segments = Math.max(1, Math.floor(segments));
        this.build();
    }
    
    build() {
        const positions = [];
        const normals = [];
        const uvs = [];
        const indices = [];

        const segmentHeight = this.height / this.segments;

        for (let i = 0; i <= this.segments; i++) {
            const t = i / this.segments;
            const y = t * this.height;
            let x, nx;

                x = (this.width / 2) * (1 - t);
                nx = 0.3 * (1 - t); // Normal X component

            // Left vertex
            positions.push(-x, y, 0);
            normals.push(-nx, 0.7, 0.7);
            uvs.push(0, t);

            // Right vertex
            positions.push(x, y, 0);
            normals.push(nx, 0.7, 0.7);
            uvs.push(1, t);

            if (i > 0) {
                const baseIndex = (i - 1) * 2;
                indices.push(
                    baseIndex, baseIndex + 1, baseIndex + 2,
                    baseIndex + 1, baseIndex + 3, baseIndex + 2
                );
            }
        }

        // Normalize all normals
        for (let i = 0; i < normals.length; i += 3) {
            const normal = new Vector3(normals[i], normals[i+1], normals[i+2]).normalize();
            normals[i] = normal.x;
            normals[i+1] = normal.y;
            normals[i+2] = normal.z;
        }

        this.setFromArrays(indices, positions, normals, uvs);
    }
}

export { GrassGeometry };