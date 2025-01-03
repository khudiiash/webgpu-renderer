class ClusteredRenderFeature extends RenderFeature {
    constructor(device, pipelineManager, resourceManager) {
        super('ClusteredRender', device, pipelineManager, resourceManager);
        
        // Cluster configuration
        this.CLUSTER_PIXELS_X = 32;    // Tile size X
        this.CLUSTER_PIXELS_Y = 32;    // Tile size Y
        this.CLUSTERS_Z = 32;          // Number of depth slices
        this.maxLightsPerCluster = 100;

        // Required resources
        this.requiredResources.add('depthBuffer');
        this.requiredResources.add('clusterBuffer');        // Stores cluster data
        this.requiredResources.add('lightAssignmentBuffer'); // Light assignments per cluster
        this.requiredResources.add('lightDataBuffer');      // Light properties
        this.requiredResources.add('finalOutput');

        // Compute shader for cluster assignment
        this.clusterAssignmentShader = `
            struct ClusterData {
                minPoint: vec4<f32>,
                maxPoint: vec4<f32>,
                lightCount: u32,
                lightOffset: u32,
            };

            struct Cluster {
                data: array<ClusterData>,
            };

            @group(0) @binding(0) var<storage, read_write> clusters: Cluster;
            @group(0) @binding(1) var depthTexture: texture_depth_2d;
            @group(0) @binding(2) var<uniform> camera: CameraData;

            @compute @workgroup_size(8, 8, 1)
            fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
                // Calculate cluster indices
                let clusterX = GlobalInvocationID.x;
                let clusterY = GlobalInvocationID.y;
                let screenWidth = textureDimensions(depthTexture).x;
                let screenHeight = textureDimensions(depthTexture).y;

                // Calculate screen-space bounds
                let minX = f32(clusterX * CLUSTER_PIXELS_X);
                let minY = f32(clusterY * CLUSTER_PIXELS_Y);
                let maxX = min(minX + f32(CLUSTER_PIXELS_X), f32(screenWidth));
                let maxY = min(minY + f32(CLUSTER_PIXELS_Y), f32(screenHeight));

                // Calculate view-space bounds for each Z slice
                for (var z = 0u; z < CLUSTERS_Z; z++) {
                    let clusterIndex = (clusterY * numClustersX + clusterX) * CLUSTERS_Z + z;
                    
                    // Calculate depth bounds for this slice
                    let minZ = linearizeDepth(camera.nearClip * pow(camera.farClip / camera.nearClip, f32(z) / f32(CLUSTERS_Z)));
                    let maxZ = linearizeDepth(camera.nearClip * pow(camera.farClip / camera.nearClip, f32(z + 1u) / f32(CLUSTERS_Z)));

                    // Calculate frustum corners in view space
                    let corners = calculateFrustumCorners(
                        vec2<f32>(minX, minY),
                        vec2<f32>(maxX, maxY),
                        minZ,
                        maxZ,
                        camera.projection
                    );

                    // Store cluster bounds
                    clusters.data[clusterIndex].minPoint = vec4<f32>(corners.min, 1.0);
                    clusters.data[clusterIndex].maxPoint = vec4<f32>(corners.max, 1.0);
                    clusters.data[clusterIndex].lightCount = 0u;
                    clusters.data[clusterIndex].lightOffset = 0u;
                }
            }`;

        // Compute shader for light assignment
        this.lightAssignmentShader = `
            @compute @workgroup_size(64, 1, 1)
            fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
                let lightIndex = GlobalInvocationID.x;
                if (lightIndex >= numLights) { return; }

                let light = lights.data[lightIndex];
                var intersectedClusters: array<u32>;
                var intersectedCount = 0u;

                // Test light against all clusters
                for (var i = 0u; i < totalClusters; i++) {
                    if (sphereIntersectsAABB(light.position, light.radius, 
                        clusters.data[i].minPoint.xyz, 
                        clusters.data[i].maxPoint.xyz)) {
                        
                        // Add light to cluster's light list
                        let offset = atomicAdd(&clusters.data[i].lightCount, 1u);
                        if (offset < maxLightsPerCluster) {
                            lightAssignment.data[i * maxLightsPerCluster + offset] = lightIndex;
                        }
                    }
                }
            }`;

        // Fragment shader utilizing clusters
        this.fragmentShader = `
            @fragment
            fn main(input: VertexOutput) -> @location(0) vec4<f32> {
                // Calculate cluster index for current fragment
                let cluster = getClusterIndex(input.position, input.linearDepth);
                
                var finalColor = vec3<f32>(0.0);
                let clusterData = clusters.data[cluster];
                
                // Process only lights in this cluster
                for (var i = 0u; i < clusterData.lightCount; i++) {
                    let lightIndex = lightAssignment.data[cluster * maxLightsPerCluster + i];
                    let light = lights.data[lightIndex];
                    
                    finalColor += calculateLighting(input, light);
                }
                
                return vec4<f32>(finalColor, 1.0);
            }`;
    }

    setup(renderGraph) {
        // Create buffers for cluster data
        this.createClusterBuffers();

        // Add cluster assignment pass
        renderGraph.addPass({
            name: 'ClusterAssignment',
            inputs: ['depthBuffer'],
            outputs: ['clusterBuffer'],
            execute: (encoder, resources) => {
                const computePass = encoder.beginComputePass();
                computePass.setPipeline(this.clusterAssignmentPipeline);
                computePass.dispatchWorkgroups(
                    Math.ceil(this.width / this.CLUSTER_PIXELS_X),
                    Math.ceil(this.height / this.CLUSTER_PIXELS_Y),
                    1
                );
                computePass.end();
            }
        });

        // Add light assignment pass
        renderGraph.addPass({
            name: 'LightAssignment',
            inputs: ['clusterBuffer'],
            outputs: ['lightAssignmentBuffer'],
            execute: (encoder, resources) => {
                const computePass = encoder.beginComputePass();
                computePass.setPipeline(this.lightAssignmentPipeline);
                computePass.dispatchWorkgroups(
                    Math.ceil(this.numLights / 64),
                    1,
                    1
                );
                computePass.end();
            }
        });

        // Add main render pass
        renderGraph.addPass({
            name: 'ClusteredRendering',
            inputs: ['clusterBuffer', 'lightAssignmentBuffer', 'depthBuffer'],
            outputs: ['finalOutput'],
            execute: (encoder, resources) => {
                // Render scene using clustered lighting
                const renderPass = encoder.beginRenderPass({
                    colorAttachments: [{
                        view: resources.finalOutput.createView(),
                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                        loadOp: 'clear',
                        storeOp: 'store'
                    }],
                    depthStencilAttachment: {
                        view: resources.depthBuffer.createView(),
                        depthClearValue: 1.0,
                        depthLoadOp: 'load',
                        depthStoreOp: 'store'
                    }
                });

                // Render objects using clustered lighting
                this.renderObjects(renderPass);
                renderPass.end();
            }
        });
    }

    createClusterBuffers() {
        const numClustersX = Math.ceil(this.width / this.CLUSTER_PIXELS_X);
        const numClustersY = Math.ceil(this.height / this.CLUSTER_PIXELS_Y);
        const totalClusters = numClustersX * numClustersY * this.CLUSTERS_Z;

        // Create buffer for cluster data
        // this.clusterBuffer = this.device.createBuffer({
        //     size: totalClusters * 32, // size of ClusterData struct
        //     usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        // });

        this.clusterBuffer = this.resourceManager.createBuffer('clusterBuffer', {
            size: totalClusters * 32, // size of ClusterData struct
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });

        // Create buffer for light assignments
        // this.lightAssignmentBuffer = this.device.createBuffer({
        //     size: totalClusters * this.maxLightsPerCluster * 4,
        //     usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        // });
    
        this.lightAssignmentBuffer = this.resourceManager.createBuffer('lightAssignmentBuffer', {
            size: totalClusters * this.maxLightsPerCluster * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
    }
}