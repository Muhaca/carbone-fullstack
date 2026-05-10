process.env.PATH += ':/usr/lib/libreoffice/program';

const express = require('express');
const carbone = require('carbone');
const path = require('path');

const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const AdmZip = require('adm-zip');

// ✅ Carbone v3: gunakan LIBREOFFICE_PATH env atau path ke binary langsung
// Cek binary yang tersedia dulu
const libreofficePaths = [
    '/usr/bin/libreoffice',
    '/usr/bin/soffice',
    '/usr/lib/libreoffice/program/soffice',
    '/usr/local/bin/soffice'
];

let libreofficebin = null;
for (const p of libreofficePaths) {
    if (fs.existsSync(p)) {
        libreofficebin = p;
        console.log(`✅ LibreOffice ditemukan di: ${p}`);
        break;
    }
}

if (!libreofficebin) {
    console.error('❌ LibreOffice tidak ditemukan! PDF conversion tidak akan berjalan.');
}

// Set Carbone dengan benar untuk v3
carbone.set({
    tempPath: '/tmp',
    // factories untuk v3 adalah jumlah worker, bukan path!
    // Gunakan env variable untuk binary path
});

// Set env agar carbone/LibreOffice bisa jalan
process.env.HOME = '/tmp';
if (libreofficebin) {
    // Carbone v3 membaca LIBREOFFICE_PATH atau mencari di PATH
    process.env.LIBREOFFICE_PATH = path.dirname(libreofficebin);
}

const app = express();
app.use(cors());
app.use(express.json());

// 1. Konfigurasi Penyimpanan Upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'templates');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Simpan dengan nama unik agar tidak tertimpa
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        // Hanya izinkan format office
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            cb(null, true);
        } else {
            cb(new Error('Hanya file .docx yang diperbolehkan!'));
        }
    }
});

// 2. Endpoint: Upload Template
app.post('/upload-template', upload.single('template'), (req, res) => {
    if (!req.file) return res.status(400).send('Gagal upload.');

    const filePath = req.file.path;
    const zip = new AdmZip(filePath);
    const contentXml = zip.readAsText("word/document.xml");

    // Regex untuk mencari pola {d.apapun}
    const regex = /\{d\.([\w.]+)\}/g;
    const tags = new Set();
    let match;

    while ((match = regex.exec(contentXml)) !== null) {
        tags.add(match[1]); // Ambil nama variabelnya saja
    }

    res.json({
        templateId: req.file.filename,
        detectedTags: Array.from(tags) // Contoh: ["nama", "alamat", "tanggal"]
    });
});

// ✅ Endpoint generate-preview yang benar
app.post('/generate-preview', (req, res) => {
    const { templateId, data } = req.body;
    const templatePath = path.join(__dirname, 'templates', templateId);

    // Validasi template ada
    if (!fs.existsSync(templatePath)) {
        return res.status(404).send(`Template '${templateId}' tidak ditemukan`);
    }

    const options = {
        convertTo: 'pdf',
        timeout: 60000 // Naikkan timeout, LibreOffice butuh waktu cold start
    };

    // ✅ PASTIKAN options dipass sebagai argumen ke-3!
    carbone.render(templatePath, data, options, (err, result) => {
        if (err) {
            console.error("--- CARBONE ERROR ---");
            console.error("Message:", err.message);
            console.error("Stack:", err.stack);
            console.error("LibreOffice bin:", libreofficebin);
            console.error("HOME:", process.env.HOME);
            console.error("---------------------");
            return res.status(500).json({
                error: err.message,
                libreoffice: libreofficebin,
                hint: !libreofficebin ? 'LibreOffice tidak terinstall dengan benar' : 'Cek log untuk detail'
            });
        }

        console.log(`✅ PDF berhasil digenerate, size: ${result.length} bytes`);
        res.contentType("application/pdf");
        res.send(result);
    });
});


const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Backend siap di http://localhost:${PORT}`);
});
