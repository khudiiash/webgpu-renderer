import { Vector3 } from "../math/Vector3";
const _vec1 = new Vector3();
const _vec2 = new Vector3();
const _vec3 = new Vector3();

class SpatialGrid {
    constructor(cellSize, boundingBox) {
        this.cellSize = cellSize;
        this.boundingBox = boundingBox;
        
        this.gridSize = {
            x: Math.ceil(boundingBox.getSize(_vec1).x / cellSize),
            y: Math.ceil(boundingBox.getSize(_vec2).y / cellSize),
            z: Math.ceil(boundingBox.getSize(_vec3).z / cellSize)
        };
        
        this.grid = new Array(this.gridSize.x * this.gridSize.y * this.gridSize.z);
        for (let i = 0; i < this.grid.length; i++) {
            this.grid[i] = [];
        }
    }

    clear() {
        for (let i = 0; i < this.grid.length; i++) {
            this.grid[i].length = 0;
        }
    }

    getCellIndex(position) {
        const x = Math.floor((position.x - this.boundingBox.min.x) / this.cellSize);
        const y = Math.floor((position.y - this.boundingBox.min.y) / this.cellSize);
        const z = Math.floor((position.z - this.boundingBox.min.z) / this.cellSize);
        return (z * this.gridSize.y + y) * this.gridSize.x + x;
    }

    insert(position, index) {
        const cellIndex = this.getCellIndex(position);
        if (cellIndex >= 0 && cellIndex < this.grid.length) {
            this.grid[cellIndex].push(index);
        }
    }

    getNearbyIndices(position, range) {
        const nearbyIndices = [];
        const cellRange = Math.ceil(range / this.cellSize);

        const minX = Math.max(0, Math.floor((position.x - range - this.boundingBox.min.x) / this.cellSize));
        const minY = Math.max(0, Math.floor((position.y - range - this.boundingBox.min.y) / this.cellSize));
        const minZ = Math.max(0, Math.floor((position.z - range - this.boundingBox.min.z) / this.cellSize));

        const maxX = Math.min(this.gridSize.x - 1, Math.floor((position.x + range - this.boundingBox.min.x) / this.cellSize));
        const maxY = Math.min(this.gridSize.y - 1, Math.floor((position.y + range - this.boundingBox.min.y) / this.cellSize));
        const maxZ = Math.min(this.gridSize.z - 1, Math.floor((position.z + range - this.boundingBox.min.z) / this.cellSize));

        for (let z = minZ; z <= maxZ; z++) {
            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    const cellIndex = (z * this.gridSize.y + y) * this.gridSize.x + x;
                    nearbyIndices.push(...this.grid[cellIndex]);
                }
            }
        }

        return nearbyIndices;
    }

    update(positions) {
        this.clear();
        for (let i = 0; i < positions.length; i += 3) {
            _vec1.set(positions[i], positions[i+1], positions[i+2]);
            this.insert(_vec1, i / 3);
        }
    }
}

export { SpatialGrid };