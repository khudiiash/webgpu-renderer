import { Color } from '@/math/Color';
import { ShaderLibrary } from './shaders';
import { ObjectMonitor } from '@/data/ObjectMonitor';
import { StandardMaterial, StandardMaterialOptions } from './StandardMaterial';
import { Vector2 } from '@/math/Vector2';
import { Texture2D, UniformData } from '@/data';


interface GridMaterialOptions extends StandardMaterialOptions {
    baseColor?: number | string | Color;
    lineColor?: number | string | Color;
    cellSize?: number;
    lineWidth?: number;
    offset?: number;
    uvMode?: number;
}

export class GridMaterial extends StandardMaterial{
    constructor(options: GridMaterialOptions = {}) {
        super(options);


        this.uniforms = new UniformData(this, {
            name: 'material',
            isGlobal: false,
            values: {
                ambient: new Color(options.ambient),
                diffuse: new Color(options.diffuse),
                specular: new Color(options.specular),
				emissive: new Color(options.emissive),
                sheen: new Color(options.sheen),

                grid_base_color: new Color(options.baseColor || 0x111111),
                grid_line_color: new Color(options.lineColor || 0xffffff),
                grid_offset: options.offset || 0.5,
                grid_cell_size: options.cellSize || 1.0,
                grid_line_width: options.lineWidth || 0.01,
                grid_uv_mode: options.uvMode || 0,

                opacity: options.opacity || 1.0,
                metalness: options.metalness || 0.0,
                roughness: options.roughness || 0.5,
                emissive_factor: options.emissive_factor || 1.0,
                specular_factor: options.specular_factor || 1.0,
                alpha_test: options.alpha_test || 0.0,
                transmission: options.transmission || 0.0,


                diffuse_map: options.diffuse_map || Texture2D.DEFAULT,
            }
        });

        const config = ShaderLibrary.STANDARD;
        config.chunks = ['common', 'scene', 'camera', 'model', 'diffuse_map', 'grid_material', 'pbr', 'fog'];
        config.varyings.push({ name: 'vScale', type: 'vec3f' });
        config.name = 'grid';

        this.defines = new ObjectMonitor({
            USE_LIGHT: options.useLight ?? true,
            USE_SHADOW: options.useShadow ?? true,
            USE_FOG: options.useFog ?? true,
            USE_GAMMA: options.useGamma ?? true,
            USE_BILLBOARD: options.useBillboard ?? false,
        }).onChange(() => {
            this.createShader();
        });

        this.createShader(config);

    }
}