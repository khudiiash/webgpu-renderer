import { Matrix4 } from '@/math/Matrix4';
import { UniformData } from '@/data/UniformData';
import { Object3D } from './Object3D'
import { Geometry } from '@/geometry/Geometry';
import { Material } from '@/materials/Material';
import { boolToNum, uuid } from '@/util/general';
import { BufferData } from '@/data/BufferData';
import { Euler, Quaternion, Vector3 } from '@/math';
import { Struct } from '@/data/Struct';

export interface MeshOptions {
    useBillboard?: boolean;
    count?: number;
}

export class Mesh extends Object3D {
    public geometry!: Geometry;
    public material!: Material;
    public id: string = uuid('mesh');
    public count = 1;
    public instanceMatrices: BufferData;

    public isMesh: boolean = true;
    public isInstanced: boolean = false;
    public type: string = 'mesh';
    public localInstanceMatrices: BufferData;
    private gridSize: number = 1;
    private grid: Array<Array<{ v1: Vector3; v2: Vector3; v3: Vector3; }>> = [];

    public useBillboard: boolean = false;

    static struct = new Struct('MeshOptions', {
        useBillboard: 'u32',
        useTangent: 'u32',
        useNormal: 'u32',
        useUV: 'u32',
    })
    cellSize: { x: number; z: number; } = { x: 0, z: 0 };
    bounds: { minX: number; maxX: number; minZ: number; maxZ: number; } = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };

    constructor(geometry?: Geometry, material?: Material, options: MeshOptions = {}) {
        super();
        if (geometry) {
            this.geometry = geometry;
        }
        if (material) {
            material.addMesh(this);
            this.material = material;
        }
        const count = options.count || 1;
        this.count = Math.max(1, count);
        this.isInstanced = count > 1;

        this.instanceMatrices = new BufferData(this.count, 16);
        this.localInstanceMatrices = new BufferData(this.count, 16);

        for (let i = 0; i < this.count; i++) {
            this.localInstanceMatrices.set(Matrix4.IDENTITY, i * 16);
        }
        for (let i = 0; i < this.count; i++) {
            this.instanceMatrices.set(Matrix4.IDENTITY, i * 16);
        }

        this.useBillboard = options.useBillboard || false;

        this.uniforms = new Map<string, UniformData>();
        this.uniforms.set('MeshInstances', new UniformData(this, {
                name: 'MeshInstances',
                isGlobal: false,
                type: 'storage',
                values: {
                    mesh_instances: this.instanceMatrices,
                }
            }),
        );
    }

    initializeSpatialGrid(gridSize: number = 1) {
        this.gridSize = gridSize;
        // Calculate world bounds
        const positions = this.geometry.attributes.position!.data;
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
        const indices = this.geometry.getIndices();
        if (!indices) {
            return;
        }
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

    getOverlappingCells(triangle: { v1: Vector3; v2: Vector3; v3: Vector3; }): Set<number> {
        const minX = Math.min(triangle.v1.x, triangle.v2.x, triangle.v3.x);
        const maxX = Math.max(triangle.v1.x, triangle.v2.x, triangle.v3.x);
        const minZ = Math.min(triangle.v1.z, triangle.v2.z, triangle.v3.z);
        const maxZ = Math.max(triangle.v1.z, triangle.v2.z, triangle.v3.z);
        
        const startCell = this.worldToCell(minX, minZ);
        const endCell = this.worldToCell(maxX, maxZ);
        
        const cells: Set<number> = new Set();
        for (let x = startCell.x; x <= endCell.x; x++) {
            for (let z = startCell.z; z <= endCell.z; z++) {
                if (x >= 0 && x < this.gridSize && z >= 0 && z < this.gridSize) {
                    cells.add(x + z * this.gridSize);
                }
            }
        }
        
        return cells;
    }
    
    worldToCell(x: number, z: number) {
        const cellX = Math.floor((x - this.bounds.minX) / this.cellSize.x);
        const cellZ = Math.floor((z - this.bounds.minZ) / this.cellSize.z);
        return { x: cellX, z: cellZ };
    }
    
    getHeightAt(x: number, z: number) {
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

    pointInTriangle(px: number, pz: number, x1: number, z1: number, x2: number, z2: number, x3: number, z3: number) {
        const denominator = ((z2 - z3) * (x1 - x3) + (x3 - x2) * (z1 - z3));
        const a = ((z2 - z3) * (px - x3) + (x3 - x2) * (pz - z3)) / denominator;
        const b = ((z3 - z1) * (px - x3) + (x1 - x3) * (pz - z3)) / denominator;
        const c = 1 - a - b;
    
        return 0 <= a && a <= 1 && 0 <= b && b <= 1 && 0 <= c && c <= 1;
    }
    

    rayTriangleIntersection(rayOrigin: Vector3, rayDirection: Vector3, v1: Vector3, v2: Vector3, v3: Vector3) {
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

    getMatrixAt(index = 0, matrix = Matrix4.instance): Matrix4 {
        matrix.fromArraySilent(this.instanceMatrices, index * 16); 
        return matrix;
    }

    setMatrixAt(index: number, matrix: Matrix4) {
        if (index >= 0 && index < this.count) {
            const offset = index * 16;
            this.localInstanceMatrices.set(matrix, offset);
            this.updateInstanceWorldMatrix(index);
        }
    }

    setPositionAt(index: number, x: number | Vector3, y: number = 0, z: number = 0) {
        if (x instanceof Vector3) {
            z = x.z;
            y = x.y;
            x = x.x;
        } 
        this.localInstanceMatrices.set([x, y, z], index * 16 + 12);
        this.updateInstanceWorldMatrix(index);
    }

    setScaleAt(index: number, x: number | Vector3, y?: number, z?: number) {
        if (x instanceof Vector3) {
            z = x.z;
            y = x.y;
            x = x.x;
        } else if (y === undefined || z === undefined) {
            y = z = x;
        }

        const m = this.getMatrixAt(index, _mat);
        m.setScale(x, y, z);
        this.setMatrixAt(index, m);
    }

    /** 
     * Set all instance positions at once
     * @param positions Continuous array of positions, must be 3 * count in length
     */
    setAllPositions(positions: ArrayLike<number>) {
        for (let i = 0; i < this.count; i++) {
            this.localInstanceMatrices[12 + i * 16] = positions[i * 3];
            this.localInstanceMatrices[13 + i * 16] = positions[i * 3 + 1];
            this.localInstanceMatrices[14 + i * 16] = positions[i * 3 + 2];
        }

        this.updateAllInstanceWorldMatrices();
    }

    setAllScales(scales: ArrayLike<number> | number) {
        if (typeof scales === 'number') {
            for (let i = 0; i < this.count; i++) {
                this.getMatrixAt(i, _mat);
                _mat.scale(Vector3.instance.set(scales, scales, scales));
                this.localInstanceMatrices.setSilent(_mat, i * 16);
            }
        } else {
            for (let i = 0; i < this.count; i++) {
                this.getMatrixAt(i, _mat);
                _mat.scale(Vector3.instance.set(scales[i * 3], scales[i * 3 + 1], scales[i * 3 + 2]));
                this.localInstanceMatrices.setSilent(_mat, i * 16);
            }
        }
        this.updateAllInstanceWorldMatrices();
    }

    setAllRotations(rotations: ArrayLike<number>) {
        for (let i = 0; i < this.count; i++) {
            this.getMatrixAt(i, _mat);
            const position = _mat.getPosition(Vector3.instance);
            const scale = _mat.getScale(_v1);
            const euler = Euler.instance.fromArray(rotations, i * 3);
            _mat.compose(position, Quaternion.instance.setFromEuler(euler), scale);
            this.localInstanceMatrices.setSilent(_mat, i * 16);
        }
        this.updateAllInstanceWorldMatrices();
    }

    rotateXAt(index: number, angle: number) {
        this.getMatrixAt(index, _mat);
        _mat.rotateX(angle);
        this.setMatrixAt(index, _mat);
    }
    
    rotateYAt(index: number, angle: number) {
        this.getMatrixAt(index, _mat);
        _mat.rotateY(angle);
        this.setMatrixAt(index, _mat);
    }

    rotateZAt(index: number, angle: number) {
        this.getMatrixAt(index, _mat);
        _mat.rotateZ(angle);
        this.setMatrixAt(index, _mat);
    }

    updateMatrixWorld(fromParent: boolean = false) {
        super.updateMatrixWorld(fromParent);
        this.updateAllInstanceWorldMatrices();
    }

    getPositionAt(index: number, vector = Vector3.instance): Vector3 {
        vector.fromArray(this.localInstanceMatrices, index * 16 + 12);
        return vector;
    }

    getScaleAt(index: number, vector = Vector3.instance): Vector3 {
        this.getMatrixAt(index, _mat);
        return _mat.getScale(vector);
    }

    getWorldPositionAt(index: number, vector = Vector3.instance): Vector3 {
        this.getMatrixAt(index, _mat);
        return _mat.getPosition(vector);
    }

    private updateInstanceWorldMatrix(index: number) {
        const localMatrix = this.getLocalMatrixAt(index, _mat);
        const worldMatrix = Matrix4.instance.multiplyMatrices(this.matrixWorld, localMatrix);
        this.instanceMatrices.set(worldMatrix, index * 16);
    }

    private updateInstanceWorldMatrixSilent(index: number) {
        const localMatrix = this.getLocalMatrixAt(index, _mat);
        const worldMatrix = Matrix4.instance.multiplyMatrices(this.matrixWorld, localMatrix);
        this.instanceMatrices.setSilent(worldMatrix, index * 16);
    }

    private updateAllInstanceWorldMatrices() {
        for (let i = 0; i < this.count; i++) {
            this.updateInstanceWorldMatrixSilent(i);
        }

        this.instanceMatrices.monitor.check();
    }

    translateAt(index: number, x: number, y: number, z: number) {
        this.getMatrixAt(index, _mat);
        _mat.translate(Vector3.instance.set(x, y, z));
        this.localInstanceMatrices.setSilent(_mat, index * 16);
        this.updateInstanceWorldMatrix(index);
    }

    translateAll(translations: ArrayLike<number>) {
        for (let i = 0; i < this.count; i++) {
            this.getMatrixAt(i, _mat);
            _mat.translate(Vector3.instance.set(translations[i * 3], translations[i * 3 + 1], translations[i * 3 + 2]));
            this.localInstanceMatrices.setSilent(_mat, i * 16);
        }

        this.updateAllInstanceWorldMatrices();
    }

    getLocalMatrixAt(index: number, matrix = Matrix4.instance): Matrix4 {
        matrix.fromArraySilent(this.localInstanceMatrices, index * 16);
        return matrix;
    }

    setMaterial(material: Material) {
        this.material = material;
    }

    setGeometry(geometry: Geometry) {
        this.geometry = geometry;
    }

    copy(source: Mesh) {
        this.geometry = source.geometry;
        this.material = source.material;
        this.count = source.count;
        super.copy(source);
        this.uniforms.get('MeshInstances')!.notifyRebuild();
        this.uniforms.get('MeshOptions')!.notifyRebuild();
        return this;
    }
}

const _v1 = new Vector3();
const _mat = new Matrix4();