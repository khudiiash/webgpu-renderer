import { RenderPass } from '../RenderPass';
import { Renderer } from '@/renderer/Renderer';
import { Scene } from '@/core/Scene';
import { Camera } from '@/camera/Camera';
import { Shader, ShaderChunk, ShaderConfig } from '@/materials/shaders';
import { BindGroupLayout } from '@/data/BindGroupLayout';
import { Binding } from '@/data/Binding';
import { PipelineManager } from '@/engine/PipelineManager';
import { ResourceManager } from '@/engine/ResourceManager';
import { UniformData } from '@/data';

export class ShadingPass extends RenderPass {
    private pipeline!: GPURenderPipeline;
    private pipelines!: PipelineManager;
    private resources!: ResourceManager;
    private renderPassDescriptor!: GPURenderPassDescriptor;
    layouts!: BindGroupLayout[];
    bindGroup: any;

    constructor(renderer: Renderer) {
        super(renderer);
        this.pipelines = renderer.pipelines;
        this.resources = renderer.resources;
        this.init();
    }

    public init(): void {
        // Create shader modules for a fullscreen quad
        const device = this.renderer.device;


        const layout = new BindGroupLayout(device, 'Shading', 'Global', [
            new Binding('Scene').uniform().visibility('fragment').var('scene', 'Scene'),
            new Binding('Camera').uniform().visibility('fragment').var('camera', 'Camera'),
            new Binding('Position').texture().var('position', 'texture_2d<f32>'),
            new Binding('Color').texture().var('color', 'texture_2d<f32>'),
            new Binding('Normal').texture().var('normal', 'texture_2d<f32>'),
            new Binding('Depth').texture({ sampleType: 'depth' }).var('depth', 'texture_depth_2d'),
            new Binding('SamplerColor').sampler().var('sampler_color', 'sampler'),
            new Binding('SamplerDepth').sampler({ type: 'comparison' }).var('sampler_depth', 'sampler_comparison'),
        ]);


        this.layouts = [layout];
        new ShaderChunk('Shading', `
            @group(Global) @binding(Scene)
            @group(Global) @binding(Camera)
            @group(Global) @binding(Position)
            @group(Global) @binding(Color)
            @group(Global) @binding(Normal)
            @group(Global) @binding(Depth)
            @group(Global) @binding(SamplerColor)
            @group(Global) @binding(SamplerDepth)

            // Bilateral filter for denoising
            fn bilateral_weight(p1: vec3f, p2: vec3f, n1: vec3f, n2: vec3f) -> f32 {
                let p_dist = length(p1 - p2);
                let n_dist = 1.0 - max(dot(n1, n2), 0.0);
                return exp(-p_dist * 10.0) * exp(-n_dist * 5.0);
            }

            fn random2(p: vec2f) -> vec2f {
                return fract(sin(vec2f(
                    dot(p, vec2f(127.1, 311.7)),
                    dot(p, vec2f(269.5, 183.3))
                )) * 43758.5453);
            }

            @fragment() {{
                let uv = input.uv;
                let baseColor = textureSample(color, sampler_color, uv);
                let worldNormal = textureSample(normal, sampler_color, uv).xyz;
                let worldPos = textureSample(position, sampler_color, uv);
                let depth = worldPos.w;

                const SAMPLES = 8u;
                const RADIUS = 2.0;
                const INTENSITY = 2.0;

                var lighting = vec3f(0.0);
                var indirect = vec3f(0.0);
                var ambient = 0.1;

                // Direct lighting - Directional lights
                for (var i = 0u; i < scene.directionalLightsNum; i++) {
                    let light = scene.directionalLights[i];
                    let lightDir = -light.direction;
                    let NdotL = dot(worldNormal, lightDir);
                    let diffuse = max(NdotL, 0.0);
                    let viewDir = normalize(camera.position - worldPos.xyz);
                    let reflectDir = reflect(-lightDir, worldNormal);
                    let specular = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
                    let lightColor = light.color.rgb * light.intensity;
                    lighting += lightColor * (diffuse + specular);
                }

                // Point lights
                for (var i = 0u; i < scene.pointLightsNum; i++) {
                    let light = scene.pointLights[i];
                    let lightVec = light.position - worldPos.xyz;
                    let distance = length(lightVec);
                    let lightDir = lightVec / distance;
                    
                    // Attenuation
                    let attenuation = 1.0 / (1.0 + light.decay * distance + light.decay * distance * distance);
                    
                    let NdotL = dot(worldNormal, lightDir);
                    let diffuse = max(NdotL, 0.0);
                    let viewDir = normalize(camera.position - worldPos.xyz);
                    let reflectDir = reflect(-lightDir, worldNormal);
                    let specular = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
                    let lightColor = light.color.rgb * light.intensity * attenuation;
                    lighting += lightColor * (diffuse + specular);
                }

                // Screen space global illumination
                for (var i = 0u; i < SAMPLES; i++) {
                    let rand = random2(uv + vec2f(f32(i)));
                    let angle = rand.x * 2.0 * 3.14159;
                    let radius = rand.y * RADIUS;
                    
                    let offset = vec2f(cos(angle), sin(angle)) * radius;
                    let sampleUV = uv + offset;
                    
                    let sampleWorldPos = textureSample(position, sampler_color, sampleUV);
                    let sampleWorldNormal = textureSample(normal, sampler_color, sampleUV).xyz;
                    let sampleColor = textureSample(color, sampler_color, sampleUV).rgb;
                    
                    let diff = sampleWorldPos.xyz - worldPos.xyz;
                    let distance = length(diff);
                    let normalDiff = max(dot(worldNormal, normalize(diff)), 0.0);
                    
                    let occlusion = (1.0 - smoothstep(0.0, RADIUS, distance)) * normalDiff;
                    indirect += sampleColor * occlusion;
                }

                indirect *= (INTENSITY / f32(SAMPLES));

                let finalColor = baseColor.rgb * (lighting + indirect);
                output.color = vec4f(finalColor, 1.0);
            }}
        `);

        const shaderConfig: ShaderConfig = {
            name: 'Shading',
            chunks: ['Quad', 'Shading'],
            layouts: this.layouts,
            varyings: [
                { name: 'uv', type: 'vec2f', location: 0 },
            ]
        };

        const shader = new Shader(shaderConfig);

        // Create pipeline layout
        const pipelineLayout = this.pipelines.createPipelineLayout(this.layouts);
        this.pipeline = this.pipelines.createRenderPipeline({
            shader,
            layout: pipelineLayout,
            targets: [
                { format: this.renderer.format },
            ]
        });
    }

    createBindGroup() {
        this.bindGroup = this.resources.createBindGroup(this.layouts[0], {
            Camera: UniformData.getByName('Camera')!,
            Scene: UniformData.getByName('Scene')!,
            Position: this.inputs[0],
            Color: this.inputs[1],
            Normal: this.inputs[2],
            Depth: this.inputs[3],
            SamplerColor: this.resources.getOrCreateSampler({}),
            SamplerDepth: this.resources.getOrCreateSampler({ compare: 'less' }),
        })
    }

    /**
     * Render a fullscreen quad using the color texture produced in the GeometryPass.
     */
    public execute(_: Scene, __: Camera, commandEncoder: GPUCommandEncoder): void {
        // Assume the second texture (index 1) of previous pass is our colorTexture.
        const colorTexture = this.inputs[1];
        if (!colorTexture) {
            console.warn('ShadingPass: No color texture found in inputs.');
            return;
        }

        if (!this.bindGroup) {
            this.createBindGroup();

        }

        this.renderPassDescriptor = {
            label: 'ShadingPass',
            colorAttachments: [
                {
                    view: this.renderer.context.getCurrentTexture().createView(),
                    clearValue: [0, 0, 0, 1],
                    loadOp: 'clear',
                    storeOp: 'store'
                },
            ],
        };

        const pass = commandEncoder.beginRenderPass(this.renderPassDescriptor);
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.draw(6);
        pass.end();
    }
}