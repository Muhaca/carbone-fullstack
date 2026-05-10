const express = require('express');
const carbone = require('carbone');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ─── Direktori template permanen ────────────────────────────────────────────
const TEMPLATES_DIR = path.join(__dirname, 'templates');
if (!fs.existsSync(TEMPLATES_DIR)) fs.mkdirSync(TEMPLATES_DIR, { recursive: true });

// ─── Deteksi LibreOffice binary ──────────────────────────────────────────────
const libreofficePaths = [
    '/usr/bin/libreoffice',
    '/usr/bin/soffice',
    '/usr/lib/libreoffice/program/soffice',
    '/usr/local/bin/soffice',
];
let libreofficeBin = null;
for (const p of libreofficePaths) {
    if (fs.existsSync(p)) { libreofficeBin = p; break; }
}
if (libreofficeBin) {
    process.env.LIBREOFFICE_PATH = path.dirname(libreofficeBin);
    console.log(`✅ LibreOffice: ${libreofficeBin}`);
} else {
    console.error('❌ LibreOffice tidak ditemukan!');
}
process.env.HOME = '/tmp';

carbone.set({ tempPath: '/tmp' });

// ─── Multer: upload template (.docx) ────────────────────────────────────────
const templateStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, TEMPLATES_DIR),
    filename: (req, file, cb) => {
        // Pakai nama asli + timestamp agar tidak tabrakan
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext);
        const filename = `${base}_${Date.now()}${ext}`;
        cb(null, filename);
    },
});
const uploadTemplate = multer({
    storage: templateStorage,
    fileFilter: (req, file, cb) => {
        const allowed = '.docx';
        if (path.extname(file.originalname).toLowerCase() !== allowed) {
            return cb(new Error('Hanya file .docx yang diizinkan'));
        }
        cb(null, true);
    },
});

// ─── Multer: upload JSON (memory, tidak perlu disimpan) ──────────────────────
const uploadJson = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() !== '.json') {
            return cb(new Error('Hanya file .json yang diizinkan'));
        }
        cb(null, true);
    },
});

// ────────────────────────────────────────────────────────────────────────────
// POST /upload-template
// Body  : multipart/form-data  →  field "template" (.docx)
// Return: { templateId, originalName, uploadedAt }
// ────────────────────────────────────────────────────────────────────────────
app.post('/upload-template', uploadTemplate.single('template'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'File template tidak ditemukan' });

    console.log(`📄 Template tersimpan: ${req.file.filename}`);
    res.json({
        templateId: req.file.filename,
        originalName: req.file.originalname,
        uploadedAt: new Date().toISOString(),
    });
});

// ────────────────────────────────────────────────────────────────────────────
// GET /templates
// Return: daftar template yang tersimpan di server
// ────────────────────────────────────────────────────────────────────────────
app.get('/templates', (req, res) => {
    const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.docx'));
    const list = files.map(f => {
        const stat = fs.statSync(path.join(TEMPLATES_DIR, f));
        return { templateId: f, size: stat.size, uploadedAt: stat.mtime };
    });
    res.json(list);
});

// ────────────────────────────────────────────────────────────────────────────
// POST /generate-pdf
// Body  : multipart/form-data
//         - field "json"       : file .json berisi data
//         - field "templateId" : nama file template (dari /upload-template)
// Return: binary PDF
// ────────────────────────────────────────────────────────────────────────────
app.post('/generate-pdf', uploadJson.single('json'), (req, res) => {
    // ── Validasi input ───────────────────────────────────────────────────────
    const { templateId } = req.body;
    if (!templateId) return res.status(400).json({ error: 'templateId wajib diisi' });
    if (!req.file) return res.status(400).json({ error: 'File .json tidak ditemukan' });

    // ── Parse JSON ───────────────────────────────────────────────────────────
    let data;
    try {
        data = JSON.parse(req.file.buffer.toString('utf-8'));
    } catch (e) {
        return res.status(400).json({ error: 'Format JSON tidak valid: ' + e.message });
    }

    // ── Cek template ada ─────────────────────────────────────────────────────
    const templatePath = path.join(TEMPLATES_DIR, templateId);
    if (!fs.existsSync(templatePath)) {
        return res.status(404).json({ error: `Template '${templateId}' tidak ditemukan` });
    }

    // ── Render ───────────────────────────────────────────────────────────────
    const options = { convertTo: 'pdf', timeout: 60000 };

    console.log(`🔄 Render: template=${templateId} | data keys=${Object.keys(data).join(', ')}`);

    carbone.render(templatePath, data, options, (err, result) => {
        if (err) {
            console.error('❌ Carbone error:', err.message);
            return res.status(500).json({
                error: err.message,
                hint: 'Pastikan LibreOffice terinstall dan template valid',
            });
        }

        console.log(`✅ PDF berhasil: ${result.length} bytes`);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${templateId}"`);
        res.send(result);
    });
});

// ─── Error handler multer ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || err.message) {
        return res.status(400).json({ error: err.message });
    }
    next(err);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server berjalan di port ${PORT}`));