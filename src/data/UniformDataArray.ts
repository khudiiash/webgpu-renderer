import { BufferData } from "./BufferData";
import { DataMonitor } from "./DataMonitor";
import { UniformData } from "./UniformData";
import { Struct } from "./Struct";

export class UniformDataArray extends BufferData {
    itemSize: number;
    maxItems: number;
    items: UniformData[];
    monitor: DataMonitor;
    struct: Struct;

    constructor(struct: Struct, maxItems: number) {
        const itemSize = struct.size / 4;
        super(maxItems * itemSize);
        this.itemSize = itemSize;
        this.struct = struct;
        this.maxItems = maxItems;
        this.items = [];
        this.monitor = new DataMonitor(this, this);
    }

    /**
     * @param {UniformData} item 
     */ 
    add(item: UniformData) {
        if (!item || !(item instanceof UniformData)) {
            console.error('Invalid data provided, need to be an instance of UniformData');
            return;
        }
        if (this.size === this.maxItems) {
            console.error('Cant add more items');
            return;
        }
        const index = this.size * this.itemSize;
        item.onChange((_, start, end) => { // start and end are in uniform scope
            this.set(item.subarray(start, end), index + start);
        })
        this.items.push(item);
        this.set(item.subarray(), index);
    }

    /**
     * @param {number} index
     * @returns {UniformData}
     */
    getItem(index: number): UniformData {
        return this.items[index];
    }

    /**
     * removes the item
     * rearranges the data if needed
     * @param {UniformData} item 
     */
    remove(item: UniformData) {
        const index = this.items.indexOf(item);
        if (index === -1) {
            console.error(`Can't find item to remove`);
            return;
        }
        const isLast = index === this.items.length - 1;
        this.items.splice(index, 1);

        if (isLast) {
            this.fill(0, index * this.itemSize, index * this.itemSize + this.itemSize);
        } else {
            // not at the end of the list, so need to rearrange data
            for (let i = 0; i < this.items.length; i++) {
                this.set(this.items[i].subarray(), i * this.itemSize);
            }
        }
    }

    /** @returns {number} - number of items */
    get size(): number {
        return this.items.length;
    }

}
