# Final Project LBE - ALPRO | Website FRS

Aplikasi web full-stack untuk memfasilitasi mahasiswa dalam menyusun dan merencanakan mata kuliah semesteran (FRS) secara interaktif, terstruktur, dan tervalidasi secara real-time.

---

## Problem

Pada masa pengisian Formulir Rencana Studi (FRS) setiap awal semester, mahasiswa sering kali menghadapi kendala teknis dan administratif, seperti:
1. **Ketidakpastian Kuota Kelas:** Mahasiswa kesulitan mengetahui secara langsung apakah suatu kelas masih memiliki kapasitas kuota yang mencukupi.
2. **Potensi Over-Credit (Kelebihan SKS):** Rentannya kesalahan mahasiswa dalam mengambil beban studi yang melampaui batas maksimum SKS yang diizinkan (maksimal 24 SKS).
3. **Kebutuhan Transaksi Real-Time:** Diperlukannya antarmuka akademik yang ringan, cepat, dan memiliki validasi ketat di sisi backend agar tidak terjadi duplikasi pemilihan mata kuliah yang sama.

---

## Features

- **Autentikasi Mahasiswa Sederhana:** Masuk ke portal FRS menggunakan Username atau NRP mahasiswa.
- **Katalog Mata Kuliah Interaktif:** Menampilkan daftar mata kuliah yang dibuka pada semester berjalan lengkap dengan kode matkul, beban SKS, dan sisa kapasitas kuota.
- **Pencarian Mata Kuliah Instan (Live Search):** Filter katalog mata kuliah berdasarkan nama atau kode matkul tanpa memuat ulang halaman.
- **Validasi Bisnis Backend:**
  - Pengecekan kapasitas kuota kelas sebelum pendaftaran disetujui.
  - Pengecekan batas akumulasi SKS (maksimal 24 SKS).
  - Pencegahan pendaftaran ganda (*duplicate enrollment*) untuk mata kuliah yang sama.
- **Manajemen FRS Real-Time:** Pengambilan (*Enroll*) dan pembatalan (*Drop*) mata kuliah secara langsung dengan pembaruan data instan.
- **Visualisasi Beban Studi:** Indikator *progress bar* dinamis yang menghitung total SKS terambil terhadap batas maksimal.
- **Cetak Dokumen FRS:** Fitur cetak ringkasan FRS yang siap disimpan ke format PDF atau dicetak langsung via browser.
- **Dokumentasi API Interaktif:** Swagger UI terintegrasi untuk melihat spesifikasi dan uji coba endpoint REST API.
- **Automated API Testing:** Koleksi pengujian otomatis menggunakan Bruno API Client.

---

## Tech Stack

### Frontend
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS

### Backend
- **Language:** Go (Golang)
- **Web Framework:** Gin Web Framework
- **ORM:** GORM
- **Database:** PostgreSQL
- **API Documentation:** Swagger (`swaggo/gin-swagger`)

### API Testing
- **Tool:** Bruno API Client

---

## Struktur Project

```text
.
├── frs-its-backend/
│   ├── config/
│   │   └── database.go          # Konfigurasi koneksi PostgreSQL & seeder
│   ├── controllers/
│   │   ├── auth.go              # Handler autentikasi login mahasiswa
│   │   ├── course.go            # Handler pengambilan katalog mata kuliah
│   │   └── enrollment.go        # Handler transaksi FRS (enroll & drop)
│   ├── docs/                    # Berkas dokumentasi Swagger (auto-generated)
│   ├── models/
│   │   └── models.go            # Struct model database & payload API
│   ├── testing/                 # Koleksi pengujian API Bruno
│   │   └── FRS API/
│   │       ├── bruno.json
│   │       ├── Get All Courses.bru
│   │       ├── Enroll Course.bru
│   │       ├── Get Student FRS.bru
│   │       ├── Drop Course.bru
│   │       └── Login Student.bru
│   ├── go.mod
│   ├── go.sum
│   └── main.go                  # Entry point & routing REST API
│
├── frs-its-frontend/
│   ├── app/
│   │   ├── layout.tsx           # Layout utama & judul tab metadata
│   │   ├── page.tsx             # Halaman portal FRS & form login
│   │   └── globals.css
│   ├── public/                  # Aset statis & logo
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

---

## Cara Menjalankan Project

### Prasyarat Sistem
- **Go** (versi 1.20 ke atas)
- **Node.js** (versi 18 ke atas) & **npm**
- **PostgreSQL** aktif di port `5432`

---

### 1. Persiapan Database
1. Buka terminal atau **SQL Shell (psql)**, lalu buat database baru:
   ```sql
   CREATE DATABASE frs_db;
   ```
2. Pastikan konfigurasi pada `frs-its-backend/config/database.go` telah sesuai dengan setelan PostgreSQL lokal Anda (user, password, port, dan nama database).

---

### 2. Menjalankan Backend (Golang)
1. Masuk ke direktori backend:
   ```bash
   cd frs-its-backend
   ```
2. Unduh seluruh dependensi Go:
   ```bash
   go mod tidy
   ```
3. Jalankan server backend:
   ```bash
   go run main.go
   ```
4. Backend akan berjalan di: **`http://localhost:8080`** (Database akan otomatis membuat tabel dan mengisi data seeder awal).

---

### 3. Menjalankan Frontend (Next.js)
1. Buka terminal baru, lalu masuk ke direktori frontend:
   ```bash
   cd frs-its-frontend
   ```
2. Pasang paket dependensi:
   ```bash
   npm install
   ```
3. Jalankan server pengembang:
   ```bash
   npm run dev
   ```
4. Akses antarmuka web melalui browser pada alamat: **`http://localhost:3000`**

---

### 4. Kredensial Akun Demo
Gunakan akun bawaan sistem berikut untuk masuk ke aplikasi:
- **Username / NRP:** `budi` (atau `5025241001`)
- **Password:** `123`

---

## Dokumentasi API

Dokumentasi REST API interaktif menggunakan Swagger UI dapat diakses langsung melalui browser saat server backend berjalan:

**URL Swagger:** `http://localhost:8080/swagger/index.html`

### Ringkasan Endpoint

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| **POST** | `/api/login` | Autentikasi dan login mahasiswa |
| **GET** | `/api/courses` | Mendapatkan seluruh daftar katalog mata kuliah |
| **GET** | `/api/frs/:student_id` | Mendapatkan daftar FRS dan total SKS mahasiswa |
| **POST** | `/api/frs/enroll` | Mendaftarkan mata kuliah ke FRS mahasiswa |
| **DELETE** | `/api/frs/:id` | Membatalkan (*drop*) mata kuliah dari FRS |

---

## Pengujian API (API Testing)

Pengujian endpoint telah disiapkan menggunakan **Bruno API Client** dengan *assertion test* otomatis (`res.status == 200`). Koleksi pengujian tersimpan pada direktori:
```text
frs-its-backend/testing/FRS API/
```
Untuk menggunakannya, buka aplikasi Bruno, pilih opsi **Open Collection**, lalu arahkan ke folder tersebut.
