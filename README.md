# Karir Nusantara - Company Dashboard

Company Dashboard untuk platform job portal Karir Nusantara. Dashboard ini digunakan oleh perusahaan untuk mengelola lowongan pekerjaan, kandidat, dan pembayaran kuota.

## Tech Stack

- **React 18** + **TypeScript** - UI Library
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **React Router v7** - Routing
- **TanStack Query** - Data Fetching
- **Zustand** - State Management
- **React Hook Form** + **Zod** - Form Validation
- **Radix UI** - Headless Components
- **Sonner** - Toast Notifications
- **Lucide React** - Icons

## Features

### 🏢 Authentication
- Login / Register perusahaan
- Forgot Password
- Session management dengan token

### 📋 Job Management
- Buat, edit, hapus lowongan
- Status lowongan (draft/pending/open/closed)
- Detail lowongan dengan statistik pelamar

### 👥 Candidate Management
- Lihat daftar kandidat per lowongan
- Filter berdasarkan status lamaran
- CV Score dengan AI analysis
- Update status kandidat (applied → interview → accepted/rejected)

### 💳 Quota & Payment
- 5 lowongan gratis untuk setiap perusahaan baru
- Pembayaran Rp 30,000 per lowongan tambahan
- Upload bukti pembayaran
- Riwayat pembayaran

### ⚙️ Settings
- Ubah password
- Pengaturan notifikasi
- Edit profil perusahaan

### 📊 Company Status
- **Pending**: Menunggu verifikasi admin
- **Verified**: Dapat posting lowongan
- **Rejected**: Perlu update data
- **Suspended**: Akun dinonaktifkan

## Getting Started

### Prerequisites

- Node.js 18+ atau Bun
- npm / yarn / bun

### Installation

```bash
# Install dependencies
bun install
# atau
npm install

# Start development server
bun dev
# atau
npm run dev
```

### Build for Production

```bash
bun build
# atau
npm run build
```

## Project Structure

```
src/
├── api/              # API services
├── components/
│   ├── layout/       # Layout components
│   └── ui/           # UI components (shadcn/ui style)
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
├── pages/
│   ├── auth/         # Auth pages
│   └── dashboard/    # Dashboard pages
├── stores/           # Zustand stores
└── types/            # TypeScript types
```

## Design System

### Colors

- **Primary Blue**: #2563EB (bg-primary)
- **Success Emerald**: #10B981 (text-success)
- **Background**: White with gray accents
- **Text**: Gray-900 for headings, Gray-600 for body

### Typography

- **Font**: System font stack (Inter-like)
- **Headings**: Bold, Gray-900
- **Body**: Regular, Gray-600

## Payment Info

Transfer ke rekening berikut untuk pembayaran kuota tambahan:

- **Bank**: BCA
- **Nomor Rekening**: 8725164421
- **Atas Nama**: Saputra Budianto
- **Biaya per Lowongan**: Rp 30,000

## License

Proprietary - Karir Nusantara © 2026
# Karir-Nusantara-Company
