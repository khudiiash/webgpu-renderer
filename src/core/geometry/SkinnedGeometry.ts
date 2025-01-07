import { Geometry } from "./Geometry";

class SkinnedGeometry extends Geometry {
    constructor(geometry, bones) {
        this.geometry = geometry;
        this.bones = bones;
    }
    
    update() {
        // update geometry
    }
    
    updateBones() {
        // update bones
    }
}

export { SkinnedGeometry };