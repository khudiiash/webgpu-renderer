import { generateID } from '../math/MathUtils.js';
import { Object3D } from './Object3D.js';
import { Vector3 } from '../math/Vector3.js';
const _v1 = new Vector3();
const _v2 = new Vector3();
const _v3 = new Vector3();

class Mesh extends Object3D {
    constructor(geometry, material) {
        super();
        this.id = generateID();
        this.geomatID = `${geometry.id}_${material.id}`;
        this.isMesh = true;
        this.type = 'mesh';
        this.geometry = geometry;
        this.material = material;
    }
    
    getHeightAt(x, z) {
        const rayOrigin = new Vector3(x, 1000, z);
        const rayDirection = new Vector3(0, -1, 0);

        const inverseMatrix = this.matrixWorld.clone().invert();
        const localRayOrigin = inverseMatrix.transformPoint(rayOrigin);
        const localRayDirection = inverseMatrix.transformDirection(rayDirection).normalize();

        const positions = this.geometry.positions;
        const indices = this.geometry.indices;

        let closestIntersection = Infinity;
        let found = false;

        for (let i = 0; i < (indices ? indices.length : positions.length) / 3; i++) {
            const i1 = indices ? indices[i * 3] : i * 3;
            const i2 = indices ? indices[i * 3 + 1] : i * 3 + 1;
            const i3 = indices ? indices[i * 3 + 2] : i * 3 + 2;

            const v1 = _v1.set(positions[i1 * 3], positions[i1 * 3 + 1], positions[i1 * 3 + 2]);
            const v2 = _v2.set(positions[i2 * 3], positions[i2 * 3 + 1], positions[i2 * 3 + 2]);
            const v3 = _v3.set(positions[i3 * 3], positions[i3 * 3 + 1], positions[i3 * 3 + 2]);
            if (x < v1.x && x < v2.x && x < v3.x) continue;
            if (x > v1.x && x > v2.x && x > v3.x) continue;
            if (z < v1.z && z < v2.z && z < v3.z) continue;
            if (z > v1.z && z > v2.z && z > v3.z) continue;

            const intersection = this.rayTriangleIntersection(localRayOrigin, localRayDirection, v1, v2, v3);
            
            if (intersection && intersection.t < closestIntersection) {
                closestIntersection = intersection.t;
                found = true;
            }
        }

        if (found) {
            const localIntersectionPoint = localRayOrigin.clone().add(localRayDirection.mulScalar(closestIntersection));
            const worldIntersectionPoint = this.matrixWorld.transformPoint(localIntersectionPoint);
            return worldIntersectionPoint.y;
        } else {
            return 0; // No intersection found, return 0
        }
    }

    rayTriangleIntersection(rayOrigin, rayDirection, v1, v2, v3) {
        const epsilon = 0.000001;
        const edge1 = v2.clone().sub(v1);
        const edge2 = v3.clone().sub(v1);
        const h = rayDirection.clone().cross(edge2);
        const a = edge1.dot(h);

        if (a > -epsilon && a < epsilon) return null; // Ray is parallel to the triangle

        const f = 1.0 / a;
        const s = rayOrigin.clone().sub(v1);
        const u = f * s.dot(h);

        if (u < 0.0 || u > 1.0) return null;

        const q = s.cross(edge1);
        const v = f * rayDirection.dot(q);

        if (v < 0.0 || u + v > 1.0) return null;

        const t = f * edge2.dot(q);

        if (t > epsilon) {
            return { t: t, u: u, v: v };
        }

        return null;
    }
}

Mesh.geomats = new Map();

export { Mesh };