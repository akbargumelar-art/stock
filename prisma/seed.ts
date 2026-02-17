import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // Create Admin user
    const hashedPassword = await bcrypt.hash("admin123", 12);
    const admin = await prisma.user.upsert({
        where: { email: "admin@aarasa.click" },
        update: {},
        create: {
            name: "Administrator",
            email: "admin@aarasa.click",
            password: hashedPassword,
            role: "ADMIN",
        },
    });
    console.log("✅ Admin user created:", admin.email);

    // Create Viewer user
    const viewerPassword = await bcrypt.hash("viewer123", 12);
    const viewer = await prisma.user.upsert({
        where: { email: "viewer@aarasa.click" },
        update: {},
        create: {
            name: "Viewer User",
            email: "viewer@aarasa.click",
            password: viewerPassword,
            role: "VIEWER",
        },
    });
    console.log("✅ Viewer user created:", viewer.email);

    // Create Categories
    const categories = await Promise.all(
        ["Elektronik", "Furniture", "Alat Tulis", "Bahan Baku", "Packaging"].map(
            (name) =>
                prisma.category.upsert({
                    where: { name },
                    update: {},
                    create: { name },
                })
        )
    );
    console.log("✅ Categories created:", categories.length);

    // Assign some categories visible to Viewer
    await prisma.categoryVisibility.createMany({
        data: [
            { userId: viewer.id, categoryId: categories[0].id },
            { userId: viewer.id, categoryId: categories[2].id },
        ],
        skipDuplicates: true,
    });
    console.log("✅ Category visibility assigned to viewer");

    // Create Locations
    const warehouse = await prisma.location.create({
        data: { name: "Gudang Utama", type: "PHYSICAL" },
    });
    const rackA = await prisma.location.create({
        data: { name: "Rak A", type: "PHYSICAL", parentId: warehouse.id },
    });
    const rackB = await prisma.location.create({
        data: { name: "Rak B", type: "PHYSICAL", parentId: warehouse.id },
    });
    const store = await prisma.location.create({
        data: { name: "Toko Depan", type: "PHYSICAL" },
    });
    const transit = await prisma.location.create({
        data: { name: "Transit", type: "VIRTUAL" },
    });
    const qc = await prisma.location.create({
        data: { name: "Quality Control", type: "VIRTUAL" },
    });
    const dropship = await prisma.location.create({
        data: { name: "Dropship", type: "VIRTUAL" },
    });
    console.log("✅ Locations created");

    // Create Products
    const products = [
        { sku: "ELK-001", name: "Kabel USB-C 1m", categoryId: categories[0].id, unit: "pcs", minStock: 50, currentStock: 120 },
        { sku: "ELK-002", name: "Charger 20W", categoryId: categories[0].id, unit: "pcs", minStock: 30, currentStock: 15 },
        { sku: "FRN-001", name: "Meja Kerja 120cm", categoryId: categories[1].id, unit: "unit", minStock: 5, currentStock: 12 },
        { sku: "FRN-002", name: "Kursi Ergonomis", categoryId: categories[1].id, unit: "unit", minStock: 10, currentStock: 3 },
        { sku: "ATK-001", name: "Pulpen Hitam", categoryId: categories[2].id, unit: "lusin", minStock: 20, currentStock: 45 },
        { sku: "ATK-002", name: "Kertas A4 80gsm", categoryId: categories[2].id, unit: "rim", minStock: 10, currentStock: 25 },
        { sku: "BBK-001", name: "Resin Epoxy 1kg", categoryId: categories[3].id, unit: "kg", minStock: 15, currentStock: 8 },
        { sku: "PKG-001", name: "Kardus Box 30x20", categoryId: categories[4].id, unit: "pcs", minStock: 100, currentStock: 250 },
    ];

    for (const p of products) {
        await prisma.product.upsert({
            where: { sku: p.sku },
            update: {},
            create: {
                ...p,
                createdBy: admin.id,
            },
        });
    }
    console.log("✅ Products created:", products.length);

    // Create some movements for chart data
    const allProducts = await prisma.product.findMany();
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const movementCount = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < movementCount; j++) {
            const product = allProducts[Math.floor(Math.random() * allProducts.length)];
            await prisma.movement.create({
                data: {
                    productId: product.id,
                    fromLocationId: warehouse.id,
                    toLocationId: [rackA.id, rackB.id, store.id, transit.id][Math.floor(Math.random() * 4)],
                    quantity: Math.floor(Math.random() * 10) + 1,
                    notes: `Seed movement #${i}-${j}`,
                    movedBy: admin.id,
                    createdAt: date,
                },
            });
        }
    }
    console.log("✅ Sample movements created");

    console.log("🎉 Seeding complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
