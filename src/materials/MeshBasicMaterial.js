import { ShaderLib } from "../renderer/shaders/ShaderLib";
import { ShaderChunks } from '../renderer/shaders/ShaderChunks';
import { Material } from "./Material";
import { Color } from "../math/Color";
import { UniformLib } from "../renderer/shaders/UniformLib";

class MeshBasicMaterial extends Material {
    constructor(params = {}) {
        super(params);
        this.isMeshBasicMaterial = true;
        this.type = 'MeshBasicMaterial';
        this.color = new Color(params.color ? params.color : 0xffffff);
        this.uniforms = [ 
            UniformLib.fog,
        ];
        this.chunks = {
            vertex: [ 
                ShaderChunks.vertex.vertex_uv,
                ShaderChunks.vertex.vertex_fog,
            ],
            fragment: [
                ShaderChunks.fragment.fragment_diffuse_map,
            ]

        }
        this.textures = []; 
        this.samples = [];
    }
}

export { MeshBasicMaterial };