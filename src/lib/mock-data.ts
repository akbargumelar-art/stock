// Mock data for local preview without database
// Active when MOCK_DATA=true in .env

export const MOCK_ENABLED = process.env.MOCK_DATA === "true";

// ---------- Users ----------
export const mockUsers = [
    {
        id: "u1",
        name: "Admin Demo",
        email: "admin@stockflow.local",
        role: "ADMIN" as const,
        createdAt: new Date("2025-12-01"),
        categoryVisibility: [],
    },
    {
        id: "u2",
        name: "Viewer Demo",
        email: "viewer@stockflow.local",
        role: "VIEWER" as const,
        createdAt: new Date("2026-01-10"),
        categoryVisibility: [
            { id: 1, userId: "u2", categoryId: 1, category: { id: 1, name: "Elektronik" } },
        ],
    },
];

export const mockSession = {
    user: { id: "u1", name: "Admin Demo", email: "admin@stockflow.local", role: "ADMIN" },
    expires: new Date(Date.now() + 86400000).toISOString(),
};

// ---------- Categories ----------
export const mockCategories = [
    { id: 1, name: "Elektronik", prefix: "ELK", description: "Perangkat elektronik" },
    { id: 2, name: "Furnitur", prefix: "FRN", description: "Meja, kursi, lemari" },
    { id: 3, name: "ATK", prefix: "ATK", description: "Alat tulis kantor" },
    { id: 4, name: "Perlengkapan", prefix: "PLK", description: "Perlengkapan umum" },
];

// ---------- Products ----------
export const mockProducts = [
    {
        id: 1, sku: "ELK-001", name: "Laptop Lenovo ThinkPad", categoryId: 1,
        description: "ThinkPad T14 Gen5", unit: "unit", price: 12500000,
        costPrice: 11000000, minStock: 5, currentStock: 3, qrCode: null, image: null,
        condition: "NEW" as const, isConsumable: false,
        createdBy: "u1", createdAt: new Date("2026-01-15"), updatedAt: new Date("2026-02-10"),
        category: { id: 1, name: "Elektronik" },
    },
    {
        id: 2, sku: "ELK-002", name: "Monitor Samsung 24\"", categoryId: 1,
        description: "24\" IPS FHD", unit: "unit", price: 2800000,
        costPrice: 2500000, minStock: 10, currentStock: 15, qrCode: null, image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=150&q=80",
        condition: "NEW" as const, isConsumable: false,
        createdBy: "u1", createdAt: new Date("2026-01-15"), updatedAt: new Date("2026-02-10"),
        category: { id: 1, name: "Elektronik" },
    },
    {
        id: 3, sku: "ELK-003", name: "Keyboard Mechanical", categoryId: 1,
        description: "Cherry MX Brown", unit: "pcs", price: 850000,
        costPrice: 700000, minStock: 15, currentStock: 22, qrCode: null, image: null,
        condition: "USED" as const, isConsumable: false,
        createdBy: "u1", createdAt: new Date("2026-01-16"), updatedAt: new Date("2026-02-12"),
        category: { id: 1, name: "Elektronik" },
    },
    {
        id: 4, sku: "FRN-001", name: "Meja Kantor 120cm", categoryId: 2,
        description: "Meja kerja ukuran 120x60", unit: "unit", price: 1500000,
        costPrice: 1200000, minStock: 3, currentStock: 8, qrCode: null, image: null,
        condition: "NEW" as const, isConsumable: false,
        createdBy: "u1", createdAt: new Date("2026-01-17"), updatedAt: new Date("2026-02-08"),
        category: { id: 2, name: "Furnitur" },
    },
    {
        id: 5, sku: "FRN-002", name: "Kursi Ergonomic", categoryId: 2,
        description: "Kursi kantor adjustable", unit: "unit", price: 2200000,
        costPrice: 1800000, minStock: 5, currentStock: 2, qrCode: null, image: null,
        condition: "REFURBISHED" as const, isConsumable: false,
        createdBy: "u1", createdAt: new Date("2026-01-17"), updatedAt: new Date("2026-02-14"),
        category: { id: 2, name: "Furnitur" },
    },
    {
        id: 6, sku: "ATK-001", name: "Kertas A4 70gsm", categoryId: 3,
        description: "Rim kertas HVS", unit: "rim", price: 55000,
        costPrice: 45000, minStock: 50, currentStock: 35, qrCode: null, image: null,
        condition: "NEW" as const, isConsumable: true,
        createdBy: "u1", createdAt: new Date("2026-01-18"), updatedAt: new Date("2026-02-15"),
        category: { id: 3, name: "ATK" },
    },
    {
        id: 7, sku: "ATK-002", name: "Pulpen Pilot G2", categoryId: 3,
        description: "Gel pen 0.5mm hitam", unit: "pcs", price: 15000,
        costPrice: 10000, minStock: 100, currentStock: 180, qrCode: null, image: null,
        condition: "NEW" as const, isConsumable: true,
        createdBy: "u1", createdAt: new Date("2026-01-18"), updatedAt: new Date("2026-02-16"),
        category: { id: 3, name: "ATK" },
    },
    {
        id: 8, sku: "PLK-001", name: "Dispenser Galon", categoryId: 4,
        description: "Hot & Cold dispenser", unit: "unit", price: 750000,
        costPrice: 600000, minStock: 2, currentStock: 4, qrCode: null, image: null,
        condition: "NEW" as const, isConsumable: false,
        createdBy: "u1", createdAt: new Date("2026-01-20"), updatedAt: new Date("2026-02-10"),
        category: { id: 4, name: "Perlengkapan" },
    },
];

// ---------- Locations ----------
export const mockLocations = [
    {
        id: 1, name: "Gudang Utama", type: "PHYSICAL" as const, parentId: null,
        description: "Gudang utama lantai 1", createdAt: new Date("2026-01-01"),
        parent: null, children: [{ id: 3, name: "Rak A" }, { id: 4, name: "Rak B" }],
        _count: { productLocations: 5 },
    },
    {
        id: 2, name: "Ruang Server", type: "PHYSICAL" as const, parentId: null,
        description: "Ruang server lantai 2", createdAt: new Date("2026-01-01"),
        parent: null, children: [],
        _count: { productLocations: 2 },
    },
    {
        id: 3, name: "Rak A", type: "PHYSICAL" as const, parentId: 1,
        description: "Rak bagian kiri", createdAt: new Date("2026-01-02"),
        parent: { name: "Gudang Utama" }, children: [],
        _count: { productLocations: 3 },
    },
    {
        id: 4, name: "Rak B", type: "PHYSICAL" as const, parentId: 1,
        description: "Rak bagian kanan", createdAt: new Date("2026-01-02"),
        parent: { name: "Gudang Utama" }, children: [],
        _count: { productLocations: 2 },
    },
    {
        id: 5, name: "Stok Virtual", type: "VIRTUAL" as const, parentId: null,
        description: "Stok dalam perjalanan", createdAt: new Date("2026-01-03"),
        parent: null, children: [],
        _count: { productLocations: 1 },
    },
];

// ---------- Movements ----------
const makeDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d;
};

export const mockMovements = [
    {
        id: 1, productId: 1, type: "IN", fromLocationId: null, toLocationId: 1,
        quantity: 5, notes: "Stok awal laptop", movedBy: "u1",
        createdAt: makeDate(6),
        product: { sku: "ELK-001", name: "Laptop Lenovo ThinkPad" },
        fromLocation: null, toLocation: { name: "Gudang Utama", type: "PHYSICAL" },
        mover: { name: "Admin Demo" },
    },
    {
        id: 2, productId: 2, type: "IN", fromLocationId: null, toLocationId: 1,
        quantity: 20, notes: "Restok monitor", movedBy: "u1",
        createdAt: makeDate(5),
        product: { sku: "ELK-002", name: "Monitor Samsung 24\"" },
        fromLocation: null, toLocation: { name: "Gudang Utama", type: "PHYSICAL" },
        mover: { name: "Admin Demo" },
    },
    {
        id: 3, productId: 6, type: "IN", fromLocationId: null, toLocationId: 3,
        quantity: 100, notes: "Pengadaan kertas bulan Februari", movedBy: "u1",
        createdAt: makeDate(4),
        product: { sku: "ATK-001", name: "Kertas A4 70gsm" },
        fromLocation: null, toLocation: { name: "Rak A", type: "PHYSICAL" },
        mover: { name: "Admin Demo" },
    },
    {
        id: 4, productId: 1, type: "LOAN_OUT", fromLocationId: 1, toLocationId: null,
        quantity: 2, notes: "Loan to Budi (LN-20260217-001)", movedBy: "u1",
        createdAt: makeDate(3),
        product: { sku: "ELK-001", name: "Laptop Lenovo ThinkPad" },
        fromLocation: { name: "Gudang Utama", type: "PHYSICAL" }, toLocation: null,
        mover: { name: "Admin Demo" },
    },
    {
        id: 5, productId: 2, type: "SALE", fromLocationId: null, toLocationId: null,
        quantity: 5, notes: "Sale INV-20260215-001", movedBy: "u1",
        createdAt: makeDate(2),
        product: { sku: "ELK-002", name: "Monitor Samsung 24\"" },
        fromLocation: null, toLocation: null,
        mover: { name: "Admin Demo" },
    },
    {
        id: 6, productId: 7, type: "IN", fromLocationId: null, toLocationId: 4,
        quantity: 200, notes: "Restok pulpen", movedBy: "u1",
        createdAt: makeDate(1),
        product: { sku: "ATK-002", name: "Pulpen Pilot G2" },
        fromLocation: null, toLocation: { name: "Rak B", type: "PHYSICAL" },
        mover: { name: "Admin Demo" },
    },
    {
        id: 7, productId: 6, type: "SALE", fromLocationId: null, toLocationId: null,
        quantity: 15, notes: "Sale INV-20260217-001", movedBy: "u1",
        createdAt: makeDate(0),
        product: { sku: "ATK-001", name: "Kertas A4 70gsm" },
        fromLocation: null, toLocation: null,
        mover: { name: "Admin Demo" },
    },
];

// ---------- Loans ----------
export const mockLoans = [
    {
        id: "loan-1", transactionCode: "LN-20260210-001",
        borrowerName: "Budi Santoso", borrowerPhone: "628123456789",
        productId: 1, qty: 2, loanDate: makeDate(7).toISOString(),
        dueDate: makeDate(-3).toISOString(), returnDate: null,
        status: "OVERDUE" as const, lastNotifiedAt: makeDate(1).toISOString(),
        notes: "Untuk presentasi klien", createdAt: makeDate(7),
        product: { id: 1, sku: "ELK-001", name: "Laptop Lenovo ThinkPad", unit: "unit" },
    },
    {
        id: "loan-2", transactionCode: "LN-20260215-001",
        borrowerName: "Dewi Anggraeni", borrowerPhone: "628987654321",
        productId: 3, qty: 1, loanDate: makeDate(2).toISOString(),
        dueDate: new Date(Date.now() + 5 * 86400000).toISOString(), returnDate: null,
        status: "ACTIVE" as const, lastNotifiedAt: null,
        notes: "Testing keyboard baru", createdAt: makeDate(2),
        product: { id: 3, sku: "ELK-003", name: "Keyboard Mechanical", unit: "pcs" },
    },
    {
        id: "loan-3", transactionCode: "LN-20260205-001",
        borrowerName: "Adi Pratama", borrowerPhone: "628111222333",
        productId: 4, qty: 1, loanDate: makeDate(12).toISOString(),
        dueDate: makeDate(5).toISOString(), returnDate: makeDate(4).toISOString(),
        status: "RETURNED" as const, lastNotifiedAt: null,
        notes: "Pindah ruangan", createdAt: makeDate(12),
        product: { id: 4, sku: "FRN-001", name: "Meja Kantor 120cm", unit: "unit" },
    },
];

// ---------- Sales ----------
export const mockSales = [
    {
        id: "sale-1", invoiceCode: "INV-20260215-001",
        customerName: "PT Maju Jaya", totalAmount: 14000000,
        saleDate: makeDate(2).toISOString(), createdAt: makeDate(2),
        _count: { items: 2 },
        items: [
            { id: 1, qty: 5, sellingPrice: 2800000, product: { sku: "ELK-002", name: "Monitor Samsung 24\"" } },
        ],
    },
    {
        id: "sale-2", invoiceCode: "INV-20260217-001",
        customerName: null, totalAmount: 825000,
        saleDate: makeDate(0).toISOString(), createdAt: makeDate(0),
        _count: { items: 1 },
        items: [
            { id: 2, qty: 15, sellingPrice: 55000, product: { sku: "ATK-001", name: "Kertas A4 70gsm" } },
        ],
    },
    {
        id: "sale-3", invoiceCode: "INV-20260214-001",
        customerName: "CV Sejahtera", totalAmount: 4400000,
        saleDate: makeDate(3).toISOString(), createdAt: makeDate(3),
        _count: { items: 2 },
        items: [
            { id: 3, qty: 2, sellingPrice: 2200000, product: { sku: "FRN-002", name: "Kursi Ergonomic" } },
        ],
    },
];

export const mockSaleDetail = {
    id: "sale-1", invoiceCode: "INV-20260215-001",
    customerName: "PT Maju Jaya", totalAmount: 14000000,
    saleDate: makeDate(2).toISOString(),
    items: [
        { id: 1, qty: 5, sellingPrice: 2800000, product: { sku: "ELK-002", name: "Monitor Samsung 24\"", unit: "unit" } },
    ],
};

// ---------- Dashboard ----------
export function getMockDashboardStats() {
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        chartData.push({
            date: d.toISOString().split("T")[0],
            movements: Math.floor(Math.random() * 8) + 1,
            revenue: Math.floor(Math.random() * 5000000),
            sales: Math.floor(Math.random() * 4) + 1,
        });
    }

    return {
        totalProducts: 8,
        lowStockCount: 3,
        overStockCount: 2,
        totalMovements: 42,
        totalAssetValue: 78350000,
        monthlyRevenue: 19225000,
        monthlySalesCount: 3,
        activeLoans: 1,
        overdueLoans: 1,
        chartData,
        lowStockList: [
            { id: 1, sku: "ELK-001", name: "Laptop Lenovo ThinkPad", currentStock: 3, minStock: 5, categoryName: "Elektronik" },
            { id: 5, sku: "FRN-002", name: "Kursi Ergonomic", currentStock: 2, minStock: 5, categoryName: "Furnitur" },
            { id: 6, sku: "ATK-001", name: "Kertas A4 70gsm", currentStock: 35, minStock: 50, categoryName: "ATK" },
        ],
        categories: mockCategories.map((c) => ({ id: c.id, name: c.name })),
    };
}

// ---------- Audit Trail ----------
export const mockAuditTrail = [
    {
        id: 1, userId: "u1", action: "CREATE", entityType: "product", entityId: "1",
        details: { sku: "ELK-001", name: "Laptop Lenovo ThinkPad" },
        ipAddress: "127.0.0.1", createdAt: makeDate(6),
        user: { name: "Admin Demo", email: "admin@stockflow.local" },
    },
    {
        id: 2, userId: "u1", action: "MOVE", entityType: "movement", entityId: "1",
        details: { productId: 1, from: null, to: 1, quantity: 5 },
        ipAddress: "127.0.0.1", createdAt: makeDate(5),
        user: { name: "Admin Demo", email: "admin@stockflow.local" },
    },
    {
        id: 3, userId: "u1", action: "CREATE", entityType: "loan", entityId: "loan-1",
        details: { transactionCode: "LN-20260210-001", borrower: "Budi Santoso" },
        ipAddress: "127.0.0.1", createdAt: makeDate(4),
        user: { name: "Admin Demo", email: "admin@stockflow.local" },
    },
    {
        id: 4, userId: "u1", action: "CREATE", entityType: "sale", entityId: "sale-1",
        details: { invoiceCode: "INV-20260215-001", totalAmount: 14000000 },
        ipAddress: "127.0.0.1", createdAt: makeDate(2),
        user: { name: "Admin Demo", email: "admin@stockflow.local" },
    },
    {
        id: 5, userId: "u1", action: "NOTIFY", entityType: "loan", entityId: "loan-1",
        details: { phone: "628123456789", sent: true },
        ipAddress: "127.0.0.1", createdAt: makeDate(1),
        user: { name: "Admin Demo", email: "admin@stockflow.local" },
    },
];
