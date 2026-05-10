# Carbone Template Generator

POC (Proof of Concept) untuk generate dokumen PDF dari template `.docx` menggunakan [Carbone.js](https://carbone.io/), dengan konversi via LibreOffice di dalam Docker container.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Vite + React + TypeScript + Tailwind CSS |
| State Management | Zustand |
| HTTP Client | Axios |
| Backend | Express.js + Carbone.js + Multer |
| PDF Converter | LibreOffice (headless) |
| Container | Docker + Docker Compose |

---

## Struktur Project

```
.
├── backend/
│   ├── templates/          # Template .docx tersimpan di sini (persistent)
│   ├── server.js           # Express API
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── TemplateGenerator.tsx   # Komponen utama
│   │   └── stores/
│   │       └── useTemplateStore.ts     # Zustand store
│   ├── .env
│   └── package.json
└── docker-compose.yml
```

---

## Flow Aplikasi

```
1. User upload template (.docx)
         ↓
   POST /upload-template
   → template disimpan permanen di backend/templates/
   → response: { templateId }
         ↓
2. User upload file data (.json)
         ↓
   POST /generate-pdf
   → Carbone merge template + data
   → LibreOffice konversi ke PDF
   → response: binary PDF
         ↓
3. Preview PDF di browser + tombol Download
```

---

## API Reference

### `POST /upload-template`

Upload file template `.docx` ke server.

**Request** — `multipart/form-data`

| Field | Tipe | Keterangan |
|---|---|---|
| `template` | File | File `.docx` template Carbone |

**Response**
```json
{
  "templateId": "surat_kontrak_1746123456789.docx",
  "originalName": "surat_kontrak.docx",
  "uploadedAt": "2025-05-01T10:00:00.000Z"
}
```

---

### `GET /templates`

Ambil daftar semua template yang tersimpan di server.

**Response**
```json
[
  {
    "templateId": "surat_kontrak_1746123456789.docx",
    "size": 12345,
    "uploadedAt": "2025-05-01T10:00:00.000Z"
  }
]
```

---

### `POST /generate-pdf`

Generate PDF dari template dan data JSON.

**Request** — `multipart/form-data`

| Field | Tipe | Keterangan |
|---|---|---|
| `templateId` | string | Nama file dari response `/upload-template` |
| `json` | File | File `.json` berisi data untuk mengisi template |

**Response** — `application/pdf` (binary)

**Contoh file `.json`**
```json
{
  "nama": "ADI",
  "jenis_kelamin": "L",
  "alamat": "BEKASI"
}
```

**Contoh variabel di template `.docx`** (sintaks Carbone)
```
{d.nama}
{d.jenis_kelamin}
{d.alamat}
```

---

## Cara Menjalankan

### Prasyarat

- [Docker](https://www.docker.com/) & Docker Compose terinstall
- Node.js 18+ (untuk development lokal)

### 1. Clone & setup environment

```bash
git clone <repo-url>
cd <repo-folder>

# Setup env frontend
cp frontend/.env.example frontend/.env
```

Isi `frontend/.env`:
```env
VITE_API_BASE=http://localhost:3001
```

### 2. Jalankan dengan Docker

```bash
docker compose up --build
```

Setelah build selesai:
- **Frontend** → `http://localhost:5173`
- **Backend API** → `http://localhost:3001`

### 3. Jalankan lokal (tanpa Docker)

> Membutuhkan LibreOffice terinstall di sistem.

**Backend**
```bash
cd backend
npm install
node server.js
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## Verifikasi LibreOffice di Container

Setelah container berjalan, pastikan LibreOffice terdeteksi:

```bash
# Masuk ke container
docker exec -it carbone-api bash

# Cek versi
libreoffice --version

# Test konversi manual
HOME=/tmp libreoffice --headless --convert-to pdf /app/templates/contoh.docx --outdir /tmp
```

---

## Catatan Pengembangan

- Template `.docx` disimpan **permanen** di `backend/templates/` dan di-mount via Docker volume, sehingga tidak hilang saat container restart.
- File `.json` hanya diproses di memory (tidak disimpan ke disk).
- LibreOffice berjalan **headless** di dalam container dengan `HOME=/tmp` untuk menghindari konflik profil user.
- Timeout render di-set **60 detik** untuk mengakomodasi cold start LibreOffice.
- PDF URL di frontend otomatis di-revoke saat reset untuk mencegah memory leak.

---

## Troubleshooting

**PDF tidak keluar, masih `.docx`**
Pastikan `options` dipass sebagai argumen ke-3 di `carbone.render()`:
```js
// ✅ Benar
carbone.render(templatePath, data, { convertTo: 'pdf' }, callback);
```

**LibreOffice tidak terdeteksi**
```bash
# Cek path binary
docker exec -it carbone-api which libreoffice
docker exec -it carbone-api ls /usr/lib/libreoffice/program/soffice
```

**Alignment tidak sesuai di PDF**
Gunakan tabel tanpa border di template `.docx` untuk alignment kolom label dan value, daripada menggunakan tab character.
