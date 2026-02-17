export type StockStatus = "LOW" | "IN_STOCK" | "OVER_STOCK";

export function getStockStatus(currentStock: number, minStock: number): StockStatus {
    if (currentStock < minStock) return "LOW";
    if (currentStock > 2 * minStock) return "OVER_STOCK";
    return "IN_STOCK";
}

export function getStockStatusLabel(status: StockStatus): string {
    switch (status) {
        case "LOW":
            return "Low Stock";
        case "IN_STOCK":
            return "In Stock";
        case "OVER_STOCK":
            return "Over Stock";
    }
}

export function getStockStatusColor(status: StockStatus): string {
    switch (status) {
        case "LOW":
            return "text-red-500 bg-red-500/10 border-red-500/20";
        case "IN_STOCK":
            return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
        case "OVER_STOCK":
            return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    }
}
