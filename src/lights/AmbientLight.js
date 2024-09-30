import { Color } from "../math/Color";

class AmbientLight {
    static byteSize = 20;

    constructor({ color = '#ffffff', intensity = 1}) {
        this.color = new Color(color);
        this.intensity = intensity;
        this._data = new Float32Array([
            ...this.color.data,
            this.intensity,
        ]);
    }
    
    get data() {
        return this._data; 
    }
}

export { AmbientLight };