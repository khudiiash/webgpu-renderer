import { Geometry } from "./Geometry";

class BoxGeometry extends Geometry {
    width: number;
    height: number;
    depth: number;

    constructor(width = 1, height = 1, depth = 1) {
        super();
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.build();
    }
    
    build() {
        const w = this.width;
        const h = this.height;
        const d = this.depth;
        
      const positions = [
        // Front face
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,

        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,

        // Right face
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
      ];
      for (let i = 0; i < positions.length; i += 3) {
          positions[i] *= w / 2;
          positions[i + 1] *= h / 2;
          positions[i + 2] *= d / 2;
      }

      const frontScaleW = w >= h ? w/h : 1.0;
      const frontScaleH = h >= w ? h/w : 1.0;
      
      // For top/bottom faces: compare w and d
      const topScaleW = w >= d ? w/d : 1.0;
      const topScaleD = d >= w ? d/w : 1.0;
      
      // For left/right faces: compare d and h
      const sideScaleD = d >= h ? d/h : 1.0;
      const sideScaleH = h >= d ? h/d : 1.0;
      
      const uvs = [
          // Front face (compare w and h)
          0.0, frontScaleH,
          frontScaleW, frontScaleH,
          frontScaleW, 0.0,
          0.0, 0.0,
      
          // Back face (compare w and h)
          frontScaleW, frontScaleH,
          frontScaleW, 0.0,
          0.0, 0.0,
          0.0, frontScaleH,
      
          // Top face (compare w and d)
          0.0, 0.0,
          0.0, topScaleD,
          topScaleW, topScaleD,
          topScaleW, 0.0,
      
          // Bottom face (compare w and d)
          topScaleW, 0.0,
          0.0, 0.0,
          0.0, topScaleD,
          topScaleW, topScaleD,
      
          // Right face (compare d and h)
          sideScaleD, sideScaleH,
          sideScaleD, 0.0,
          0.0, 0.0,
          0.0, sideScaleH,
      
          // Left face (compare d and h)
          0.0, sideScaleH,
          sideScaleD, sideScaleH,
          sideScaleD, 0.0,
          0.0, 0.0,
      ]; 
      


      // Normals
      const normals = [
        // Front face
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,

        // Back face
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,

        // Top face
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,

        // Bottom face
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,

        // Right face
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,

        // Left face
       -1.0,  0.0,  0.0,
       -1.0,  0.0,  0.0,
       -1.0,  0.0,  0.0,
       -1.0,  0.0,  0.0,
      ];

      // Indices for the cube (each face has two triangles)
      const indices = [
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9, 10,      8, 10, 11,    // top
       12, 13, 14,     12, 14, 15,    // bottom
       16, 17, 18,     16, 18, 19,    // right
       20, 21, 22,     20, 22, 23     // left
      ];


      this.setFromArrays({ indices, positions, normals, uvs });
    }
}

export { BoxGeometry };