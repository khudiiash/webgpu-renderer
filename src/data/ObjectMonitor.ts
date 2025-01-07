type ObjectChangeCallback = (prop: string, value: any) => void;

export class ObjectMonitor {
    static callbacks: WeakMap<ObjectMonitor, ObjectChangeCallback[]> = new Map();

    constructor(data: any, parent?: Object) {
        const values = { ...data };
        let lastData = { ...data };
        const config: any = {}
        const self = this;

        for (const key in values) {
            config[key] = {
                get: () => {
                    return values[key];
                },
                set: (value: any) => {
                    values[key] = value;
                    if (lastData[key] !== value) {
                        self.dispatch(key, value);
                        lastData = { ...values };
                    }
                },
                enumerable: true,
                configurable: true
            }
        }

        Object.defineProperties(parent || this, config);
    }

    [Symbol.iterator]() {
        return Object.entries(this);
    }

    dispatch(prop: string, value: any) {
        for (const callback of ObjectMonitor.callbacks.get(this) || []) {
            callback(prop, value);
        }
    }

    onChange(callback: ObjectChangeCallback) {
        const callbacks = ObjectMonitor.callbacks.get(this) || [];
        ObjectMonitor.callbacks.set(this, [...callbacks, callback]);
        return this;

    }

    offChange(callback: Function) {
        const callbacks = ObjectMonitor.callbacks.get(this) || [];
        ObjectMonitor.callbacks.set(this, callbacks.filter(cb => cb !== callback));
        return this;
    }
}