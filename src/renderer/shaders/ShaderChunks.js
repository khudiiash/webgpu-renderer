import common from './chunks/common.wgsl?raw';
import vertex_default from './chunks/vertex/vertex_default.wgsl?raw';
import vertex_uv from './chunks/vertex/vertex_uv.wgsl?raw';
import vertex_world_position from './chunks/vertex/vertex_world_position.wgsl?raw';
import vertex_fog from './chunks/vertex/vertex_fog.wgsl?raw';
import vertex_normal from './chunks/vertex/vertex_normal.wgsl?raw';
import vertex_view_direction from './chunks/vertex/vertex_view_direction.wgsl?raw';
import vertex_shadowmap from './chunks/vertex/vertex_shadowmap.wgsl?raw';
import vertex_shadow_depth from './chunks/vertex/vertex_shadow_depth.wgsl?raw';

import fragment_diffuse_map from './chunks/fragment/fragment_diffuse_map.wgsl?raw';
import fragment_fog from './chunks/fragment/fragment_fog.wgsl?raw';
import fragment_light_phong from './chunks/fragment/fragment_light_phong.wgsl?raw';
import fragment_shadowmap from './chunks/fragment/fragment_shadowmap.wgsl?raw';
import { Varying } from './Varying';

class ShaderChunk {
    constructor(name, code, varyings) {
        this.name = name; 
        this.code = code;
        this.varyings = varyings;
    }
}

class VertexChunk extends ShaderChunk {
    constructor(name, code, varyings) {
        super(name, code, varyings);
        this.isVertexChunk = true;
    }

}

class FragmentChunk extends ShaderChunk {
    constructor(name, code, varyings) {
        super(name, code, varyings);
        this.isFragmentChunk = true; 
    }
}

class ShaderChunks {
    static common = new ShaderChunk('common', common, []);
    static vertex = {
        default: new VertexChunk('vertex_default', vertex_default, []),
        uv: new VertexChunk('vertex_uv', vertex_uv, [ new Varying('vUv', 'vec2f')]),
        view_direction: new VertexChunk('vertex_view_direction', vertex_view_direction, [ new Varying('vViewDirection', 'vec3f')]),
        normal: new VertexChunk('vertex_normal', vertex_normal, [ new Varying('vNormal', 'vec3f')]),
        world_position: new VertexChunk('vertex_world_position', vertex_world_position, [ new Varying('vWorldPosition', 'vec3f')]),
        shadow_depth: new VertexChunk('vertex_shadow_depth', vertex_shadow_depth, []),
        fog: new VertexChunk('vertex_fog', vertex_fog, [ new Varying('vFogDistance', 'f32') ]),
        shadowmap: new VertexChunk('vertex_shadowmap', vertex_shadowmap, [ new Varying('vShadowCoord', 'vec4f') ]),
    }
    static fragment = {
        diffuse_map: new FragmentChunk('fragment_diffuse_map', fragment_diffuse_map),
        fog: new FragmentChunk('fragment_fog', fragment_fog),
        light_phong: new FragmentChunk('fragment_light_phong', fragment_light_phong),
        shadowmap: new FragmentChunk('fragment_shadowmap', fragment_shadowmap),
    }
}




export { ShaderChunks, ShaderChunk, VertexChunk, FragmentChunk };