import { Geometry } from "./Geometry";
import { Vector3 } from "@/math/Vector3";
import { Float32BufferAttribute } from "./BufferAttribute";

class BoxGeometry extends Geometry {
    width: number;
    height: number;
    depth: number;
    parameters: { width: number; height: number; depth: number; widthSegments: number; heightSegments: number; depthSegments: number; };

    constructor(width = 1, height = 1, depth = 1, widthSegments = 1, heightSegments = 1, depthSegments = 1) {

      super();

      this.width = width;
      this.height = height;
      this.depth = depth;
  
      this.parameters = {
        width: width,
        height: height,
        depth: depth,
        widthSegments: widthSegments,
        heightSegments: heightSegments,
        depthSegments: depthSegments
      };
  
      const scope = this;
  
      // segments
  
      widthSegments = Math.floor( widthSegments );
      heightSegments = Math.floor( heightSegments );
      depthSegments = Math.floor( depthSegments );
  
      // buffers
  
      const indices: number[] = [];
      const vertices: number[] = [];
      const normals: number[] = [];
      const uvs: number[] = [];
  
      // helper variables
      let numberOfVertices = 0;
      let groupStart = 0;
  
      // build each side of the box geometry
  
      buildPlane( 'z', 'y', 'x', - 1, - 1, depth, height, width, depthSegments, heightSegments, 0 ); // px
      buildPlane( 'z', 'y', 'x', 1, - 1, depth, height, - width, depthSegments, heightSegments, 1 ); // nx
      buildPlane( 'x', 'z', 'y', 1, 1, width, depth, height, widthSegments, depthSegments, 2 ); // py
      buildPlane( 'x', 'z', 'y', 1, - 1, width, depth, - height, widthSegments, depthSegments, 3 ); // ny
      buildPlane( 'x', 'y', 'z', 1, - 1, width, height, depth, widthSegments, heightSegments, 4 ); // pz
      buildPlane( 'x', 'y', 'z', - 1, - 1, width, height, - depth, widthSegments, heightSegments, 5 ); // nz
  
      // build geometry
  
      this.setIndices(indices);
      this.setAttribute('position', new Float32BufferAttribute( vertices, 3 ) );
      this.setAttribute('normal', new Float32BufferAttribute( normals, 3 ) );
      this.setAttribute('uv', new Float32BufferAttribute( uvs, 2 ) );
  
      function buildPlane(
        u: 'x' | 'y' | 'z',
        v: 'x' | 'y' | 'z',
        w: 'x' | 'y' | 'z',
        udir: number,
        vdir: number,
        width: number,
        height: number,
        depth: number,
        gridX: number,
        gridY: number,
        materialIndex: number
      ) {
        const segmentWidth = width / gridX;
        const segmentHeight = height / gridY;
  
        const widthHalf = width / 2;
        const heightHalf = height / 2;
        const depthHalf = depth / 2;
  
        const gridX1 = gridX + 1;
        const gridY1 = gridY + 1;
  
        let vertexCounter = 0;
        let groupCount = 0;
  
        const vector = new Vector3();
  
        // generate vertices, normals and uvs
  
        for (let iy = 0; iy < gridY1; iy++) {
          const y = iy * segmentHeight - heightHalf;

          for (let ix = 0; ix < gridX1; ix++) {
            const x = ix * segmentWidth - widthHalf;

            // set values to correct vector component
            vector[ u ] = x * udir;
            vector[ v ] = y * vdir;
            vector[ w ] = depthHalf;
            // now apply vector to vertex buffer
            vertices.push( vector.x, vector.y, vector.z );
            // set values to correct vector component
            vector[ u ] = 0;
            vector[ v ] = 0;
            vector[ w ] = depth > 0 ? 1 : - 1;
            // now apply vector to normal buffer
            normals.push( vector.x, vector.y, vector.z );
            // uvs
            uvs.push( ix / gridX );
            uvs.push( 1 - ( iy / gridY ) );
            vertexCounter += 1;
          }
  
        }
  
        // indices
        for ( let iy = 0; iy < gridY; iy ++ ) {
          for ( let ix = 0; ix < gridX; ix ++ ) {
            const a = numberOfVertices + ix + gridX1 * iy;
            const b = numberOfVertices + ix + gridX1 * ( iy + 1 );
            const c = numberOfVertices + ( ix + 1 ) + gridX1 * ( iy + 1 );
            const d = numberOfVertices + ( ix + 1 ) + gridX1 * iy;
            indices.push( a, b, d );
            indices.push( b, c, d );
            groupCount += 6;
          }
  
        }
        scope.addGroup(groupStart, groupCount, materialIndex);
        groupStart += groupCount;
        numberOfVertices += vertexCounter;
      }

      this.setFromArrays({
        indices: indices,
        positions: vertices,
        normals: normals,
        uvs: uvs,
      });
  
    }
    
}

export { BoxGeometry };