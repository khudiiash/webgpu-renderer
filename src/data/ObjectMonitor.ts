type ObjectChangeCallback = (prop: string, value: any) => void;

export class ObjectMonitor {
    static callbacks: WeakMap<ObjectMonitor, ObjectChangeCallback[]> = new Map();
    private listener: { [key: string]: any };
    [key: string]: any;

    constructor(data: any, parent?: any) {
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
        this.listener = parent || this;

        Object.defineProperties(this.listener, config);
    }

    add(key: string, value: any) {
        Object.defineProperty(this.listener, key, {
            get: () => value,
            set: (newValue: any) => {
                value = newValue;
                this.dispatch(key, newValue);
            },
            enumerable: true,
            configurable: true
        });
    }

    remove(key: string) {
        delete this.listener[key];
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