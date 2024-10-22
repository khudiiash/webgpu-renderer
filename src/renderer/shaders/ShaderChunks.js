import common from './chunks/common/common.wgsl?raw';
import vertex_position from './chunks/vertex/vertex_position.wgsl?raw';
import vertex_projection_camera from './chunks/vertex/vertex_projection_camera.wgsl?raw';
import vertex_projection_shadow from './chunks/vertex/vertex_projection_shadow.wgsl?raw';
import vertex_model from './chunks/vertex/vertex_model.wgsl?raw';
import vertex_model_instanced from './chunks/vertex/vertex_model_instanced.wgsl?raw';
import vertex_model_skinned from './chunks/vertex/vertex_model_skinned.wgsl?raw';
import vertex_uv from './chunks/vertex/vertex_uv.wgsl?raw';
import vertex_fog from './chunks/vertex/vertex_fog.wgsl?raw';
import vertex_normal from './chunks/vertex/vertex_normal.wgsl?raw';
import vertex_shadowmap from './chunks/vertex/vertex_shadowmap.wgsl?raw';
import vertex_wind from './chunks/vertex/vertex_wind.wgsl?raw';

import fragment_diffuse_map from './chunks/fragment/fragment_diffuse_map.wgsl?raw';
import fragment_fog from './chunks/fragment/fragment_fog.wgsl?raw';
import fragment_light_phong from './chunks/fragment/fragment_light_phong.wgsl?raw';
import fragment_shadowmap from './chunks/fragment/fragment_shadowmap.wgsl?raw';
import fragment_emission from './chunks/fragment/fragment_emission.wgsl?raw';
import fragment_shadow_depth from './chunks/fragment/fragment_shadow_depth.wgsl?raw';

import culling from './chunks/compute/culling.wgsl?raw';

import { Varying } from './Varying';
import { USE } from '../constants';

class ShaderChunk {
    constructor(name, code, varyings) {
        this.name = name; 
        this.code = code;
        this.use = USE.RENDER | USE.SHADOW;
        this.varyings = varyings;
    }
    
    setUse(use) {
        this.use = use;
        return this;
    }
    
    get useRender() {
        return this.use & USE.RENDER;
    }
    
    get useShadow() {
        return this.use & USE.SHADOW;
    }
    
    get useCompute() {
        return this.use & USE.COMPUTE;
    }
}

class VertexChunk extends ShaderChunk {
    constructor(name, code, varyings = []) {
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

class ComputeChunk extends ShaderChunk {
    constructor(name, code) {
        super(name, code);
        this.isComputeChunk = true;
    }
}

class ShaderChunks {
    static common = new ShaderChunk('common', common);
    static vertex = {
        

        model: new VertexChunk('vertex_model', vertex_model),
        model_instanced: new VertexChunk('vertex_model_instanced', vertex_model_instanced),
        model_skinned: new VertexChunk('vertex_model_skinned', vertex_model_skinned),

        position: new VertexChunk('vertex_position', vertex_position, [ 
            new Varying('vPosition', 'vec3f'), 
            new Varying('vPositionW', 'vec3f'),
            new Varying('vNormal', 'vec3f'),
            new Varying('vNormalW', 'vec3f'),
        ]),
        
        projection_camera: new VertexChunk('vertex_projection_camera', vertex_projection_camera).setUse(USE.RENDER),
        projection_shadow: new VertexChunk('vertex_projection_light', vertex_projection_shadow).setUse(USE.SHADOW),

        uv: new VertexChunk('vertex_uv', vertex_uv, [ new Varying('vUv', 'vec2f')]),
        fog: new VertexChunk('vertex_fog', vertex_fog, [ new Varying('vFogDistance', 'f32') ]).setUse(USE.RENDER),
        shadowmap: new VertexChunk('vertex_shadowmap', vertex_shadowmap, [ new Varying('vShadowCoord', 'vec4f') ]).setUse(USE.RENDER),
        wind: new VertexChunk('vertex_wind', vertex_wind),
    }
    static fragment = {
        shadow_depth: new FragmentChunk('fragment_shadow_depth', fragment_shadow_depth).setUse(USE.SHADOW),
        diffuse_map: new FragmentChunk('fragment_diffuse_map', fragment_diffuse_map),
        emission: new FragmentChunk('fragment_light_phong', fragment_emission).setUse(USE.RENDER),
        fog: new FragmentChunk('fragment_fog', fragment_fog).setUse(USE.RENDER),
        light_phong: new FragmentChunk('fragment_light_phong', fragment_light_phong).setUse(USE.RENDER),
        shadowmap: new FragmentChunk('fragment_shadowmap', fragment_shadowmap).setUse(USE.RENDER),
    }
    
    static compute = {
        culling: new ComputeChunk('culling', culling),
    }
}




export { ShaderChunks, ShaderChunk, VertexChunk, FragmentChunk };