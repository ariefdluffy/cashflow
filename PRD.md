# PRD - Cash Flow Dashboard

## 1. Overview

### Nama Aplikasi

Cash Flow Dashboard

### Tujuan

Menyediakan dashboard monitoring arus uang masuk dan keluar secara realtime menggunakan data yang berasal dari Google Sheets.

Aplikasi digunakan untuk:

* Monitoring pemasukan harian
* Monitoring pengeluaran harian
* Melihat cash flow periode tertentu
* Analisis tren pemasukan dan pengeluaran
* Menjadi dashboard keuangan sederhana tanpa perlu login ke aplikasi akuntansi kompleks

---

# 2. Tech Stack

## Frontend

* Svelte 5
* SvelteKit
* TypeScript
* Tailwind CSS v4
* Chart.js atau ApexCharts
* TanStack Table

## Backend

* SvelteKit Server Routes
* Bun Runtime
* Google Sheets API

## Production

* Ubuntu Server
* Bun
* PM2
* Nginx Reverse Proxy
* SSL Let's Encrypt

---

# 3. Data Source

## Google Spreadsheet

Source:

https://docs.google.com/spreadsheets/d/1e9zWYNdSXFpDapCj20hO6I_1EAIFlND-s53ywRtOxZY

### Struktur Data

| Tanggal    | Kategori    | Keterangan       | Jenis  | Nominal |
| ---------- | ----------- | ---------------- | ------ | ------- |
| 2026-06-01 | Penjualan   | Penjualan Produk | Masuk  | 1000000 |
| 2026-06-01 | Operasional | Bayar Hosting    | Keluar | 150000  |

### Jenis

* Masuk
* Keluar

---

# 4. Single Page Layout

## Header

Menampilkan:

* Nama aplikasi
* Last sync time
* Status koneksi Google Sheet

Contoh:

Cash Flow Dashboard

Last Sync:
10 Juni 2026 13:30

Status:
● Connected

---

# 5. Dashboard Statistics

Card Statistik:

### Total Pemasukan

Rp 150.000.000

### Total Pengeluaran

Rp 80.000.000

### Saldo Bersih

Rp 70.000.000

### Jumlah Transaksi

500

### Rata-rata Harian

Rp 3.500.000

### Pengeluaran Terbesar

Rp 15.000.000

---

# 6. Filter Data

Filter periode:

* Hari Ini
* 7 Hari
* 30 Hari
* Bulan Ini
* Tahun Ini
* Custom Date Range

Komponen:

Date Range Picker

Realtime update seluruh widget saat filter berubah.

---

# 7. Grafik

## Diagram Arus Kas

Line Chart

Menampilkan:

* Pemasukan
* Pengeluaran

berdasarkan waktu.

---

## Diagram Perbandingan

Bar Chart

Menampilkan:

* Total Masuk
* Total Keluar

---

## Diagram Kategori

Donut Chart

Menampilkan pengeluaran berdasarkan kategori.

Contoh:

* Operasional
* Gaji
* Marketing
* Hosting
* Lainnya

---

# 8. Tabel Transaksi

Fitur:

* Pagination
* Sorting
* Search
* Export CSV

Kolom:

| Tanggal | Kategori | Keterangan | Jenis | Nominal |
| ------- | -------- | ---------- | ----- | ------- |

Warna:

Masuk:
Hijau

Keluar:
Merah

---

# 9. Log Aktivitas

Menampilkan perubahan terbaru dari Google Sheet.

Contoh:

13:00

* Pemasukan Rp 2.000.000

13:05

* Pengeluaran Rp 500.000

13:10

* Pemasukan Rp 1.500.000

---

# 10. Realtime Sync

## Mekanisme

Server melakukan polling Google Sheet setiap:

30 detik

Jika terdapat perubahan:

* Refresh cache
* Broadcast ke frontend

Menggunakan:

Server Sent Events (SSE)

atau

WebSocket

Frontend langsung update tanpa refresh browser.

---

# 11. Visual Design

Tema:

Modern Dashboard HTML5

Style:

* Clean
* Financial Dashboard
* Glassmorphism ringan
* Rounded Card
* Responsive

Warna:

Primary:
#2563EB

Success:
#22C55E

Danger:
#EF4444

Background:
#F8FAFC

Dark Mode:
Support

---

# 12. Responsive Design

Desktop

Tablet

Mobile

Breakpoint:

* Mobile
* Tablet
* Desktop
* Large Screen TV

---

# 13. Optional Feature (Recommended)

## A. Forecast Cash Flow

Prediksi saldo 30 hari ke depan.

Menggunakan:

Moving Average

---

## B. Top Categories

Menampilkan kategori pengeluaran terbesar.

---

## C. Cash Burn Rate

Menampilkan:

"Jika tidak ada pemasukan lagi, saldo cukup untuk 75 hari."

---

## D. Monthly Trend

Perbandingan bulan sekarang dan bulan sebelumnya.

---

## E. Export Report

Export:

* CSV
* Excel
* PDF

---

## F. Auto Refresh Toggle

Pilihan:

* Manual
* 30 Detik
* 1 Menit
* 5 Menit

---

## G. PWA Support

Install sebagai aplikasi desktop/mobile.

---

# 14. API Structure

GET

/api/stats

Response:

{
totalIncome: 150000000,
totalExpense: 80000000,
balance: 70000000
}

GET

/api/transactions

GET

/api/charts

GET

/api/logs

GET

/api/realtime

(SSE Endpoint)

---

# 15. Folder Structure

src/

├── routes/

│ ├── +page.svelte

│ └── api/

│ ├── stats/

│ ├── charts/

│ ├── logs/

│ └── transactions/

│

├── lib/

│ ├── services/

│ │ ├── google-sheet.ts

│ │ ├── cache.ts

│ │ └── realtime.ts

│ │

│ ├── stores/

│ │ ├── stats.ts

│ │ └── filters.ts

│ │

│ ├── components/

│ │ ├── Header.svelte

│ │ ├── StatCard.svelte

│ │ ├── CashChart.svelte

│ │ ├── CategoryChart.svelte

│ │ ├── TransactionTable.svelte

│ │ └── ActivityLog.svelte

│

└── app.html

---

# 16. Bun Scripts

package.json

{
"scripts": {
"dev": "bun run --hot src/index.ts",
"build": "vite build",
"preview": "vite preview"
}
}

---

# 17. PM2 Ecosystem

ecosystem.config.cjs

module.exports = {
apps: [
{
name: "cashflow-dashboard",
script: "build/index.js",
interpreter: "bun"
}
]
}

---

# 18. Success Metrics

Dashboard berhasil jika:

* Data tampil < 2 detik
* Realtime update < 30 detik
* Mobile friendly
* Tidak perlu input manual selain Google Sheet
* Uptime > 99%
