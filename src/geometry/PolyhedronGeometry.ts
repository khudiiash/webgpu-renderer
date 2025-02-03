import { Geometry } from './Geometry';
import { Float32BufferAttribute } from './BufferAttribute';
import { Vector3 } from '../math/Vector3';
import { Vector2 } from '../math/Vector2';

export class PolyhedronGeometry extends Geometry {

    constructor( vertices: number[] = [], indices: number[] = [], radius = 1, detail = 0 ) {
        super();

        this.parameters = {
            vertices: vertices,
            indices: indices,
            radius: radius,
            detail: detail
        };

        // default buffer data
        const vertexBuffer: number[] = [];
        const uvBuffer: number[] = [];

        // the subdivision creates the vertex buffer data
        subdivide(detail);

        // all vertices should lie on a conceptual sphere with a given radius
        applyRadius(radius);

        // finally, create the uv data
        generateUVs();

        // build non-indexed geometry
        this.setAttribute('position', new Float32BufferAttribute(vertexBuffer, 3));
        this.setAttribute('normal', new Float32BufferAttribute(vertexBuffer.slice(), 3));
        this.setAttribute('uv', new Float32BufferAttribute(uvBuffer, 2));

        if (detail === 0) {
            this.computeVertexNormals(); // flat normals
        } else {
            this.normalizeNormals(); // smooth normals
        }

        this.computeBoundingBox();
        this.computeBoundingSphere();
        this.pack();

        // helper functions
        function subdivide(detailValue: number) {
            const a = new Vector3();
            const b = new Vector3();
            const c = new Vector3();

            for (let i = 0; i < indices.length; i += 3) {
                getVertexByIndex(indices[i + 0], a);
                getVertexByIndex(indices[i + 1], b);
                getVertexByIndex(indices[i + 2], c);
                subdivideFace(a, b, c, detailValue);
            }
        }

        function subdivideFace(a: Vector3, b: Vector3, c: Vector3, detailValue: number) {
            const cols = detailValue + 1;
            const v: Vector3[][] = [];

            for (let i = 0; i <= cols; i++) {
                v[i] = [];

                const aj = a.clone().lerp(c, i / cols);
                const bj = b.clone().lerp(c, i / cols);

                const rows = cols - i;
                for (let j = 0; j <= rows; j++) {
                    if (j === 0 && i === cols) {
                        v[i][j] = aj;
                    } else {
                        v[i][j] = aj.clone().lerp(bj, j / rows);
                    }
                }
            }

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < 2 * (cols - i) - 1; j++) {
                    const k = Math.floor(j / 2);
                    if (j % 2 === 0) {
                        pushVertex(v[i][k + 1]);
                        pushVertex(v[i + 1][k]);
                        pushVertex(v[i][k]);
                    } else {
                        pushVertex(v[i][k + 1]);
                        pushVertex(v[i + 1][k + 1]);
                        pushVertex(v[i + 1][k]);
                    }
                }
            }
        }

        function applyRadius(r: number) {
            const vertex = new Vector3();
            for (let i = 0; i < vertexBuffer.length; i += 3) {
                vertex.set(vertexBuffer[i], vertexBuffer[i + 1], vertexBuffer[i + 2]);
                vertex.normalize().scale(r);
                vertexBuffer[i] = vertex.x;
                vertexBuffer[i + 1] = vertex.y;
                vertexBuffer[i + 2] = vertex.z;
            }
        }

        function generateUVs() {
            const vertex = new Vector3();
            for (let i = 0; i < vertexBuffer.length; i += 3) {
                vertex.set(vertexBuffer[i], vertexBuffer[i + 1], vertexBuffer[i + 2]);
                const u = azimuth(vertex) / (2 * Math.PI) + 0.5;
                const v = inclination(vertex) / Math.PI + 0.5;
                uvBuffer.push(u, 1 - v);
            }
            correctUVs();
            correctSeam();
        }

        function correctSeam() {
            for (let i = 0; i < uvBuffer.length; i += 6) {
                const x0 = uvBuffer[i + 0];
                const x1 = uvBuffer[i + 2];
                const x2 = uvBuffer[i + 4];
                const max = Math.max(x0, x1, x2);
                const min = Math.min(x0, x1, x2);

                if (max > 0.9 && min < 0.1) {
                    if (x0 < 0.2) uvBuffer[i + 0] += 1;
                    if (x1 < 0.2) uvBuffer[i + 2] += 1;
                    if (x2 < 0.2) uvBuffer[i + 4] += 1;
                }
            }
        }

        function pushVertex(vertex: Vector3) {
            vertexBuffer.push(vertex.x, vertex.y, vertex.z);
        }

        function getVertexByIndex(index: number, target: Vector3) {
            const stride = index * 3;
            target.x = vertices[stride];
            target.y = vertices[stride + 1];
            target.z = vertices[stride + 2];
        }

        function correctUVs() {
            const a = new Vector3();
            const b = new Vector3();
            const c = new Vector3();
            const centroid = new Vector3();
            const uvA = new Vector2();
            const uvB = new Vector2();
            const uvC = new Vector2();

            for (let i = 0, j = 0; i < vertexBuffer.length; i += 9, j += 6) {
                a.set(vertexBuffer[i], vertexBuffer[i + 1], vertexBuffer[i + 2]);
                b.set(vertexBuffer[i + 3], vertexBuffer[i + 4], vertexBuffer[i + 5]);
                c.set(vertexBuffer[i + 6], vertexBuffer[i + 7], vertexBuffer[i + 8]);

                uvA.set(uvBuffer[j], uvBuffer[j + 1]);
                uvB.set(uvBuffer[j + 2], uvBuffer[j + 3]);
                uvC.set(uvBuffer[j + 4], uvBuffer[j + 5]);

                centroid.copy(a).add(b).add(c).divide(3);
                const azi = azimuth(centroid);

                correctUV(uvA, j, a, azi);
                correctUV(uvB, j + 2, b, azi);
                correctUV(uvC, j + 4, c, azi);
            }
        }

        function correctUV(uv: Vector2, stride: number, vector: Vector3, azi: number) {
            if (azi < 0 && uv.x === 1) {
                uvBuffer[stride] = uv.x - 1;
            }
            if (vector.x === 0 && vector.z === 0) {
                uvBuffer[stride] = azi / (2 * Math.PI) + 0.5;
            }
        }

        function azimuth(vector: Vector3) {
            return Math.atan2(vector.z, -vector.x);
        }

        function inclination(vector: Vector3) {
            return Math.atan2(-vector.y, Math.sqrt(vector.x * vector.x + vector.z * vector.z));
        }
    }

    public copy(source: this): this {
        super.copy(source);
        this.parameters = { ...source.parameters };
        return this;
    }

    public static fromJSON(data: any): PolyhedronGeometry {
        return new PolyhedronGeometry(data.vertices, data.indices, data.radius, data.details);
    }
}