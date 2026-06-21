export class InventorySystem {
    constructor() {
        // 12 slots (null means empty)
        this.items = new Array(12).fill(null);
        
        // Pre-fill some items for testing the UI
        this.items[0] = { name: 'wood', count: 5 };
        this.items[1] = { name: 'stone', count: 3 };
        this.items[5] = { name: 'wood', count: 2 };
    }

    addItem(itemName, amount) {
        // Try to add to existing stack
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i] && this.items[i].name === itemName) {
                this.items[i].count += amount;
                return;
            }
        }
        // Find empty slot
        for (let i = 0; i < this.items.length; i++) {
            if (!this.items[i]) {
                this.items[i] = { name: itemName, count: amount };
                return;
            }
        }
    }

    swapItems(index1, index2) {
        const temp = this.items[index1];
        this.items[index1] = this.items[index2];
        this.items[index2] = temp;
    }

    getItems() {
        return this.items;
    }
}
