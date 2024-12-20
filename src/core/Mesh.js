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
        this.count = 1;
        this.isCulled = true;
        this.geometry = geometry;
        this.material = material;
    }
    
    initializeSpatialGrid(gridSize) {
        this.gridSize = gridSize;
        // Calculate world bounds
        const positions = this.geometry.positions;
        const worldPositions = new Float32Array(positions.length);
        
        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        
        // Transform vertices to world space and find bounds
        for (let i = 0; i < positions.length; i += 3) {
            const v = new Vector3(positions[i], positions[i + 1], positions[i + 2]);
            const w = this.matrixWorld.transformPoint(v);
            worldPositions[i] = w.x;
            worldPositions[i + 1] = w.y;
            worldPositions[i + 2] = w.z;
            
            minX = Math.min(minX, w.x);
            maxX = Math.max(maxX, w.x);
            minZ = Math.min(minZ, w.z);
            maxZ = Math.max(maxZ, w.z);
        }
        
        this.bounds = { minX, maxX, minZ, maxZ };
        this.cellSize = {
            x: (maxX - minX) / this.gridSize,
            z: (maxZ - minZ) / this.gridSize
        };
        
        // Create grid cells
        this.grid = new Array(this.gridSize * this.gridSize);
        for (let i = 0; i < this.grid.length; i++) {
            this.grid[i] = [];
        }
        
        // Assign triangles to grid cells
        const indices = this.geometry.indices;
        for (let i = 0; i < indices.length; i += 3) {
            const i1 = indices[i] * 3;
            const i2 = indices[i + 1] * 3;
            const i3 = indices[i + 2] * 3;
            
            const triangle = {
                v1: new Vector3(worldPositions[i1], worldPositions[i1 + 1], worldPositions[i1 + 2]),
                v2: new Vector3(worldPositions[i2], worldPositions[i2 + 1], worldPositions[i2 + 2]),
                v3: new Vector3(worldPositions[i3], worldPositions[i3 + 1], worldPositions[i3 + 2])
            };
            
            // Find cells that this triangle overlaps
            const cells = this.getOverlappingCells(triangle);
            cells.forEach(cell => {
                this.grid[cell].push(triangle);
            });
        }
    }
    
    getOverlappingCells(triangle) {
        const minX = Math.min(triangle.v1.x, triangle.v2.x, triangle.v3.x);
        const maxX = Math.max(triangle.v1.x, triangle.v2.x, triangle.v3.x);
        const minZ = Math.min(triangle.v1.z, triangle.v2.z, triangle.v3.z);
        const maxZ = Math.max(triangle.v1.z, triangle.v2.z, triangle.v3.z);
        
        const startCell = this.worldToCell(minX, minZ);
        const endCell = this.worldToCell(maxX, maxZ);
        
        const cells = new Set();
        for (let x = startCell.x; x <= endCell.x; x++) {
            for (let z = startCell.z; z <= endCell.z; z++) {
                if (x >= 0 && x < this.gridSize && z >= 0 && z < this.gridSize) {
                    cells.add(x + z * this.gridSize);
                }
            }
        }
        
        return cells;
    }
    
    worldToCell(x, z) {
        const cellX = Math.floor((x - this.bounds.minX) / this.cellSize.x);
        const cellZ = Math.floor((z - this.bounds.minZ) / this.cellSize.z);
        return { x: cellX, z: cellZ };
    }
    
    getHeightAt(x, z) {
        // Check bounds
        if (x < this.bounds.minX || x > this.bounds.maxX || 
            z < this.bounds.minZ || z > this.bounds.maxZ) {
            return 0;
        }
        
        // Find cell
        const cell = this.worldToCell(x, z);
        const cellIndex = cell.x + cell.z * this.gridSize;
        
        if (cellIndex < 0 || cellIndex >= this.grid.length) {
            return 0;
        }
        
        // Ray setup
        const rayOrigin = new Vector3(x, 1000, z);
        const rayDirection = new Vector3(0, -1, 0);
        
        let closestIntersection = Infinity;
        let found = false;
        
        // Only check triangles in this cell
        const triangles = this.grid[cellIndex];
        for (const triangle of triangles) {
            if (this.pointInTriangle(x, z, 
                triangle.v1.x, triangle.v1.z,
                triangle.v2.x, triangle.v2.z,
                triangle.v3.x, triangle.v3.z)) {
                
                const intersection = this.rayTriangleIntersection(
                    rayOrigin, rayDirection,
                    triangle.v1, triangle.v2, triangle.v3
                );
                
                if (intersection && intersection.t < closestIntersection) {
                    closestIntersection = intersection.t;
                    found = true;
                }
            }
        }
        
        if (found) {
            return rayOrigin.y + rayDirection.y * closestIntersection;
        }
        
        return 0;
    }
    
    
    // getHeightAt(x, z) {
    //     const rayOrigin = new Vector3(x, 1000, z);
    //     const rayDirection = new Vector3(0, -1, 0);
    
    //     const positions = this.geometry.positions;
    //     const indices = this.geometry.indices;
    
    //     let closestIntersection = Infinity;
    //     let found = false;
    
    //     const worldTransform = this.matrixWorld;
    //     if (!this.worldPositions) {
    //         this.worldPositions = new Float32Array(positions.length);
    //         for (let i = 0; i < positions.length; i += 3) {
    //             const v = _v1.set(positions[i], positions[i + 1], positions[i + 2]);
    //             const w = worldTransform.transformPoint(v);
    //             this.worldPositions[i] = w.x;
    //             this.worldPositions[i + 1] = w.y;
    //             this.worldPositions[i + 2] = w.z;
    //         }
    //     }
    
    //     for (let i = 0; i < (indices ? indices.length : positions.length) / 3; i++) {
    //         const i1 = indices ? indices[i * 3] : i * 3;
    //         const i2 = indices ? indices[i * 3 + 1] : i * 3 + 1;
    //         const i3 = indices ? indices[i * 3 + 2] : i * 3 + 2;
            
    //         const w1 = _v1.set(this.worldPositions[i1 * 3], this.worldPositions[i1 * 3 + 1], this.worldPositions[i1 * 3 + 2]);
    //         const w2 = _v2.set(this.worldPositions[i2 * 3], this.worldPositions[i2 * 3 + 1], this.worldPositions[i2 * 3 + 2]);
    //         const w3 = _v3.set(this.worldPositions[i3 * 3], this.worldPositions[i3 * 3 + 1], this.worldPositions[i3 * 3 + 2]);
    
    //         if (this.pointInTriangle(x, z, w1.x, w1.z, w2.x, w2.z, w3.x, w3.z)) {
    //             const intersection = this.rayTriangleIntersection(rayOrigin, rayDirection, w1, w2, w3);
                
    //             if (intersection && intersection.t < closestIntersection) {
    //                 closestIntersection = intersection.t;
    //                 found = true;
    //             }
    //         }
    //     }
    
    //     if (found) {
    //         return rayOrigin.y + rayDirection.y * closestIntersection;
    //     } else {
    //         return 0; // No intersection found, return 0
    //     }
    // } 
    
    // getVertexPosition(index, target) {
    //     const positions = this.geometry.positions;
    //     const x = positions[index * 3];
    //     const y = positions[index * 3 + 1];
    //     const z = positions[index * 3 + 2];
    //     target.set(x, y, z);
    //     return target;
    // }

    pointInTriangle(px, pz, x1, z1, x2, z2, x3, z3) {
        const denominator = ((z2 - z3) * (x1 - x3) + (x3 - x2) * (z1 - z3));
        const a = ((z2 - z3) * (px - x3) + (x3 - x2) * (pz - z3)) / denominator;
        const b = ((z3 - z1) * (px - x3) + (x1 - x3) * (pz - z3)) / denominator;
        const c = 1 - a - b;
    
        return 0 <= a && a <= 1 && 0 <= b && b <= 1 && 0 <= c && c <= 1;
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