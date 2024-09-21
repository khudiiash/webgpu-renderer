import { Geometry } from './Geometry.js';

class SphereGeometry extends Geometry {
    constructor(radius = 1, widthSegments = 32, heightSegments = 32) {
        super();
        this.radius = radius;
        this.widthSegments = widthSegments;
        this.heightSegments = heightSegments;
        this.build();
    }
    
    build() {
        const vertices = [];
        const normals = [];
        const uvs = [];
        const indices = [];

        for (let y = 0; y <= this.heightSegments; y++) {
            for (let x = 0; x <= this.widthSegments; x++) {
                const u = x / this.widthSegments;
                const v = y / this.heightSegments;
                const theta = u * Math.PI * 2;
                const phi = v * Math.PI;
                const px = this.radius * Math.sin(phi) * Math.cos(theta);
                const py = this.radius * Math.cos(phi);
                const pz = this.radius * Math.sin(phi) * Math.sin(theta);
                vertices.push(px, py, pz);
                normals.push(px, py, pz);
                uvs.push(u, v);
            }
        }
        
        for (let y = 0; y < this.heightSegments; y++) {
            for (let x = 0; x < this.widthSegments; x++) {
                const a = x + (this.widthSegments + 1) * y;
                const b = x + (this.widthSegments + 1) * (y + 1);
                const c = (x + 1) + (this.widthSegments + 1) * (y + 1);
                const d = (x + 1) + (this.widthSegments + 1) * y;
                indices.push(a, d, b); // Flipped
                indices.push(b, d, c); // Flipped
            }
        } 
        
        this.setFromArrays(vertices, normals, uvs, indices);
    }
}

export { SphereGeometry };