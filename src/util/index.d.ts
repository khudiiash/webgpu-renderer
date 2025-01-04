declare namespace Util {

    interface DataMonitor {
        check(): void;
        add(callback: Function): void;
        remove(callback: Function): void;
        dispatch(): void;
    }

    interface BufferData extends Float32Array {
        monitor: DataMonitor;
    }


    class BufferData extends Float32Array {
        monitor: DataMonitor;
        constructor(arg: ArrayLike<number> | ArrayBuffer);
    }

    class Utils {
        static ID(key: string): number;
        static arraysEqual(a: Float32Array, b: Float32Array): boolean;
    }

}
declare class DataMonitor implements Util.DataMonitor {
    static extendWithDataMonitor(instance: this, parent: BufferData & { [key: string]: Function }): void;
    constructor(parent: any, data: BufferData);
}

declare class Utils {
    static ID(key: string): number;
    static arraysEqual(a: Float32Array, b: Float32Array): boolean;
}

declare class BufferData extends Float32Array implements Util.BufferData {
    constructor(arg: ArrayLike<number> | ArrayBuffer);
}