export interface TextureDesc {
    name: string;
    format: GPUTextureFormat;
    width: number;
    height: number;
    usage: GPUTextureUsageFlags;
    sampleCount?: number;
}
