import { Geometry } from "./Geometry";

class InstancedGeometry extends Geometry {
  type: string;
  isInstancedGeometry: boolean;
  instanceCount: number;

  constructor() {
    super();
    this.type = 'InstancedGeometry';
    this.isInstancedGeometry = true;
    this.instanceCount = Infinity;
  }

}

export { InstancedGeometry };