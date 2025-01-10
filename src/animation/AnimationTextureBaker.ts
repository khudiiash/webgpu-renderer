interface AnimationChannel {
    sampler: number;
    target: {
        node: number;
        path: 'translation' | 'rotation' | 'scale' | 'weights';
    };
}

interface AnimationSampler {
    input: number;
    interpolation: 'LINEAR' | 'STEP' | 'CUBICSPLINE';
    output: number;
}

interface Animation {
    name?: string;
    channels: AnimationChannel[];
    samplers: AnimationSampler[];
}

interface AnimationTrack {
    name: string;
    times: Float32Array;
    values: Float32Array;
    getValue(time: number): void;
}

interface GLTFAnimation {
    name?: string;
    tracks: AnimationTrack[];
}

export class AnimationTextureBaker {
    static #instance: AnimationTextureBaker;
    private device!: GPUDevice;

    static init(device: GPUDevice) {
        const baker = new AnimationTextureBaker(device);
        return baker;
    }

    static getInstance() {
        if (!AnimationTextureBaker.#instance) {
            throw new Error('AnimationTextureBaker has not been initialized');
        }
        return AnimationTextureBaker.#instance;
    }

    constructor(device: GPUDevice) {
        if (AnimationTextureBaker.#instance) {
            return AnimationTextureBaker.#instance;
        }
        this.device = device;
        AnimationTextureBaker.#instance = this;
    }

    bakeAnimation(animation: GLTFAnimation, skeleton: any) {
        const frames = animation.tracks[0].times.length;
        const bones = skeleton.bones.length;
        
        // Create texture data array (4 components per matrix element)
        const textureData = new Float32Array(frames * bones * 16);
        
        // For each frame
        for (let f = 0; f < frames; f++) {
            // For each bone
            for (let b = 0; b < bones; b++) {
                const bone = skeleton.bones[b];
                const boneMatrix = bone.matrix;
                
                // Get bone transform at this frame
                animation.tracks.forEach(track => {
                    if (track.name.startsWith(bone.name)) {
                        track.getValue(animation.tracks[0].times[f]);
                    }
                });
                // Store matrix in texture data
                const offset = (f * bones + b) * 16;
                textureData.set(boneMatrix.elements, offset);
            }
        }
        
        // Create GPU texture
        const texture = this.device.createTexture({
            size: [bones * 4, frames, 1],
            format: 'rgba32float',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        
        // Write data to texture
        this.device.queue.writeTexture(
            { texture },
            textureData,
            { bytesPerRow: bones * 4 * 4 },
            { width: bones * 4, height: frames }
        );
        
        return texture;
    }
}