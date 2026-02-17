1. Project Overview
Target Domain: stock.aarasa.click

Tech Stack: Next.js (App Router), Tailwind CSS, MySQL (Existing VPS), Context7 Integration (Backend standards).

Infrastructure: Ubuntu 25.04 VPS, Nginx, Node.js environment.

Core Goal: Sistem manajemen inventaris berbasis SKU dengan fitur QR Code otomatis, manajemen lokasi (fisik/virtual), dan kontrol akses granular.

2. System Architecture & Tech Stack
Component,Specification
Frontend,"Next.js (Latest), Tailwind CSS (Responsive Design)"
Backend,Node.js / Next.js Server Actions (Ref: Context7 protocols)
Database,MySQL (Connection via Prisma or TypeORM for type-safety)
Authentication,NextAuth.js or JWT-based RBAC
Features,"QR Code Generator (Canvas/SVG), Recharts (Dashboard)"

3. User Roles & Permissions
- Admin: Full access (CRUD Products, Locations, Users, Audit Logs, Settings).
-Viewer: * Read-only access.
    - Granular Restriction: Hanya dapat melihat produk berdasarkan "Kategori Barang" yang diizinkan oleh Admin.

4. Functional Requirements
A. Product Management (SKU-Based)
- Attributes: SKU (Unique), Nama, Kategori, Deskripsi, Satuan.
- Stock Logic: * Min_Stock threshold.
    - Status Indicators: Low Stock (Current < Min), In Stock (Current >= Min), Over Stock (Current > 2x Min).
- QR Code: Generate otomatis setiap SKU tersimpan. Fitur "Print Label" (Format 50x30mm atau custom).

B. Location Management
- Physical Location: Gudang A, Rak B, Toko C.
- Virtual Location: Transit, Dropship, Quality Control.

C. Inventory Movement & Audit Trail
- Movement Log: Record setiap perpindahan (Dari Lokasi A ke Lokasi B).
- Audit Trail: Log sistem (Siapa, Melakukan Apa, Kapan) untuk transparansi data.

5. UI/UX Pages Description
1. Dashboard: Ringkasan statistik (Total SKU, Low Stock Alerts, Chart pergerakan barang 7 hari terakhir).
2. Product List: Table view dengan filter kategori & status stock. Tombol "Print QR".
3. Movement Page: Form input mutasi barang & history log.
4. Location Page: Manajemen daftar lokasi fisik/virtual.
5. User/Audit Page: Pengaturan akses viewer dan log aktivitas.