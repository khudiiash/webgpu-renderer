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
import fragment_light_ambient from './chunks/fragment/fragment_light_ambient.wgsl?raw';
import fragment_light_diffuse from './chunks/fragment/fragment_light_diffuse.wgsl?raw';
import fragment_light_phong from './chunks/fragment/fragment_light_phong.wgsl?raw';
import fragment_shadowmap from './chunks/fragment/fragment_shadowmap.wgsl?raw';

import { ShaderValueType } from '../utils/ShaderValueType';
import { GPUType } from '../utils/Constants';

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
        vertex_default: new VertexChunk('vertex_default', vertex_default, []),
        vertex_uv: new VertexChunk('vertex_uv', vertex_uv, [ new ShaderValueType('vUv', GPUType.Vec2f) ]),
        vertex_view_direction: new VertexChunk('vertex_view_direction', vertex_view_direction, [ new ShaderValueType('vViewDirection', GPUType.Vec3f) ]),
        vertex_normal: new VertexChunk('vertex_normal', vertex_normal, [ new ShaderValueType('vNormal', GPUType.Vec3f) ]),
        vertex_world_position: new VertexChunk('vertex_world_position', vertex_world_position, [ new ShaderValueType('vWorldPosition', GPUType.Vec3f) ]),
        vertex_fog: new VertexChunk('vertex_fog', vertex_fog, [ new ShaderValueType('vFogDepth', GPUType.Float) ]),
        vertex_shadow_depth: new VertexChunk('vertex_shadow_depth', vertex_shadow_depth),
        vertex_shadowmap: new VertexChunk('vertex_shadowmap', vertex_shadowmap, [ new ShaderValueType('vShadowPosition', GPUType.Vec3f) ]),
    }
    static fragment = {
        fragment_diffuse_map: new FragmentChunk('fragment_diffuse', fragment_diffuse_map),
        fragment_fog: new FragmentChunk('fragment_fog', fragment_fog),
        fragment_light_ambient: new FragmentChunk('fragment_light_ambient', fragment_light_ambient),
        fragment_light_diffuse: new FragmentChunk('fragment_light_diffuse', fragment_light_diffuse),
        fragment_light_phong: new FragmentChunk('fragment_light_phong', fragment_light_phong),
        fragment_shadowmap: new FragmentChunk('fragment_shadowmap', fragment_shadowmap),
    }
}




export { ShaderChunks, ShaderChunk, VertexChunk, FragmentChunk };