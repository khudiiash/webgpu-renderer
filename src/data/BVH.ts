import { Mesh } from "@/core/Mesh";
import { Vector3 } from "@/math/Vector3";

class BVHNode {
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
  left: BVHNode | null = null;
  right: BVHNode | null = null;
  triangles: Array<{
    v1: Vector3;
    v2: Vector3;
    v3: Vector3;
  }> | null = null;

  constructor(
    bounds: {
      minX: number;
      maxX: number;
      minY: number;
      maxY: number;
      minZ: number;
      maxZ: number;
    },
    triangles?: Array<{ v1: Vector3; v2: Vector3; v3: Vector3 }>,
  ) {
    this.bounds = bounds;
    this.triangles = triangles || null;
  }

  // Helper method to check if a point's XZ coordinates are within node bounds
  containsXZ(x: number, z: number): boolean {
    return x >= this.bounds.minX && x <= this.bounds.maxX && z >= this.bounds.minZ && z <= this.bounds.maxZ;
  }
}

export class BVH {
  root: BVHNode;
  maxTrianglesPerNode: number;

  constructor(triangles: Array<{ v1: Vector3; v2: Vector3; v3: Vector3 }>, maxTrianglesPerNode: number = 10) {
    this.maxTrianglesPerNode = maxTrianglesPerNode;
    this.root = this.buildNode(triangles);
  }

  private buildNode(triangles: Array<{ v1: Vector3; v2: Vector3; v3: Vector3 }>): BVHNode {
    // Calculate bounds for current node
    const bounds = this.calculateBounds(triangles);

    // Base case: few enough triangles to store in leaf node
    if (triangles.length <= this.maxTrianglesPerNode) {
      return new BVHNode(bounds, triangles);
    }

    // Find the longest axis to split along
    const xSize = bounds.maxX - bounds.minX;
    const zSize = bounds.maxZ - bounds.minZ;
    const splitAxis = xSize > zSize ? "x" : "z";

    // Sort triangles by their centroid along the split axis
    triangles.sort((a, b) => {
      const aCentroid = this.getTriangleCentroid(a);
      const bCentroid = this.getTriangleCentroid(b);
      return aCentroid[splitAxis] - bCentroid[splitAxis];
    });

    // Split triangles into two groups
    const mid = Math.floor(triangles.length / 2);
    const leftTriangles = triangles.slice(0, mid);
    const rightTriangles = triangles.slice(mid);

    // Create node and recursively build children
    const node = new BVHNode(bounds);
    node.left = this.buildNode(leftTriangles);
    node.right = this.buildNode(rightTriangles);

    return node;
  }

  private calculateBounds(triangles: Array<{ v1: Vector3; v2: Vector3; v3: Vector3 }>) {
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;
    let minZ = Infinity,
      maxZ = -Infinity;

    triangles.forEach((triangle) => {
      [triangle.v1, triangle.v2, triangle.v3].forEach((v) => {
        minX = Math.min(minX, v.x);
        maxX = Math.max(maxX, v.x);
        minY = Math.min(minY, v.y);
        maxY = Math.max(maxY, v.y);
        minZ = Math.min(minZ, v.z);
        maxZ = Math.max(maxZ, v.z);
      });
    });

    return { minX, maxX, minY, maxY, minZ, maxZ };
  }

  private getTriangleCentroid(triangle: { v1: Vector3; v2: Vector3; v3: Vector3 }): Vector3 {
    return new Vector3(
      (triangle.v1.x + triangle.v2.x + triangle.v3.x) / 3,
      (triangle.v1.y + triangle.v2.y + triangle.v3.y) / 3,
      (triangle.v1.z + triangle.v2.z + triangle.v3.z) / 3,
    );
  }

  findHeight(x: number, z: number): number {
    const rayOrigin = new Vector3(x, 1000, z);
    const rayDirection = new Vector3(0, -1, 0);

    const result = this.raycast(rayOrigin, rayDirection);
    return result ? rayOrigin.y + rayDirection.y * result.t : 0;
  }

  private raycast(rayOrigin: Vector3, rayDirection: Vector3) {
    let closestIntersection = Infinity;
    let closestTriangle = null;

    const stack: BVHNode[] = [this.root];

    while (stack.length > 0) {
      const node = stack.pop()!;

      // Skip if ray doesn't intersect node bounds in XZ plane
      if (!node.containsXZ(rayOrigin.x, rayOrigin.z)) {
        continue;
      }

      // If this is a leaf node, test against its triangles
      if (node.triangles) {
        for (const triangle of node.triangles) {
          if (this.pointInTriangleXZ(rayOrigin.x, rayOrigin.z, triangle)) {
            const intersection = this.rayTriangleIntersection(rayOrigin, rayDirection, triangle.v1, triangle.v2, triangle.v3);

            if (intersection && intersection.t < closestIntersection) {
              closestIntersection = intersection.t;
              closestTriangle = triangle;
            }
          }
        }
      } else {
        // Add children to stack (right first so left is processed first)
        if (node.right) stack.push(node.right);
        if (node.left) stack.push(node.left);
      }
    }

    return closestTriangle ? { t: closestIntersection } : null;
  }

  private pointInTriangleXZ(x: number, z: number, triangle: { v1: Vector3; v2: Vector3; v3: Vector3 }): boolean {
    return Mesh.prototype.pointInTriangle(x, z, triangle.v1.x, triangle.v1.z, triangle.v2.x, triangle.v2.z, triangle.v3.x, triangle.v3.z);
  }

  private rayTriangleIntersection(rayOrigin: Vector3, rayDirection: Vector3, v1: Vector3, v2: Vector3, v3: Vector3) {
    return Mesh.prototype.rayTriangleIntersection(rayOrigin, rayDirection, v1, v2, v3);
  }
}
