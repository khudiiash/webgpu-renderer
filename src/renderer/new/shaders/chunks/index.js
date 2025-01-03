import common from './common.wgsl?raw';
import standard from './standard.wgsl?raw';
import camera from './camera.wgsl?raw';
import model from './model.wgsl?raw';
import pbr from './pbr.wgsl?raw';
import shadow_pcf from './shadow_pcf.wgsl?raw';
import diffuse_map from './diffuse_map.wgsl?raw';
import fog from './fog.wgsl?raw';
import phong from './phong.wgsl?raw';
import scene from './scene.wgsl?raw';
import gamma from './gamma.wgsl?raw';

export const chunks = {
    common,
    standard,
    camera,
    model,
    pbr,
    shadow_pcf,
    diffuse_map,
    fog,
    phong,
    scene,
    gamma,
}