import { DataMonitor } from './DataMonitor';

export class BufferData extends Float32Array {

    monitor: DataMonitor;

    constructor(arg: ArrayLike<number> | ArrayBuffer) {
        super(arg);
        this.monitor = new DataMonitor(this, this);
    }
}
