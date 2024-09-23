import { InstancedMesh } from '../core/InstancedMesh';
import { Vector3 } from '../math/Vector3';
import { Matrix4 } from '../math/Matrix4';
import { randomFloat } from '../math/MathUtils';


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
        
        this.separationRange = 11;
        this.alignmentRange = 10;
        this.cohesionRange = 10;

        this.separationFactor = 2;
        this.alignmentFactor = 1;
        this.cohesionFactor = 1;

        this.boundaryAvoidanceRange = 10;
        this.boundaryFactor = 1;
        this.maxSpeed = 10;
        this.elapsed = 0;


        this.initializeBoids();
    }
    
    initializeBoids() {
        this.boids = [];
        this.positions = [];
        this.velocities = [];
        for (let i = 0; i < this.count; i++) {
            const boid = {
                position: this.boundingBox.randomPoint(),
                velocity: new Vector3(
                    randomFloat(-1, 1),
                    randomFloat(-0.1, 0.2),
                    randomFloat(-1, 1)
                ).normalize()
            }
            this.boids.push(boid);
            this.setPositionAt(boid.position, i);
        }
    }
    
    update(dt) {
        this.elapsed += dt;
        this.cohesionFactor = Math.abs(Math.sin(this.elapsed * 0.3)) * 0.3;

        for (let i = 0; i < this.count; i++) {
            this.separation.clear();
            this.alignment.clear();
            this.cohesion.clear();
            this.vec.clear();
            this.positionToMoveTo.clear();

            const boid = this.boids[i];

            let numOfBoidsToAvoid = 0;
            let numOfBoidsToAlignWith = 0;
            let numOfBoidsToCohereWith = 0;

            for (let i = 0; i < this.count; i++) {
                const other = this.boids[i];
                if (boid === other) continue;
                const distance = boid.position.distanceTo(other.position);

                if (distance < this.separationRange) {
                    const direction = this.vec.subVectors(boid.position, other.position).normalize();
                    const weightedVelocity = direction.divScalar(distance);
                    this.separation.add(weightedVelocity);
                    numOfBoidsToAvoid++;
                }
                
                if (distance < this.alignmentRange) {
                    this.alignment.add(other.velocity);
                    numOfBoidsToAlignWith++;
                }
                
                if (distance < this.cohesionRange) {
                    this.positionToMoveTo.add(other.position);
                    numOfBoidsToCohereWith++;
                }
            }
            
            if (numOfBoidsToAvoid > 0) {
                this.separation.divScalar(numOfBoidsToAvoid);
                this.separation.mulScalar(this.separationFactor);
            }
            
            if (numOfBoidsToAlignWith > 0) {
                this.alignment.divScalar(numOfBoidsToAlignWith);
                this.alignment.mulScalar(this.alignmentFactor);
            }
            
            if (numOfBoidsToCohereWith > 0) {
                this.positionToMoveTo.divScalar(numOfBoidsToCohereWith);
                const direction = this.vec.subVectors(this.positionToMoveTo, boid.position).normalize();
                this.cohesion.copy(direction);
                this.cohesion.mulScalar(this.cohesionFactor);
            }
            

            boid.velocity.add(this.separation).add(this.alignment).add(this.cohesion);
            this.avoidBoundary(boid, dt);

            if (boid.velocity.length() > 1) {
                boid.velocity.normalize();
            }
            const position = boid.position.clone();
            position.add(boid.velocity.clone().mulScalar(dt * this.maxSpeed));
            this.lookAt(position, i);
            boid.position.copy(position);

            this.setPositionAt(boid.position, i);
        }
    }
    
    avoidBoundary(boid, dt) {
        const position = boid.position;
        const halfWidth = this.boundingBox.size.x / 2;
        const halfHeight = this.boundingBox.size.y / 2;
        const halfDepth = this.boundingBox.size.z / 2;
        const distanceToPX = this.boundingBox.max.x - position.x;
        const distanceToNX = position.x - this.boundingBox.min.x;
        const distanceToPY = this.boundingBox.max.y - position.y;
        const distanceToNY = position.y - this.boundingBox.min.y;
        const distanceToPZ = this.boundingBox.max.z - position.z;
        const distanceToNZ = position.z - this.boundingBox.min.z;
        
        if (distanceToPX < this.boundaryAvoidanceRange) {
            const factor = this.boundaryFactor * (this.boundaryAvoidanceRange - distanceToPX);
            boid.velocity.x -= factor * dt;
        }
        if (distanceToNX < this.boundaryAvoidanceRange) {
            const factor = this.boundaryFactor * (this.boundaryAvoidanceRange - distanceToNX);
            boid.velocity.x += factor * dt;
        }
        
        if (distanceToPY < this.boundaryAvoidanceRange) {
            const factor = this.boundaryFactor * (this.boundaryAvoidanceRange - distanceToPY);
            boid.velocity.y -= factor * dt;
        }
        
        if (distanceToNY < this.boundaryAvoidanceRange) {
            const factor = this.boundaryFactor * (this.boundaryAvoidanceRange - distanceToNY);
            boid.velocity.y += factor * dt;
        }
        
        if (distanceToPZ < this.boundaryAvoidanceRange) {
            const factor = this.boundaryFactor * (this.boundaryAvoidanceRange - distanceToPZ);
            boid.velocity.z -= factor * dt;
        }
        
        if (distanceToNZ < this.boundaryAvoidanceRange) {
            const factor = this.boundaryFactor * (this.boundaryAvoidanceRange - distanceToNZ);
            boid.velocity.z += factor * dt;
        }
        
    }
}

export { Boids };