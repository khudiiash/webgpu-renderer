class Utils {
    constructor(device, renderer) {
        this.device = device;
        this.renderer = renderer;
    }
    
    
    getPreferredCanvasFormat() {
        return navigator.gpu.getPreferredCanvasFormat();
    }
    
    getPrimitiveTopology(object, material) {
        if (object.isMesh) {
            return GPUPrimitiveTopology.TriangleList;
        }
        if (object.isLine) {
            return GPUPrimitiveTopology.LineStrip;
        }
        
        if (object.isPoints) {
            return GPUPrimitiveTopology.PointList;
        }
        
    }
}

export default Utils;