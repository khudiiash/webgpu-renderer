import { BufferData, UniformData, DataMonitor } from "@/data";

export class UniformDataArray extends BufferData {
    itemSize: number;
    maxItems: number;
    items: UniformData[];
    monitor: DataMonitor;
    /**
     * @param {number} maxItems  maximum number of items
     * @param {number} itemSize  length of item's data
     * @param {number} padding  padding between items (default to 4) as it is better for data alignment in gpu
     */
    constructor(maxItems: number, itemSize: number, padding: number = 4) {
        super(maxItems * (itemSize + padding));
        this.itemSize = itemSize + padding;
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
        this.set(item.data, index);
        item.onChange(() => {
            this.set(item.data, index)
            this.monitor.dispatch();
        })
        this.items.push(item);
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
                this.set(this.items[i].data, i * this.itemSize);
            }
        }
    }

    /** @returns {number} - number of items */
    get size(): number {
        return this.items.length;
    }

}
