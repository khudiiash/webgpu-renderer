import { RenderPass } from "../RenderPass";
import { BindGroupLayout } from "@/data/BindGroupLayout";
import { Binding } from "@/data/Binding";
import { UniformData } from "@/data/UniformData";
import { Struct } from "@/data/Struct";
import { Shader, ShaderConfig } from "@/materials/shaders/Shader";
import { Vector2, Vector3, Vector4 } from "@/math";

export type CascadeInfo = {
  spacing: Vector2;
  grid: Vector2;
  scale: number;
  offset: number;
};

export class ProbeAllocationPass extends RenderPass {
  static CASCADE_COUNT = 1;
  probeBuffer!: GPUBuffer;
  layouts: BindGroupLayout[] = [];
  workgroupSize: number[] = [8, 8, 1];
  probeGridUniform!: UniformData;
  probeConfig!: UniformData;
  resolution: Vector2 = new Vector2(1, 1);
  base_spacing: Vector2 = new Vector2(2, 2);
  one_over_size: Vector2 = new Vector2(1, 1);
  base_ray_count: number = 4;
  base_radius: number = 4;
  cascade_count: number = ProbeAllocationPass.CASCADE_COUNT;
  declare pipeline: GPUComputePipeline;
  cascadeConfig!: GPUBuffer;

  init(): this {
    // Create buffer for probe positions
    const device = this.renderer.device;
    this.renderer.on("resize", this.onResize.bind(this));

    const layout = new BindGroupLayout(device, "ProbeAllocation", "Global", [
      new Binding("PositionTexture").texture().visibility("compute").var("g_position", "texture_2d<f32>"),
      new Binding("NormalTexture").texture().visibility("compute").var("g_normal", "texture_2d<f32>"),
      new Binding("AlbedoTexture").texture().visibility("compute").var("g_albedo", "texture_2d<f32>"),
      new Binding("DistanceTexture").texture().visibility("compute").var("g_distance", "texture_2d<f32>"),
      new Binding("ProbeBuffer").storage("read_write").visibility("compute").var("probes", "array<Probe>"),
      new Binding("ProbeConfig").uniform().visibility("compute").var("config", "ProbeConfig"),
      new Binding("Camera").uniform().visibility("compute").var("camera", "Camera"),
    ]);

    this.layouts = [layout];

    this.probeConfig = new UniformData(this, {
      name: "ProbeConfig",
      isGlobal: true,
      struct: new Struct("ProbeConfig", {
        resolution: "vec2u",
        one_over_size: "vec2f",
        base_spacing: "vec2u",
        base_ray_count: "u32",
        base_radius: "f32",
        cascade_count: "u32",
      }),
      values: {
        resolution: this.resolution,
        one_over_size: this.one_over_size,
        base_spacing: this.base_spacing,
        base_ray_count: this.base_ray_count,
        base_radius: this.base_radius,
        cascade_count: this.cascade_count,
      },
    });

    const struct = new Struct("Probe", {
      radiance: "vec3f",
      position: "vec2f",
      radius: "f32",
      ray_count: "u32",
    });

    const cascadeStruct = new Struct("Cascade", {
      spacing: "vec2u",
      grid: "vec2u",
      scale: "u32",
      offset: "u32",
      _padding: "vec2u",
    });

    const shader = new Shader({
      name: "Probes",
      layouts: this.layouts,
      compute: `
                ${struct.toWGSL()}

                fn ipow2(exp: u32) -> u32 {
                    var result: u32 = 1u;
                    for (var i: u32 = 0u; i < exp; i = i + 1u) {
                        result = result * 2u;
                    }
                    return result;
                }

                fn ipow4(exp: u32) -> u32 {
                    var result: u32 = 1u;
                    for (var i: u32 = 0u; i < exp; i = i + 1u) {
                        result = result * 4u;
                    }
                    return result;
                }

fn calculateRadiance(coords: vec2<i32>, radius: f32, ray_count: u32) -> vec3<f32> {
    var radiance: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
    let flipped = vec2f(vec2i(coords.x, i32(config.resolution.y) - coords.y));
    let center: vec2<f32> = vec2<f32>(flipped);

    let stepCount: u32 = 16u;
    let stepSize: f32 = radius / f32(stepCount);

    for (var i: u32 = 0u; i < ray_count; i = i + 1u) {
        let angle: f32 = 6.28318530718 * (f32(i) / f32(ray_count));
        let dir: vec2<f32> = vec2<f32>(cos(angle), sin(angle));
        let stepSize = radius / f32(stepCount);
        var t: f32 = 0.0;

        for (var j: u32 = 1u; j <= 32u; j = j + 1u) {
            t = f32(j) * stepSize;
            let samplePos: vec2<f32> = center + dir * t;
            let ipos: vec2<i32> = vec2<i32>(samplePos);
            let pixel: vec4<f32> = textureLoad(g_albedo, ipos, 0);
            if (pixel.a > 0.0) {
                radiance = radiance + pixel.rgb;
            }
        }
    }
    return radiance;
}


                @compute(input) @workgroup_size(8, 8, 1) {
                    let global_id = input.global_invocation_id;

                    let cascade: u32 = global_id.z;
                    if (cascade >= config.cascade_count) {
                        return;
                    }

                    // Compute per-cascade scale factor: scale = 4^cascade.
                    let scale: u32 = ipow4(cascade);

                    // Compute spacing for this cascade.
                    let spacing: vec2u = config.base_spacing * vec2<u32>(scale, scale);

                    // Compute grid dimensions from resolution & spacing. Using ceiling division.
                    let gridX: u32 = (config.resolution.x + spacing.x) / spacing.x;
                    let gridY: u32 = (config.resolution.y + spacing.y) / spacing.y;

                    if (global_id.x >= gridX || global_id.y >= gridY) {
                        return;
                    }

                    // Compute the starting offset for this cascade by summing counts for all lower cascades.
                    var offset: u32 = 0u;
                    for (var c: u32 = 0u; c < cascade; c = c + 1u) {
                        let scale_c: u32 = ipow4(c);
                        let spacing_c: vec2<u32> = config.base_spacing * vec2<u32>(scale_c, scale_c);
                        let gridX_c: u32 = (config.resolution.x + spacing_c.x - 1u) / spacing_c.x;
                        let gridY_c: u32 = (config.resolution.y + spacing_c.y - 1u) / spacing_c.y;
                        offset = offset + (gridX_c * gridY_c);
                    }

                    // Calculate the index for this probe in the current cascade.
                    let probeIndex: u32 = offset + (global_id.y * gridX + global_id.x);

                    // Calculate the probes center position.
                    let halfSpacing: vec2f = vec2f(spacing - vec2u(1)) * 0.5;
                    var coords = vec2f(
                        (f32(global_id.x) + 0.5) * f32(spacing.x) + halfSpacing.x - (f32(cascade) * (halfSpacing.x / f32(gridX)) * 0.5),
                        (f32(global_id.y) + 0.5) * f32(spacing.y)
                    );
                    //coords.y = f32(config.resolution.y) - coords.y;
                    let uv = coords * config.one_over_size;

                    let ray_count: u32 = config.base_ray_count * scale;
                    let radius = config.base_radius * f32(scale);

                    let radiance = calculateRadiance(vec2i(coords), radius, ray_count);

                    // Set the probe information.
                    probes[probeIndex] = Probe(
                        radiance,
                        uv,
                        radius,
                        ray_count,
                    );
                }

            `,
    });

    const pipelineLayout = this.pipelines.createPipelineLayout(this.layouts);
    this.pipeline = this.pipelines.createComputePipeline({
      shader,
      layout: pipelineLayout,
    }) as GPUComputePipeline;

    return this;
  }

  async debugProbes() {
    const device = this.renderer.device;
    const probeBuffer = this.probeBuffer;

    // Wait for any pending GPU work
    await device.queue.onSubmittedWorkDone();

    // Create staging buffer for reading
    const stagingBuffer = device.createBuffer({
      size: probeBuffer.size,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

    // Copy to staging buffer
    const encoder = device.createCommandEncoder();
    encoder.copyBufferToBuffer(probeBuffer, 0, stagingBuffer, 0, probeBuffer.size);
    device.queue.submit([encoder.finish()]);

    // Wait for copy to complete
    await device.queue.onSubmittedWorkDone();

    // Map and read buffer
    await stagingBuffer.mapAsync(GPUMapMode.READ);
    const data = new Float32Array(stagingBuffer.getMappedRange());

    console.log("Buffer size:", data.length);
    console.log("First few values:", data.slice(0, 128));

    // Cleanup
    stagingBuffer.unmap();
    stagingBuffer.destroy();
  }

  private onResize() {
    this.bindGroup = this.createBindGroup();
  }

  private calculateCascadeConfig(): CascadeInfo[] {
    const result: CascadeInfo[] = [];

    for (let i = 0; i < this.cascade_count; i++) {
      const scale = Math.pow(4, i);
      const spacing = this.base_spacing.clone().scale(scale);
      const gridX = Math.ceil(this.resolution.x / spacing.x);
      const gridY = Math.ceil(this.resolution.y / spacing.y);

      let offset = 0;

      if (i > 0) {
        const prev = result[i - 1];
        const size = prev.grid.x * prev.grid.y;
        offset = prev.offset + size;
      }
      result.push({
        scale,
        spacing,
        grid: new Vector2(gridX, gridY),
        offset: offset,
      });
    }

    return result;
  }

  private calculateMaxProbesCount(): number {
    let totalProbes = 0;
    for (let i = 0; i < this.cascade_count; i++) {
      const scale = Math.pow(4, i);
      const spacing = this.base_spacing.clone().scale(scale);
      const gridX = Math.ceil(this.resolution.x / spacing.x);
      const gridY = Math.ceil(this.resolution.y / spacing.y);
      totalProbes += gridX * gridY;
    }

    return totalProbes;
  }

  private createCascadeConfig() {
    const config = this.calculateCascadeConfig();
    const struct = Struct.get("Cascade")!;

    const cascadeConfigBuffer = this.device.createBuffer({
      label: "CascadeConfig",
      size: this.cascade_count * struct.size,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const alignment = struct.getAlignment();
    const bufferArray = new ArrayBuffer(this.cascade_count * struct.size);
    const view = new Uint32Array(bufferArray);

    const stride = struct.size / 4;
    for (let i = 0; i < this.cascade_count; i++) {
      const cascadeInfo = config[i];
      view[i * stride + 0] = cascadeInfo.spacing.x;
      view[i * stride + 1] = cascadeInfo.spacing.y;
      view[i * stride + 2] = cascadeInfo.grid.x;
      view[i * stride + 3] = cascadeInfo.grid.y;
      view[i * stride + 4] = cascadeInfo.scale;
      view[i * stride + 5] = cascadeInfo.offset;
    }

    this.device.queue.writeBuffer(cascadeConfigBuffer, 0, bufferArray);

    this.cascadeConfig = cascadeConfigBuffer;
  }

  private createBindGroup() {
    this.resolution.set(this.renderer.width, this.renderer.height);
    this.one_over_size.set(1 / this.resolution.x, 1 / this.resolution.y);
    const maxProbes = this.calculateMaxProbesCount();
    const probeStruct = Struct.get("Probe")!;
    this.createCascadeConfig();
    this.probeBuffer = this.renderer.device.createBuffer({
      label: "Probe Buffer",
      size: maxProbes * probeStruct.size,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    });

    return this.renderer.resources.createBindGroup(this.layouts[0], {
      PositionTexture: this.inputs.get("position_texture") as GPUTexture,
      NormalTexture: this.inputs.get("normal_texture") as GPUTexture,
      AlbedoTexture: this.inputs.get("albedo_texture") as GPUTexture,
      DistanceTexture: this.inputs.get("distance_texture") as GPUTexture,
      ProbeBuffer: this.probeBuffer,
      ProbeConfig: this.probeConfig,
      Camera: UniformData.getByName("Camera")!,
    });
  }

  public afterRender(): this {
    return this;
  }

  public beforeRender(): this {
    return this;
  }

  async execute(encoder: GPUCommandEncoder): this {
    if (!this.bindGroup) {
      this.bindGroup = this.createBindGroup();
    }
    this.bindGroup = this.renderer.resources.createBindGroup(this.layouts[0], {
      PositionTexture: this.inputs.get("position_texture") as GPUTexture,
      NormalTexture: this.inputs.get("normal_texture") as GPUTexture,
      AlbedoTexture: this.inputs.get("albedo_texture") as GPUTexture,
      DistanceTexture: this.inputs.get("distance_texture") as GPUTexture,
      ProbeBuffer: this.probeBuffer,
      ProbeConfig: this.probeConfig,
      Camera: UniformData.getByName("Camera")!,
    });
    this.resolution.set(this.renderer.width, this.renderer.height);
    this.one_over_size.set(1 / this.resolution.x, 1 / this.resolution.y);

    let maxGridX = 0;
    let maxGridY = 0;
    for (let cascade = 0; cascade < this.cascade_count; cascade++) {
      const scale = Math.pow(4, cascade); // assume it is 1
      const spacingX = this.base_spacing.x * scale; // if spacing is 256x256, then it is 256
      const spacingY = this.base_spacing.y * scale; // if spacing is 256x256, then it is 256
      const gridX = Math.floor(this.resolution.x / spacingX); // if resolution is 1024x1024, then it is 4
      const gridY = Math.floor(this.resolution.y / spacingY); // if resolution is 1024x1024, then it is 4
      maxGridX = Math.max(maxGridX, gridX); // if gridX is 4, then it is 4
      maxGridY = Math.max(maxGridY, gridY); // if gridY is 4, then it is 4
    }

    const workgroupCountX = Math.ceil(maxGridX / this.workgroupSize[0]);
    const workgroupCountY = Math.ceil(maxGridY / this.workgroupSize[1]);
    const workgroupCountZ = this.cascade_count;

    const pass = encoder.beginComputePass();
    pass.setPipeline(this.pipeline as GPUComputePipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.dispatchWorkgroups(workgroupCountX, workgroupCountY, workgroupCountZ);
    pass.end();

    for (const [key, value] of this.inputs.entries()) {
      this.outputs.set(key, value);
    }

    this.outputs.set("probe_buffer", this.probeBuffer);
    this.outputs.set("cascade_config", this.cascadeConfig);
    //await this.debugProbes();
    return this;
  }
}
