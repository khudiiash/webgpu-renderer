import { Vector3 } from "@/math/Vector3";
import { Matrix4 } from "@/math/Matrix4";
import { Quaternion } from "@/math/Quaternion";

// Interface for VAT parameters
export interface VATParams {
  samplesPerSecond?: number;
  animationIndex?: number;
  textureFormat?: GPUTextureFormat;
  meshIndices?: number[]; // Indices of meshes to include in the VAT
}

// Interface for VAT texture data
export interface VATTextures {
  positionTexture: GPUTexture;
  normalTexture: GPUTexture | null;
  dimensions: {
    width: number;
    height: number;
    frames: number;
  };
}

export interface AnimationFrame {
  positions: number[];
  normals: number[];
}

export interface AnimationData {
  frames: AnimationFrame[];
  duration: number;
  totalFrames: number;
}

export class VATLoader {
  private device: GPUDevice;

  constructor(device: GPUDevice) {
    this.device = device;
  }

  // Helper function to transform a point by a Matrix4
  private transformPoint(point: [number, number, number], matrix: Matrix4): [number, number, number] {
    const pos = new Vector3(point[0], point[1], point[2]);
    matrix.transformPoint(pos);
    return [pos.x, pos.y, pos.z];
  }

  // Helper function to transform a normal by a Matrix4
  private transformNormal(normal: [number, number, number], matrix: Matrix4): [number, number, number] {
    // Create a copy of the matrix to avoid modifying the original
    const normalMatrix = new Matrix4().copy(matrix);

    // Remove translation component
    normalMatrix[12] = 0;
    normalMatrix[13] = 0;
    normalMatrix[14] = 0;

    // Invert and transpose for normal transformation
    normalMatrix.invert().transpose();

    const normalVec = new Vector3(normal[0], normal[1], normal[2]);
    normalMatrix.transformPoint(normalVec);
    normalVec.normalize();

    return [normalVec.x, normalVec.y, normalVec.z];
  }

  /**
   * Extract animation frames from GLTF data, handling the specific skeleton structure in your file
   */
  extractAnimationFrames(
    gltf: any,
    buffers: any,
    accessorParser: (gltf: any, buffers: any, accessorIndex: any) => any,
    animationIndex: number = 0,
    samplesPerSecond: number = 30,
    meshIndices?: number[]
  ): AnimationData {
    const animations = gltf.animations;
    if (!animations || animations.length === 0) {
      throw new Error('No animations found in the model');
    }

    const animation = animations[animationIndex];

    if (!animation) {
      throw new Error(`Animation index ${animationIndex} not found`);
    }

    // Calculate animation duration by finding the max time of all samplers
    let duration = 0;
    for (const channel of animation.channels) {
      const sampler = animation.samplers[channel.sampler];
      const inputAccessor = gltf.accessors[sampler.input];
      const inputArray = accessorParser(gltf, buffers, sampler.input);
      const maxTime = inputArray[inputArray.length - 1];
      duration = Math.max(duration, maxTime);
    }

    const totalFrames = Math.ceil(duration * samplesPerSecond);
    const timeStep = duration / totalFrames;

    // Create a map of node indices to their initial transforms
    const nodeTransforms = new Map();
    for (let i = 0; i < gltf.nodes.length; i++) {
      const node = gltf.nodes[i];
      nodeTransforms.set(i, {
        translation: node.translation || [0, 0, 0],
        rotation: node.rotation || [0, 0, 0, 1],
        scale: node.scale || [1, 1, 1],
        matrix: node.matrix || null
      });
    }

    // Collect all affected animation nodes
    const animatedNodes = new Set();
    for (const channel of animation.channels) {
      animatedNodes.add(channel.target.node);
    }

    // Find nodes with meshes if not specified
    const meshNodes = meshIndices
      ? meshIndices.map(index => gltf.nodes[index])
      : gltf.nodes.filter(node => node.mesh !== undefined).map((node, index) => index);

    if (meshNodes.length === 0) {
      throw new Error("No mesh nodes found in the GLTF data");
    }

    // Prepare frames array
    const frames: AnimationFrame[] = [];

    // For each frame in the animation
    for (let frame = 0; frame < totalFrames; frame++) {
      const time = frame * timeStep;
      const frameData: AnimationFrame = {
        positions: [],
        normals: []
      };

      // Apply animation at current time
      for (const channel of animation.channels) {
        const targetNode = channel.target.node;
        const targetPath = channel.target.path;
        const sampler = animation.samplers[channel.sampler];

        // Get input (time) and output (transform) data
        const inputArray = accessorParser(gltf, buffers, sampler.input);
        const outputArray = accessorParser(gltf, buffers, sampler.output);

        // Find appropriate keyframes
        let startIdx = 0;
        let endIdx = 0;

        for (let i = 0; i < inputArray.length; i++) {
          if (inputArray[i] <= time) startIdx = i;
          if (inputArray[i] >= time) {
            endIdx = i;
            break;
          }
        }

        // Handle edge cases
        if (endIdx === 0) endIdx = startIdx;
        if (startIdx === inputArray.length - 1) endIdx = startIdx;

        // Get the transform
        const transform = nodeTransforms.get(targetNode);

        // If we're at the exact keyframe or past the last one
        if (inputArray[startIdx] === time || startIdx === inputArray.length - 1) {
          const outputStride = targetPath === 'rotation' ? 4 : 3;
          const offset = startIdx * outputStride;

          // Update node transform
          if (targetPath === 'translation') {
            transform.translation = [
              outputArray[offset],
              outputArray[offset + 1],
              outputArray[offset + 2]
            ];
          } else if (targetPath === 'rotation') {
            transform.rotation = [
              outputArray[offset],
              outputArray[offset + 1],
              outputArray[offset + 2],
              outputArray[offset + 3]
            ];
          } else if (targetPath === 'scale') {
            transform.scale = [
              outputArray[offset],
              outputArray[offset + 1],
              outputArray[offset + 2]
            ];
          }
        } else {
          // Interpolate between keyframes
          const t0 = inputArray[startIdx];
          const t1 = inputArray[endIdx];
          const alpha = (time - t0) / (t1 - t0);

          const outputStride = targetPath === 'rotation' ? 4 : 3;
          const offset0 = startIdx * outputStride;
          const offset1 = endIdx * outputStride;

          // Linear interpolation based on path type
          if (targetPath === 'translation' || targetPath === 'scale') {
            const result = [];
            for (let i = 0; i < 3; i++) {
              result[i] = outputArray[offset0 + i] * (1 - alpha) + outputArray[offset1 + i] * alpha;
            }
            transform[targetPath] = result;
          } else if (targetPath === 'rotation') {
            // For quaternions, use slerp (simplified for now)
            const q1 = [
              outputArray[offset0],
              outputArray[offset0 + 1],
              outputArray[offset0 + 2],
              outputArray[offset0 + 3]
            ];

            const q2 = [
              outputArray[offset1],
              outputArray[offset1 + 1],
              outputArray[offset1 + 2],
              outputArray[offset1 + 3]
            ];

            // Calculate dot product to determine if we need to negate one quaternion
            const dot = q1[0] * q2[0] + q1[1] * q2[1] + q1[2] * q2[2] + q1[3] * q2[3];

            // If dot is negative, take the shorter path
            const q2Adjusted = dot < 0 ? q2.map(x => -x) : q2;

            // Simplified slerp by using linear interpolation
            const result = [];
            for (let i = 0; i < 4; i++) {
              result[i] = q1[i] * (1 - alpha) + q2Adjusted[i] * alpha;
            }

            // Normalize
            const len = Math.sqrt(result[0] * result[0] + result[1] * result[1] +
                                 result[2] * result[2] + result[3] * result[3]);
            transform.rotation = result.map(x => x / len);
          }
        }
      }

      // Calculate world matrices for all nodes
      const worldMatrices = new Map();

      // Function to calculate node's world matrix
      const calculateWorldMatrix = (nodeIndex: number, parentMatrix?: Matrix4) => {
        const node = gltf.nodes[nodeIndex];
        const transform = nodeTransforms.get(nodeIndex);

        let localMatrix = new Matrix4();

        if (node.matrix) {
          // Use provided matrix directly
          localMatrix.fromArray(node.matrix);
        } else {
          // Construct matrix from TRS
          const translation = new Vector3().fromArray(transform.translation);
          const rotation = new Quaternion().fromArray(transform.rotation);
          const scale = new Vector3().fromArray(transform.scale);

          localMatrix.compose(translation, rotation, scale);
        }

        // Calculate world matrix by multiplying with parent matrix if available
        const worldMatrix = parentMatrix ?
          new Matrix4().copy(parentMatrix).multiply(localMatrix) :
          new Matrix4().copy(localMatrix);

        worldMatrices.set(nodeIndex, worldMatrix);

        // Process children recursively
        if (node.children) {
          for (const childIndex of node.children) {
            calculateWorldMatrix(childIndex, worldMatrix);
          }
        }
      };

      // Calculate world matrices starting from each scene root
      for (const scene of gltf.scenes) {
        for (const nodeIndex of scene.nodes) {
          calculateWorldMatrix(nodeIndex);
        }
      }

      // Process mesh nodes to extract vertex data
      for (const meshNode of meshNodes) {
        const { mesh } = meshNode;
        const meshData = gltf.meshes[mesh];
        const worldMatrix = worldMatrices.get(mesh);

        if (!worldMatrix) {
          // This node might not be in the scene hierarchy
          console.warn(`No world matrix for node ${mesh} with mesh ${mesh}`);
          continue;
        }

        // For each primitive in the mesh
        for (const primitive of meshData.primitives) {
          const positions = accessorParser(gltf, buffers, primitive.attributes.POSITION);
          const normals = accessorParser(gltf, buffers, primitive.attributes.NORMAL);

          if (!positions) {
            console.warn(`No position data for primitive in mesh ${mesh}`);
            continue;
          }

          // Transform each vertex by the world matrix
          for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];

            // Transform position
            const transformedPos = this.transformPoint([x, y, z], worldMatrix);
            frameData.positions.push(...transformedPos);

            // Transform normal if available
            if (normals) {
              const nx = normals[i];
              const ny = normals[i + 1];
              const nz = normals[i + 2];

              const transformedNormal = this.transformNormal([nx, ny, nz], worldMatrix);
              frameData.normals.push(...transformedNormal);
            }
          }
        }
      }

      frames.push(frameData);
    }

    return {
      frames,
      duration,
      totalFrames
    };
  }

  /**
   * Create VAT textures from animation frames
   */
  async createVATTextures(animationData: AnimationData, format: GPUTextureFormat = 'rgba32float'): Promise<VATTextures> {
    const { frames, totalFrames } = animationData;

    // Determine texture dimensions
    const vertexCount = frames[0].positions.length / 3;
    const textureWidth = Math.ceil(Math.sqrt(vertexCount));
    const textureHeight = Math.ceil(vertexCount / textureWidth);

    console.log(`Creating VAT textures with dimensions: ${textureWidth}x${textureHeight}x${totalFrames} for ${vertexCount} vertices`);

    // Create position texture data
    const positionTextureData = new Float32Array(textureWidth * textureHeight * 4 * totalFrames);

    // Create normal texture data if available
    const hasNormals = frames[0].normals && frames[0].normals.length > 0;
    const normalTextureData = hasNormals ?
      new Float32Array(textureWidth * textureHeight * 4 * totalFrames) : null;

    // Fill texture data for each frame
    for (let frame = 0; frame < totalFrames; frame++) {
      const frameData = frames[frame];
      const frameOffset = frame * textureWidth * textureHeight * 4;

      for (let vertex = 0; vertex < vertexCount; vertex++) {
        const texelIndex = frameOffset + vertex * 4;
        const vertexIndex = vertex * 3;

        // Position (RGB = XYZ, A = 1.0)
        positionTextureData[texelIndex + 0] = frameData.positions[vertexIndex + 0] || 0; // X
        positionTextureData[texelIndex + 1] = frameData.positions[vertexIndex + 1] || 0; // Y
        positionTextureData[texelIndex + 2] = frameData.positions[vertexIndex + 2] || 0; // Z
        positionTextureData[texelIndex + 3] = 1.0; // A

        // Normal (if available)
        if (hasNormals && normalTextureData) {
          normalTextureData[texelIndex + 0] = frameData.normals[vertexIndex + 0] || 0; // X
          normalTextureData[texelIndex + 1] = frameData.normals[vertexIndex + 1] || 0; // Y
          normalTextureData[texelIndex + 2] = frameData.normals[vertexIndex + 2] || 0; // Z
          normalTextureData[texelIndex + 3] = 1.0; // A
        }
      }
    }

    // Create position texture
    const positionTexture = this.device.createTexture({
      size: [textureWidth, textureHeight, totalFrames],
      format: format,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING
    });

    // Upload position data
    this.device.queue.writeTexture(
      { texture: positionTexture },
      positionTextureData,
      { bytesPerRow: textureWidth * 16, rowsPerImage: textureHeight * 16 }, // 4 components * 4 bytes per float
      { width: textureWidth, height: textureHeight, depthOrArrayLayers: totalFrames }
    );

    // Create normal texture if available
    let normalTexture = null;
    if (hasNormals && normalTextureData) {
      normalTexture = this.device.createTexture({
        size: [textureWidth, textureHeight, totalFrames],
        format: format,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING
      });

      // Upload normal data
      this.device.queue.writeTexture(
        { texture: normalTexture },
        normalTextureData,
        { bytesPerRow: textureWidth * 16 }, // 4 components * 4 bytes per float
        { width: textureWidth, height: textureHeight, depthOrArrayLayers: totalFrames }
      );
    }

    return {
      positionTexture,
      normalTexture,
      dimensions: {
        width: textureWidth,
        height: textureHeight,
        frames: totalFrames
      }
    };
  }

  /**
   * Create a WebGPU shader module for VAT rendering
   */
  createVATShaderModule(hasNormals = true): GPUShaderModule {
    return this.device.createShaderModule({
      code: `
        struct VertexOutput {
          @builtin(position) position: vec4f,
          @location(0) worldPos: vec3f,
          @location(1) normal: vec3f,
          @location(2) uv: vec2f,
        };

        struct Uniforms {
          modelViewProjection: mat4x4f,
          currentFrame: f32,
          totalFrames: f32,
          textureDimensions: vec2f,
        };

        @group(0) @binding(0) var<uniform> uniforms: Uniforms;
        @group(0) @binding(1) var positionSampler: sampler;
        @group(0) @binding(2) var positionTexture: texture_3d<f32>;
        @group(0) @binding(3) var normalSampler: sampler;
        @group(0) @binding(4) var normalTexture: texture_3d<f32>;

        @vertex
        fn vertexMain(
          @location(0) position: vec3f,
          @location(1) normal: vec3f,
          @location(2) uv: vec2f,
          @location(3) vertexIndex: f32,
        ) -> VertexOutput {
          var output: VertexOutput;

          // Calculate texture coordinates for VAT lookup
          let texelX = modf(vertexIndex / uniforms.textureDimensions.x).whole;
          let texelY = floor(vertexIndex / uniforms.textureDimensions.x);

          // Normalize to [0, 1] range
          let vatUV = vec2f(
            texelX / (uniforms.textureDimensions.x - 1.0),
            texelY / (uniforms.textureDimensions.y - 1.0)
          );

          // Normalized frame coordinate [0, 1]
          let frameCoord = uniforms.currentFrame / (uniforms.totalFrames - 1.0);

          // Sample position from VAT
          let vatPosition = textureLoad(
            positionTexture,
            vec3f(vatUV, frameCoord)
          ).xyz;

          // Transform to clip space
          output.position = uniforms.modelViewProjection * vec4f(vatPosition, 1.0);
          output.worldPos = vatPosition;

          // Sample normal if available, otherwise use the original
          ${hasNormals ? `
            output.normal = textureSample(
              normalTexture,
              normalSampler,
              vec3f(vatUV, frameCoord)
            ).xyz;
          ` : `
            output.normal = normal;
          `}

          output.uv = uv;
          return output;
        }

        @fragment
        fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
          // Simple lighting calculation
          let lightDir = normalize(vec3f(1.0, 1.0, 1.0));
          let normalizedNormal = normalize(input.normal);

          let diffuse = max(dot(normalizedNormal, lightDir), 0.0);
          let ambient = 0.2;

          let finalColor = vec3f(1.0, 1.0, 1.0) * (ambient + diffuse);
          return vec4f(finalColor, 1.0);
        }
      `
    });
  }

  /**
   * Create the bind group layout for VAT
   */
  createVATBindGroupLayout(): GPUBindGroupLayout {
    return this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: 'uniform' }
        },
        {
          binding: 1,
          visibility: GPUShaderStage.VERTEX,
          sampler: { type: 'filtering' }
        },
        {
          binding: 2,
          visibility: GPUShaderStage.VERTEX,
          texture: { sampleType: 'float', viewDimension: '3d' }
        },
        {
          binding: 3,
          visibility: GPUShaderStage.VERTEX,
          sampler: { type: 'filtering' }
        },
        {
          binding: 4,
          visibility: GPUShaderStage.VERTEX,
          texture: { sampleType: 'float', viewDimension: '3d' }
        }
      ]
    });
  }

  /**
   * Create a pipeline layout for VAT
   */
  createVATPipelineLayout(bindGroupLayout: GPUBindGroupLayout): GPUPipelineLayout {
    return this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout]
    });
  }

  /**
   * Create a render pipeline for VAT rendering
   */
  createVATPipeline(
    shaderModule: GPUShaderModule,
    pipelineLayout: GPUPipelineLayout,
    format: GPUTextureFormat
  ): GPURenderPipeline {
    return this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vertexMain',
        buffers: [
          {
            // Original vertex data
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x3' }, // position
              { shaderLocation: 1, offset: 12, format: 'float32x3' }, // normal
              { shaderLocation: 2, offset: 24, format: 'float32x2' }, // uv
              { shaderLocation: 3, offset: 32, format: 'float32' }, // vertex index
            ],
            arrayStride: 36,
          }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragmentMain',
        targets: [{ format }]
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back'
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus'
      }
    });
  }

  /**
   * Process a glTF model and generate VAT textures
   *
   * This method is the main entry point for working with the VAT loader
   */
  async processGLTF(
    gltf: any,
    buffers: any,
    accessorParser: (gltf: any, buffers: any, accessorIndex: any) => any,
    params: VATParams = {}
  ) {
    console.log("Processing GLTF model for VAT baking...");

    // Identify mesh nodes
    const meshNodes = params.meshIndices ||
      gltf.nodes
        .map((node, index) => node.mesh !== undefined ? index : -1)
        .filter(index => index !== -1);

    console.log(`Found ${meshNodes.length} mesh nodes to process`);

    // Extract animation frames
    const animationData = this.extractAnimationFrames(
      gltf,
      buffers,
      accessorParser,
      params.animationIndex || 0,
      params.samplesPerSecond || 30,
      meshNodes
    );

    console.log(`Extracted ${animationData.frames.length} animation frames`);

    // Create VAT textures
    const vatTextures = await this.createVATTextures(
      animationData,
      params.textureFormat || 'rgba32float'
    );

    // Create shader module
    const hasNormals = vatTextures.normalTexture !== null;
    const shaderModule = this.createVATShaderModule(hasNormals);

    // Create bind group layout
    const bindGroupLayout = this.createVATBindGroupLayout();

    // Create pipeline layout
    const pipelineLayout = this.createVATPipelineLayout(bindGroupLayout);

    console.log("VAT processing complete");

    return {
      vatTextures,
      animationData,
      shaderModule,
      bindGroupLayout,
      pipelineLayout
    };
  }

  /**
   * Create a uniform buffer for VAT rendering
   */
  createVATUniformBuffer(): GPUBuffer {
    // 4x4 matrix (16 floats) + 4 additional floats for animation data
    const uniformBufferSize = 4 * 16 + 4 * 4;

    return this.device.createBuffer({
      size: uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  /**
   * Update uniform buffer with current frame data
   */
  updateVATUniforms(
    uniformBuffer: GPUBuffer,
    modelViewProjection: Matrix4,
    currentFrame: number,
    totalFrames: number,
    textureDimensions: { width: number, height: number }
  ): void {
    const uniformData = new Float32Array(20); // 16 for matrix + 4 additional values

    // Set modelViewProjection matrix
    for (let i = 0; i < 16; i++) {
      uniformData[i] = modelViewProjection[i];
    }

    // Set current frame and total frames
    uniformData[16] = currentFrame;
    uniformData[17] = totalFrames;

    // Set texture dimensions
    uniformData[18] = textureDimensions.width;
    uniformData[19] = textureDimensions.height;

    // Write uniform data
    this.device.queue.writeBuffer(uniformBuffer, 0, uniformData);
  }

  /**
   * Create an animation renderer using the VAT data
   *
   * Returns an object with methods to update and render the VAT animation
   */
  createAnimationRenderer(
    vatData: any,
    meshes: any[],
    canvas: HTMLCanvasElement,
    camera: any
  ) {
    const { vatTextures, animationData, bindGroupLayout, pipelineLayout, shaderModule } = vatData;

    // Get the preferred format
    const context = canvas.getContext('webgpu') as GPUCanvasContext;
    const format = navigator.gpu.getPreferredCanvasFormat();

    // Create a pipeline
    const pipeline = this.createVATPipeline(shaderModule, pipelineLayout, format);

    // Create a uniform buffer
    const uniformBuffer = this.createVATUniformBuffer();

    // Create samplers
    const sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

    // Create bind group
    const bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: uniformBuffer },
        },
        {
          binding: 1,
          resource: sampler,
        },
        {
          binding: 2,
          resource: vatTextures.positionTexture.createView({ dimension: '3d' }),
        },
        {
          binding: 3,
          resource: sampler,
        },
        {
          binding: 4,
          resource: vatTextures.normalTexture ?
            vatTextures.normalTexture.createView({ dimension: '3d' }) :
            vatTextures.positionTexture.createView({ dimension: '3d' }),
        },
      ],
    });

    // Create depth texture
    const depthTexture = this.device.createTexture({
      size: [canvas.width, canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    // Animation state
    let currentFrame = 0;
    const totalFrames = animationData.totalFrames;

    return {
      updateFrame(frame: number) {
        currentFrame = frame % totalFrames;
      },

      advanceFrame(deltaTime: number, fps: number = 30) {
        const frameDuration = 1 / fps;
        currentFrame = (currentFrame + deltaTime / frameDuration) % totalFrames;
      },

      render() {
        // Update uniforms
        const uniformData = new Float32Array(20);

        // Set projection * view matrix
        const viewProjMatrix = new Matrix4()
          .multiply(camera.projectionMatrix)
          .multiply(camera.viewMatrix);

        for (let i = 0; i < 16; i++) {
          uniformData[i] = viewProjMatrix[i];
        }

        // Set animation data
        uniformData[16] = Math.floor(currentFrame);
        uniformData[17] = totalFrames;
        uniformData[18] = vatTextures.dimensions.width;
        uniformData[19] = vatTextures.dimensions.height;

        // Upload uniform data
        this.device.queue.writeBuffer(uniformBuffer, 0, uniformData);

        // Begin rendering
        const commandEncoder = this.device.createCommandEncoder();
        const renderPass = commandEncoder.beginRenderPass({
          colorAttachments: [
            {
              view: context.getCurrentTexture().createView(),
              clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
              loadOp: 'clear',
              storeOp: 'store'
            }
          ],
          depthStencilAttachment: {
            view: depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store'
          }
        });

        // Set the pipeline and bind group
        renderPass.setPipeline(pipeline);
        renderPass.setBindGroup(0, bindGroup);

        // Draw all meshes
        for (const mesh of meshes) {
          const geometry = mesh.geometry;
          if (geometry.vertexBuffer && geometry.indexBuffer) {
            renderPass.setVertexBuffer(0, geometry.vertexBuffer);
            renderPass.setIndexBuffer(geometry.indexBuffer, 'uint16');
            renderPass.drawIndexed(geometry.indexCount);
          } else if (geometry.vertexBuffer) {
            renderPass.setVertexBuffer(0, geometry.vertexBuffer);
            renderPass.draw(geometry.vertexCount);
          }
        }

        // End render pass and submit
        renderPass.end();
        this.device.queue.submit([commandEncoder.finish()]);
      }
    };
  }
}
