import { RenderPass } from '../RenderPass';
import { Scene } from '@/core/Scene';
import { Camera } from '@/camera/Camera';
import { Object3D } from '@/core/Object3D';
import { Mesh } from '@/core/Mesh';
import { Renderable } from '../Renderable';
import { BindGroupLayout } from '@/data/BindGroupLayout';
import { Shader } from '@/materials/shaders/Shader';
import { ShaderChunk, ShaderConfig } from '@/materials/shaders';
import { Binding } from '@/data/Binding';
import { StandardMaterial } from '@/materials/StandardMaterial';

export class GeometryPass extends RenderPass {
    private positionTexture!: GPUTexture;
    private albedoTexture!: GPUTexture;
    private normalTexture!: GPUTexture;
    private depthTexture!: GPUTexture;
    private renderables: WeakMap<Mesh, Renderable> = new WeakMap();
    private renderPassDescriptor!: GPURenderPassDescriptor;
    public width: number = 1;
    public height: number = 1;

    init(): this {
        this.width = this.renderer.width;
        this.height = this.renderer.height;
        this.positionTexture = this.resources.createTexture('position_texture', { size: { width: this.width, height: this.height }, format: 'rgba16float', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT });
        this.albedoTexture = this.resources.createTexture('albedo_texture', { size: { width: this.width, height: this.height }, format: 'rgba16float', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT });
        this.normalTexture = this.resources.createTexture('normal_texture', { size: { width: this.width, height: this.height }, format: 'rgba16float', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT });
        this.depthTexture = this.resources.createTexture('depth_texture', { size: { width: this.width, height: this.height }, format: 'depth32float', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT });
        this.outputs = new Map([
            ['position_texture', this.positionTexture],
            ['albedo_texture', this.albedoTexture],
            ['normal_texture', this.normalTexture],
            ['depth_texture', this.depthTexture]
        ]);

        this.renderPassDescriptor = {
            colorAttachments: [
                {
                    view: this.positionTexture.createView(),
                    clearValue: [0, 0, 0, 0],
                    loadOp: 'clear',
                    storeOp: 'store'
                },
                {
                    view: this.albedoTexture.createView(),
                    clearValue: [0, 0, 0, 0],
                    loadOp: 'clear',
                    storeOp: 'store'
                },
                {
                    view: this.normalTexture.createView(),
                    clearValue: [0, 0, 0, 0],
                    loadOp: 'clear',
                    storeOp: 'store'
                }
              ],
              depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store'
              }
        };

        const geometryLayout = new BindGroupLayout(this.renderer.device, 'GeometryPass', 'Material', [
            new Binding('Diffuse').uniform().visibility('fragment').var('diffuse', 'vec4f'),
            new Binding('Emissive').uniform().visibility('fragment').var('emissive', 'vec4f'),
            new Binding('PositionMap').texture().var('position_map', 'texture_2d<f32>'),
            new Binding('DiffuseMap').texture().var('diffuse_map', 'texture_2d<f32>'),
            new Binding('NormalMap').texture().var('normal_map', 'texture_2d<f32>'),

            new Binding('DiffuseMapSampler').sampler().var('diffuse_map_sampler', 'sampler'),
            new Binding('NormalMapSampler').sampler().var('normal_map_sampler', 'sampler'),
        ]);

        this.layouts = [
            this.pipelines.getBindGroupLayoutDescriptor('Global'),
            this.pipelines.getBindGroupLayoutDescriptor('Mesh'),
            geometryLayout
        ]

        new ShaderChunk('GBuffer', `
            @fragment() {{
                var albedo = diffuse.rgb;
                var normal = input.normal;
                var position = input.position;

                if (textureDimensions(diffuse_map).x > 1) {
                    let diffuseSample = textureSample(diffuse_map, diffuse_map_sampler, input.uv);
                    albedo = diffuseSample.rgb;
                    if (diffuseSample.a < 0.5) {
                        discard;
                    }
                }

                let dist = distance(input.uv, vec2(0.5));
                if (dist > 0.5) {
                    discard;
                }

                // if (textureDimensions(normal_map).x > 1) {
                //     var normalSample = textureSample(normal_map, normal_map_sampler, input.uv).rgb;
                //     normalSample.g = 1.0 - normalSample.g;
                //     normal = normalize(normalSample * 2.0 - 1.0); // in tangent space
                //  }
                output.position = vec4f(position, input.depth);
                output.albedo = vec4f(albedo, emissive.a);
                output.normal = vec4f(normal, 0.0);
            }}
        `);

        return this;
    }

    createRenderable(mesh: Mesh) {
        const material = mesh.material as StandardMaterial;
        const config: ShaderConfig = {
            name: 'GeometryPassShader',
            defines: {
                USE_UV: mesh.geometry.hasAttribute('uv'),
                USE_NORMAL: mesh.geometry.hasAttribute('normal'),
                USE_BILLBOARD: mesh.useBillboard,
                USE_DEPTH: true,
            },
            attributes: mesh.geometry.getShaderAttributes(),
            varyings: [
                { name: 'position', type: 'vec3f', location: 0 },
                { name: 'normal', type: 'vec3f', location: 1 },
                { name: 'uv', type: 'vec2f', location: 2 },
                { name: 'depth', type: 'f32', location: 3 },
            ],
            layouts: this.layouts,
            chunks: ['Mesh', 'GBuffer'],
            outputs: [
                { name: 'position', type: 'vec4f', location: 0 },
                { name: 'albedo', type: 'vec4f', location: 1 },
                { name: 'normal', type: 'vec4f', location: 2 },
            ]
        };
        const shader = new Shader(config);

        const bindGroups = [
            this.resources.createBindGroup(this.layouts[0]),
            this.resources.createBindGroup(this.layouts[1], { 
                MeshInstances: mesh.uniforms.get('MeshInstances')! 
            }),
            this.resources.createBindGroup(this.layouts[2], {
                Diffuse: material.diffuse,
                Emissive: material.emissive,
                DiffuseMap: material.diffuse_map,
                NormalMap: material.normal_map,
                DiffuseMapSampler: this.resources.getOrCreateSampler({}),
                NormalMapSampler: this.resources.getOrCreateSampler({}),
            })
        ]
        const pipelineLayout = this.pipelines.createPipelineLayout(this.layouts);
        const pipeline = this.pipelines.createRenderPipeline({
            shader,
            layout: pipelineLayout,
            vertexLayouts: mesh.geometry.getVertexAttributesLayout(),
            renderState: mesh.material.renderState,
            targets: [
                { format: 'rgba16float' },
                { format: 'rgba16float' },
                { format: 'rgba16float' },
            ]
        });
        const renderable = new Renderable(mesh);
        renderable.savePassData(this, { pipeline, bindGroups });
        this.renderables.set(mesh, renderable);
        return renderable;
    }

    draw(object: Object3D, camera: Camera, pass: GPURenderPassEncoder) {
        if (object instanceof Mesh) {
            let renderable = this.renderables.get(object) || this.createRenderable(object);
            renderable.applyPassData(this);
            renderable.render(pass);
        }

        for (let child of object.children) {
            this.draw(child, camera, pass);
        }
    }

    public execute(encoder: GPUCommandEncoder, scene: Scene, camera: Camera): this {
        const pass = encoder.beginRenderPass(this.renderPassDescriptor);
        this.draw(scene, camera, pass);
        pass.end();
        return this;
    }
}
