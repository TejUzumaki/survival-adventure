export class InventorySystem {
    constructor() {
        this.items = {
            wood: 0,
            stone: 0
        };
    }

    addItem(itemName, amount) {
        this.items[itemName] = (this.items[itemName] || 0) + amount;
    }

    getItems() {
        return this.items;
    }
}
