import { Color } from '../math/Color.js';
import { UniformData } from '../renderer/new/UniformData.js';
import { Uniform } from '../renderer/shaders/Uniform.js';
import { autobind }  from '../utils/autobind.js';
import { Shader } from '../renderer/new/shaders/Shader.js';

class Material {
  constructor(options = {}) {
        autobind(this);
        this.type = 'Material';
        this.name = '';
        this.shader = null;
    }

    setParameter(name, value) {
		  this.uniforms.set(name, value);
    }

    getParameter(name) {
		return this.uniforms.get(name);
    }

    clone() {
        return new Material().copy(this);
    }

    /**
    * Copy properties from another material
    * @param {Material} source 
    */
    copy(source) {
        this.name = source.name;
        return this;
    }

}

export { Material };