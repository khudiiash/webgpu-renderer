import { arraysEqual, num } from "@/util/general";

class DataMonitor {
    parent: any;

    static extendWithDataMonitor(monitor: DataMonitor, instance: Float32Array & { [key: string]: Function }) {
        const proto = Object.getPrototypeOf(instance);
        
        for (const prop of Object.getOwnPropertyNames(proto)) {
            const descriptor = Object.getOwnPropertyDescriptor(proto, prop);
            
            if (prop === 'constructor' || descriptor?.get || descriptor?.set || /silent/i.test(prop)) {
                continue;
            }
            
            if (typeof proto[prop] === 'function') {
                const original = proto[prop] as Function;
                instance[prop] = function(this: typeof instance, ...args: unknown[]): unknown {
                const result = original.apply(this, args);
                monitor.check();
                return result;
                };
            }
        }

        if (instance.onChange) {
            const original = instance.onChange;
            instance.onChange = function(callback: Function) {
                monitor.add(callback);
                return original.call(instance, callback);
            }
            instance.offChange = function(callback?: Function) {
                monitor.remove(callback);
                return instance;
            }
        } else {
            Object.defineProperties(instance, {
                onChange: {
                    value: function(callback: Function) {
                        monitor.add(callback);
                        return instance;
                    },
                    writable: false
                },
                
                offChange: {
                    value: function(callback: Function) {
                        monitor.remove(callback);
                        return instance;
                    },
                    writable: false
                }

            })

        }

        return instance;
    }

    private callbacks: Function[];
    private data: Float32Array;
    private lastData: Float32Array;

    constructor(parent: any, data: Float32Array) {
        this.callbacks = [];
        this.data = data;
        this.parent = parent;
        this.lastData = new Float32Array([...data]);
        DataMonitor.extendWithDataMonitor(this, parent);
    }

    check() {
        if (!this.callbacks.length) return;
        const shouldDispatch = !arraysEqual(this.lastData, this.data);
        this.lastData.set(this.data);
        if (shouldDispatch) {
            this.dispatch();
        }
    }

    add(callback: Function) {
        if (callback === undefined) {
            throw new Error('Callback is undefined');
        }
        if (this.callbacks.indexOf(callback) === -1) {
            this.callbacks.push(callback);
        }
    }

    remove(callback?: Function) {
        if (callback === undefined) {
            this.callbacks = [];
            return;
        }
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


export { DataMonitor };