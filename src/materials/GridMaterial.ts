import { Color } from '@/math/Color';
import { ShaderLibrary } from './shaders';
import { StandardMaterial, StandardMaterialOptions } from './StandardMaterial';
import { UniformData } from '@/data';
import { Struct } from '@/data/Struct';


interface GridMaterialOptions extends StandardMaterialOptions {
    baseColor?: number | string | Color;
    lineColor?: number | string | Color;
    cellSize?: number;
    lineWidth?: number;
    offset?: number;
    uvMode?: number;
}

export class GridMaterial extends StandardMaterial{
    static struct = new Struct('GridMaterial', {
        ...StandardMaterial.struct.members,
        grid_base_color: 'vec4f',
        grid_line_color: 'vec4f',
        grid_offset: 'f32',
        grid_cell_size: 'f32',
        grid_line_width: 'f32',
        grid_uv_mode: 'i32',
    }) 
    constructor(options: GridMaterialOptions = {}) {
        super(options);


        this.uniforms = new UniformData(this, {
            name: 'material',
            isGlobal: false,
            values: {
                ...this.uniforms.entries,
                grid_base_color: new Color(options.baseColor || 0x111111),
                grid_line_color: new Color(options.lineColor || 0xffffff),
                grid_offset: options.offset || 0.5,
                grid_cell_size: options.cellSize || 1.0,
                grid_line_width: options.lineWidth || 0.01,
                grid_uv_mode: options.uvMode || 0,
            }
        });

        const config = ShaderLibrary.STANDARD;
        config.chunks = ['common', 'scene', 'camera', 'model', 'diffuse_map', 'grid_material', 'pbr', 'fog'];
        config.varyings.push({ name: 'vScale', type: 'vec3f' });
        config.name = 'grid';

        this.createShader(config);

    }
}