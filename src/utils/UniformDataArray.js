import { UniformData } from "../renderer/new/UniformData";
import { DataMonitor } from "./DataMonitor"

class UniformDataArray extends Float32Array {
    /**
     * @param {number} maxItems  maximum number of items
     * @param {number} itemSize  length of item's data
     * @param {number} padding  padding between items (default to 4) as it is better for data alignment in gpu
     */
    constructor(maxItems, itemSize, padding = 4) {
        super(maxItems * (itemSize + padding));
        Object.defineProperties(this, {
            itemSize: { value: itemSize + padding },
            items: { value: [] },
            monitor: { value: new DataMonitor(this, this), writable: false }
        })
    }

    /**
     * @param {UniformData} item 
     */ 
    add(item) {
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
    at(index) {
        return this.items[index];
    }

    /**
     * removes the item
     * rearranges the data if needed
     * @param {UniformData} item 
     */
    remove(item) {
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
    get size() {
        return this.items.length;
    }

}

export { UniformDataArray };