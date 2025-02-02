import { Geometry } from './Geometry';
import { Float32BufferAttribute } from './BufferAttribute';
import { Vector3 } from '@/math/Vector3';

export class SphereGeometry extends Geometry {
    parameters: { radius: number; widthSegments: number; heightSegments: number; };

    constructor(radius = 1, widthSegments = 32, heightSegments = 16) {
        super();

        this.parameters = {
            radius,
            widthSegments: Math.max(3, Math.floor(widthSegments)),
            heightSegments: Math.max(2, Math.floor(heightSegments))
        };

        const vertices: number[] = [];
        const normals: number[] = [];
        const uvs: number[] = [];
        const indices: number[] = [];

        // Generate vertices, normals and uvs
        const thetaLength = Math.PI * 2;
        const phiStart = 0;
        const phiLength = Math.PI;

        let index = 0;
        const grid: number[][] = [];

        // Generate vertices
        for (let iy = 0; iy <= heightSegments; iy++) {
            const verticesRow: number[] = [];
            const v = iy / heightSegments;

            let uOffset = 0;
            if (iy === 0) {
                uOffset = 0.5 / widthSegments;
            } else if (iy === heightSegments) {
                uOffset = -0.5 / widthSegments;
            }

            for (let ix = 0; ix <= widthSegments; ix++) {
                const u = ix / widthSegments;

                // Vertex position
                const x = -radius * Math.cos(phiStart + u * thetaLength) * Math.sin(phiStart + v * phiLength);
                const y = radius * Math.cos(phiStart + v * phiLength);
                const z = radius * Math.sin(phiStart + u * thetaLength) * Math.sin(phiStart + v * phiLength);

                vertices.push(x, y, z);

                // Normal
                const normal = new Vector3(x, y, z).normalize();
                normals.push(normal.x, normal.y, normal.z);

                // UV
                uvs.push(u + uOffset, 1 - v);

                verticesRow.push(index++);
            }

            grid.push(verticesRow);
        }

        // Generate indices
        for (let iy = 0; iy < heightSegments; iy++) {
            for (let ix = 0; ix < widthSegments; ix++) {
                const a = grid[iy][ix + 1];
                const b = grid[iy][ix];
                const c = grid[iy + 1][ix];
                const d = grid[iy + 1][ix + 1];

                if (iy !== 0) {
                    indices.push(a, b, d);
                }
                if (iy !== heightSegments - 1) {
                    indices.push(b, c, d);
                }
            }
        }

        // Build geometry
        this.setIndices(indices);
        this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
        this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));

        // Compute bounding volumes
        this.computeBoundingBox();
        this.computeBoundingSphere();
    }

    static fromJSON(data: any): SphereGeometry {
        return new SphereGeometry(data.radius, data.widthSegments, data.heightSegments);
    }
}