import { InstancedMesh } from '../core/InstancedMesh';
import { Vector3 } from '../math/Vector3';
import { Matrix4 } from '../math/Matrix4';
import { randomFloat } from '../math/MathUtils';
import { SpatialGrid } from './SpatialGrid';
import { clamp } from '../math/MathUtils';

const tempVec = new Vector3();
const tempVec2 = new Vector3();
const tempVec3 = new Vector3();
const tempVec4 = new Vector3();

class Boids extends InstancedMesh {
    constructor(geometry, material, count, boundingBox) {
        super(geometry, material, count);
        this.separation = new Vector3();
        this.alignment = new Vector3();
        this.cohesion = new Vector3();
        this.vec = new Vector3();
        this.positionToMoveTo = new Vector3();
        this.origin = origin;
        this.count = count;
        this.boundingBox = boundingBox;
        
        this.separationRange = 20;
        this.alignmentRange = 5;
        this.cohesionRange = 10;

        this.separationFactor = 3;
        this.alignmentFactor = 1;
        this.cohesionFactor = 1;

        this.boundaryAvoidanceRange = 5;
        this.boundaryFactor = 1;
        this.maxSpeed = 10;
        this.elapsed = 0;
        this.spatialGrid = new SpatialGrid(10, this.boundingBox);


        this.initializeBoids();
    }
    
    
    initializeBoids() {
        this.boids = [];
        this.positions = new Float32Array(this.count * 3);
        this.velocities = new Float32Array(this.count * 3);
        for (let i = 0; i < this.count; i++) {
            const point = this.boundingBox.randomPoint(tempVec);
            this.positions[i * 3 + 0] = point.x;
            this.positions[i * 3 + 1] = point.y;
            this.positions[i * 3 + 2] = point.z;
            this.velocities[i * 3 + 0] = randomFloat(-1, 1);
            this.velocities[i * 3 + 1] = randomFloat(-0.1, 0.2);
            this.velocities[i * 3 + 2] = randomFloat(-1, 1);
        }
        this.setAllPositionsArray(this.positions);
        this.setAllDirectionsArray(this.velocities);
        this.spatialGrid.update(this.positions);
    }
    
    update(dt) {
        this.elapsed += dt;
        this.cohesionFactor = clamp(Math.abs(Math.sin(this.elapsed * 0.5)), 0.2, 0.8);

        for (let i = 0; i < this.count; i++) {
            const boidPos = this.getBoidPositionAt(i, tempVec);
            const boidVel = this.getBoidVelocityAt(i, tempVec2);
            
            let separationX = 0, separationY = 0, separationZ = 0;
            let alignmentX = 0, alignmentY = 0, alignmentZ = 0;
            let cohesionX = 0, cohesionY = 0, cohesionZ = 0;
            let numSeparation = 0, numAlignment = 0, numCohesion = 0;
    
            const nearbyBoids = this.spatialGrid.getNearbyIndices(boidPos, Math.max(this.separationRange, this.alignmentRange, this.cohesionRange));
            
            for (const otherIndex of nearbyBoids) {
                if (i === otherIndex) continue;
                
                const otherPos = this.getBoidPositionAt(otherIndex, tempVec3);
                const dx = boidPos.x - otherPos.x;
                const dy = boidPos.y - otherPos.y;
                const dz = boidPos.z - otherPos.z;
                const distSq = dx * dx + dy * dy + dz * dz;
                
                if (distSq < this.separationRange * this.separationRange) {
                    const invDist = 1 / Math.sqrt(distSq);
                    separationX += dx * invDist;
                    separationY += dy * invDist;
                    separationZ += dz * invDist;
                    numSeparation++;
                }
                
                if (distSq < this.alignmentRange * this.alignmentRange) {
                    const otherVel = this.getBoidVelocityAt(otherIndex, tempVec4);
                    alignmentX += otherVel.x;
                    alignmentY += otherVel.y;
                    alignmentZ += otherVel.z;
                    numAlignment++;
                }
                
                if (distSq < this.cohesionRange * this.cohesionRange) {
                    cohesionX += otherPos.x;
                    cohesionY += otherPos.y;
                    cohesionZ += otherPos.z;
                    numCohesion++;
                }
            }
            
            if (numSeparation > 0) {
                const invNum = this.separationFactor / numSeparation;
                boidVel.x += separationX * invNum * dt;
                boidVel.y += separationY * invNum * dt;
                boidVel.z += separationZ * invNum * dt;
            }
            
            if (numAlignment > 0) {
                const invNum = this.alignmentFactor / numAlignment;
                boidVel.x += (alignmentX * invNum - boidVel.x) * dt;
                boidVel.y += (alignmentY * invNum - boidVel.y) * dt;
                boidVel.z += (alignmentZ * invNum - boidVel.z) * dt;
            }
            
            if (numCohesion > 0) {
                const invNum = 1 / numCohesion;
                cohesionX = (cohesionX * invNum - boidPos.x) * this.cohesionFactor;
                cohesionY = (cohesionY * invNum - boidPos.y) * this.cohesionFactor;
                cohesionZ = (cohesionZ * invNum - boidPos.z) * this.cohesionFactor;
                boidVel.x += cohesionX * dt;
                boidVel.y += cohesionY * dt;
                boidVel.z += cohesionZ * dt;
            }
    
            this.avoidBoundary(boidPos, boidVel, dt);
            boidVel.clampLength(0.5, 1);
    
            const velLengthSq = boidVel.x * boidVel.x + boidVel.y * boidVel.y + boidVel.z * boidVel.z;
            if (velLengthSq > 1) {
                const invVelLength = 1 / Math.sqrt(velLengthSq);
                boidVel.x *= invVelLength * dt;
                boidVel.y *= invVelLength * dt;
                boidVel.z *= invVelLength * dt;
            }
            
            if (boidVel.y > 0.4 || boidVel.y < -0.4) {
                boidVel.y *= 0.5;
            }
    
            const speed = dt * this.maxSpeed;
            boidPos.x += boidVel.x * speed;
            boidPos.y += boidVel.y * speed;
            boidPos.z += boidVel.z * speed;
    
            this.setBoidPositionAt(boidPos, i);
            this.setBoidVelocityAt(boidVel, i);
        }
        
        this.setAllPositionsArray(this.positions);
        this.setAllDirectionsArray(this.velocities);
        this.spatialGrid.update(this.positions);
        
    }
    
    getBoidPositionAt(index, out) {
        out.x = this.positions[index * 3];
        out.y = this.positions[index * 3 + 1];
        out.z = this.positions[index * 3 + 2];
        return out;
    }
    
    setBoidPositionAt(position, index) {
        this.positions[index * 3] = position.x;
        this.positions[index * 3 + 1] = position.y;
        this.positions[index * 3 + 2] = position.z;
    }
    
    getBoidVelocityAt(index, out) {
        out.x = this.velocities[index * 3];
        out.y = this.velocities[index * 3 + 1];
        out.z = this.velocities[index * 3 + 2];
        return out;
    }
    
    setBoidVelocityAt(velocity, index) {
        this.velocities[index * 3] = velocity.x;
        this.velocities[index * 3 + 1] = velocity.y;
        this.velocities[index * 3 + 2] = velocity.z;
    }
    
    avoidBoundary(position, velocity, dt) {
        const distances = [
            this.boundingBox.max.x - position.x, 
            position.x - this.boundingBox.min.x,
            this.boundingBox.max.y - position.y,
            position.y - this.boundingBox.min.y,
            this.boundingBox.max.z - position.z,
            position.z - this.boundingBox.min.z
        ]
        
        const p = ['x', 'x', 'y', 'y', 'z', 'z'];
        const signs = [-1, 1, -1, 1, -1, 1];
        for (let i = 0; i < distances.length; i++) {
            if (distances[i] < this.boundaryAvoidanceRange) {
                const factor = this.boundaryFactor * (this.boundaryAvoidanceRange - distances[i]);
                velocity[p[i]] += factor * dt * signs[i];
            }
        }
    }
}

export { Boids };