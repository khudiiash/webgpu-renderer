import { Color } from '../math/Color.js';
import { generateID } from '../math/MathUtils.js';
import { Events } from '../core/Events.js';

class Material extends Events {
    static BLEND = {
        DEFAULT: {
          color: {
            operation: 'add',
            srcFactor: 'one',
            dstFactor: 'zero',
          },
          alpha: {
            operation: 'add',
            srcFactor: 'one',
            dstFactor: 'zero',
          },
        },
        PREMULTIPLIED: {
          color: {
            operation: 'add',
            srcFactor: 'one',
            dstFactor: 'one-minus-src-alpha',
          },
          alpha: {
            operation: 'add',
            srcFactor: 'one',
            dstFactor: 'one-minus-src-alpha',
          },
        },
        UNMULTIPLIED: {
          color: {
            operation: 'add',
            srcFactor: 'src-alpha',
            dstFactor: 'one-minus-src-alpha',
          },
            alpha: {
                operation: 'add',
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
            },
        },
        DEST_OVER: {
          color: {
            operation: 'add',
            srcFactor: 'one-minus-dst-alpha',
            dstFactor: 'one',
          },
          alpha: {
            operation: 'add',
            srcFactor: 'one-minus-dst-alpha',
            dstFactor: 'one',
          },
        },
        SOURCE_IN: {
          color: {
            operation: 'add',
            srcFactor: 'dst-alpha',
            dstFactor: 'zero',
          },
          alpha: {
            operation: 'add',
            srcFactor: 'dst-alpha',
            dstFactor: 'zero',
          }
        },
        DEST_IN: {
          color: {
            operation: 'add',
            srcFactor: 'zero',
            dstFactor: 'src-alpha',
          },
            alpha: {
                operation: 'add',
                srcFactor: 'zero',
                dstFactor: 'src-alpha',
            }
        },
        SOURCE_OUT: {
          color: {
            operation: 'add',
            srcFactor: 'one-minus-dst-alpha',
            dstFactor: 'zero',
          },
            alpha: {
                operation: 'add',
                srcFactor: 'one-minus-dst-alpha',
                dstFactor: 'zero',
            }
        },
        DEST_OUT: {
          color: {
            operation: 'add',
            srcFactor: 'zero',
            dstFactor: 'one-minus-src-alpha',
          },
            alpha: {
                operation: 'add',
                srcFactor: 'zero',
                dstFactor: 'one-minus-src-alpha',
            }
        },
        SOURCE_ATOP: {
          color: {
            operation: 'add',
            srcFactor: 'dst-alpha',
            dstFactor: 'one-minus-src-alpha',
          },
            alpha: {
                operation: 'add',
                srcFactor: 'dst-alpha',
                dstFactor: 'one-minus-src-alpha',
            }
        },
        DEST_ATOP: {
          color: {
            operation: 'add',
            srcFactor: 'one-minus-dst-alpha',
            dstFactor: 'src-alpha',
          },
            alpha: {
                operation: 'add',
                srcFactor: 'one-minus-dst-alpha',
                dstFactor: 'src-alpha',
            }
        },
        ADDITIVE: {
          color: {
            operation: 'add',
            srcFactor: 'one',
            dstFactor: 'one',
          },
            alpha: {
                operation: 'add',
                srcFactor: 'one',
                dstFactor: 'one',
            },
        },
      };
    constructor(params = {}) {
        super();
        this.id = generateID();
        this.isMaterial = true;
        this.type = 'Material';
        this.cullMode = 'back';
        this.blending = Material.BLEND.DEFAULT;
    }
    
    get diffuseMap() {
        return this._diffuseMap;
    }
    
    set diffuseMap(texture) {
        this._diffuseMap = texture;
        this.textures?.find(texture => texture.name === 'diffuseMap')?.setTexture(texture);
        this.emit('update');
    }
    
    write(data, offset = 0) {
        this.emit('write', { data, offset });
    }
    
}

export { Material };