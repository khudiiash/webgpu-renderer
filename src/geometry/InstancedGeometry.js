import { Geometry } from "./Geometry";

class InstancedGeometry extends Geometry {
  constructor() {
    super();
    this.type = 'InstancedGeometry';
    this.isInstancedGeometry = true;
    this.instanceCount = Infinity;
  }

}

export { InstancedGeometry };