import { arraysEqual, num } from "@/util/general";
import { ChangeCallback } from "./BufferData";

class DataMonitor {
    parent: any;

    static extendWithDataMonitor(monitor: DataMonitor, instance: Float32Array & { [key: string]: Function }) {
        const proto = Object.getPrototypeOf(instance);
        
        for (const prop of Object.getOwnPropertyNames(proto)) {
            const descriptor = Object.getOwnPropertyDescriptor(proto, prop);
            
            if (prop === 'constructor' || descriptor?.get || descriptor?.set || /onChange|offChange|Silent/i.test(prop)) {
                continue;
            }
            
            if (typeof proto[prop] === 'function') {
                const original = proto[prop] as Function;
                instance[prop] = function(this: typeof instance, ...args: unknown[]): unknown {
                    const result = original.apply(this, args);
                    if (prop === 'set') {
                        monitor.check(args[1] as number || 0, (args[0] as ArrayLike<number>).length); 
                    } else {
                        monitor.check();
                    }
                    return result;
                };
            }
        }

        if (instance.onChange) {
            const original = instance.onChange;
            instance.onChange = function(callback: ChangeCallback) {
                monitor.add(callback);
                return original.call(instance, callback);
            }
            instance.offChange = function(callback?: ChangeCallback) {
                monitor.remove(callback);
                return instance;
            }
        } else {
            Object.defineProperties(instance, {
                onChange: {
                    value: function(callback: ChangeCallback) {
                        monitor.add(callback);
                        return instance;
                    },
                    writable: false
                },
                
                offChange: {
                    value: function(callback: ChangeCallback) {
                        monitor.remove(callback);
                        return instance;
                    },
                    writable: false
                }

            })

        }

        return instance;
    }

    private callbacks: ChangeCallback[];
    private data: Float32Array;
    private lastData: Float32Array;
    private arrayStride: number;

    constructor(parent: any, data: Float32Array, arrayStride?: number) {
        this.callbacks = [];
        this.data = data;
        this.parent = parent;
        this.lastData = new Float32Array([...data]);
        this.arrayStride = arrayStride || data.length;
        DataMonitor.extendWithDataMonitor(this, parent);
    }

    check(start: number = 0, end: number = this.data.length): boolean {
        if (!this.callbacks.length) return false;
        const shouldDispatch = !arraysEqual(this.lastData, this.data, start, end);
        this.lastData.set(this.data);
        if (shouldDispatch) {
            this.dispatch(start, end);
        }
        return shouldDispatch;
    }

    add(callback: ChangeCallback) {
        if (callback === undefined) {
            throw new Error('Callback is undefined');
        }
        if (this.callbacks.indexOf(callback) === -1) {
            this.callbacks.push(callback);
        }
    }

    remove(callback?: ChangeCallback) {
        if (callback === undefined) {
            this.callbacks = [];
            return;
        }
        const index = this.callbacks.indexOf(callback);
        if (index !== -1) {
            this.callbacks.splice(index, 1);
        }
    }

    dispatch(start: number, end: number) {
        for (let i = 0; i < this.callbacks.length; i++) {
            this.callbacks[i](this.data, start, end);
        }
    }
}


export { DataMonitor };