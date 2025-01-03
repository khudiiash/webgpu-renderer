import { arraysEqual } from "./arraysEqual";

function extendWithDataMonitor(monitor, instance, data) {
    const proto = Object.getPrototypeOf(instance);
    
    for (const prop of Object.getOwnPropertyNames(proto)) {
        const descriptor = Object.getOwnPropertyDescriptor(proto, prop);
        
        if (prop === 'constructor' || descriptor.get || descriptor.set) {
            continue;
        }
        
        if (typeof proto[prop] === 'function') {
            const original = proto[prop];
            instance[prop] = function(...args) {
                const result = original.apply(this, args);
                monitor.check();
                return result;
            };
        }
    }

    Object.defineProperties(instance, {
        onChange: {
            value: function(callback) {
                monitor.add(callback);
                return instance;
            },
            writable: false
        },
        
        offChange: {
            value: function(callback) {
                monitor.remove(callback);
                return instance;
            },
            writable: false
        }

    })

    return instance;
}

class DataMonitor {
    constructor(parent, data) {
        this.callbacks = [];
        this.parent = parent;
        this.data = data;
        this._lastData = new Float32Array(data);
        extendWithDataMonitor(this, parent, data);
    }

    check() {
        if (!arraysEqual(this._lastData, this.data)) {
            this.dispatch();
            this._lastData.set(this.data);
        }
    }

    add(callback) {
        if (callback === undefined) {
            throw new Error('Callback is undefined');
        }
        if (this.callbacks.indexOf(callback) === -1) {
            this.callbacks.push(callback);
        }
    }

    remove(callback) {
        const index = this.callbacks.indexOf(callback);
        if (index !== -1) {
            this.callbacks.splice(index, 1);
        }
    }

    dispatch() {
        for (let i = 0; i < this.callbacks.length; i++) {
            this.callbacks[i](this.data);
        }
    }
}


export { DataMonitor, extendWithDataMonitor };