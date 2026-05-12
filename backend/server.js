const express = require('express');
const carbone = require('carbone');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const AdmZip = require('adm-zip');

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
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext);
        const filename = `${base}_${Date.now()}${ext}`;
        cb(null, filename);
    },
});
const uploadTemplate = multer({
    storage: templateStorage,
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() !== '.docx') {
            return cb(new Error('Hanya file .docx yang diizinkan'));
        }
        cb(null, true);
    },
});

// ─── Multer: upload JSON (memory) ────────────────────────────────────────────
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
// HELPER: applyDocxMode
//
// Membaca DOCX dari path, scan setiap <w:r> (text run) di word/document.xml,
// lalu putihkan teks berdasarkan mode:
//
//   "value_only"     → placeholder {d.xxx} tampil, teks statis putih
//                      (untuk print di atas kertas template bertandatangan)
//
//   "empty_template" → teks statis tampil, placeholder {d.xxx} putih
//                      (untuk cetak template kosong siap tandatangan)
//
// Return: Buffer DOCX yang sudah dimodifikasi
// ────────────────────────────────────────────────────────────────────────────
function applyDocxMode(templatePath, mode) {
    const PLACEHOLDER_REGEX = /\{d\.[a-zA-Z0-9_.]+\}/;

    const zip = new AdmZip(templatePath);
    const docEntry = zip.getEntry('word/document.xml');
    if (!docEntry) throw new Error('word/document.xml tidak ditemukan di DOCX');

    let xml = docEntry.getData().toString('utf-8');

    xml = xml.replace(/<w:r[ >][\s\S]*?<\/w:r>/g, (run) => {
        const textMatches = run.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
        const fullText = textMatches
            .map(t => t.replace(/<w:t[^>]*>|<\/w:t>/g, ''))
            .join('');

        // Teks kosong / whitespace → jangan ubah apapun
        if (!fullText.trim()) return run;

        const isPlaceholder = PLACEHOLDER_REGEX.test(fullText);

        if (mode === 'value_only') {
            // Putihkan teks statis, biarkan placeholder
            return isPlaceholder ? run : makeRunWhite(run);
        }

        if (mode === 'empty_template') {
            // Putihkan placeholder, biarkan teks statis
            return isPlaceholder ? makeRunWhite(run) : run;
        }

        return run;
    });

    zip.updateFile('word/document.xml', Buffer.from(xml, 'utf-8'));
    return zip.toBuffer();
}

// ─── Inject warna putih ke <w:rPr> sebuah text run ───────────────────────────
function makeRunWhite(run) {
    const WHITE_COLOR = '<w:color w:val="FFFFFF"/>';

    if (/<w:rPr>/.test(run)) {
        if (/<w:color\s/.test(run)) {
            // Sudah ada <w:color> → ganti nilainya
            return run.replace(/<w:color[^/]*\/>/g, WHITE_COLOR);
        }
        // Ada <w:rPr> tapi belum ada <w:color> → inject setelah tag buka
        return run.replace('<w:rPr>', `<w:rPr>${WHITE_COLOR}`);
    }

    // Belum ada <w:rPr> sama sekali → buat baru sebelum <w:t>
    return run.replace(/(<w:t[ >])/, `<w:rPr>${WHITE_COLOR}</w:rPr>$1`);
}

// ────────────────────────────────────────────────────────────────────────────
// POST /upload-template
// Body  : multipart/form-data → field "template" (.docx)
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
//         - field "templateId"   : nama file template (dari /upload-template)
//         - field "json"         : file .json berisi data (wajib kecuali mode empty_template)
//         - field "mode"         : "full" (default) | "value_only" | "empty_template"
//
// mode "full"           → render normal, semua konten template + value tampil
// mode "value_only"     → teks statis putih, hanya {d.xxx} yang tampil
//                         (print di atas kertas template bertandatangan)
// mode "empty_template" → placeholder putih, hanya teks statis yang tampil
//                         (cetak template kosong untuk ditandatangani)
//                         JSON tidak diperlukan untuk mode ini
//
// Return: binary PDF
// ────────────────────────────────────────────────────────────────────────────
app.post('/generate-pdf', uploadJson.single('json'), (req, res) => {
    const { templateId, mode = 'full' } = req.body;
    const VALID_MODES = ['full', 'value_only', 'empty_template'];

    // ── Validasi ─────────────────────────────────────────────────────────────
    if (!templateId) return res.status(400).json({ error: 'templateId wajib diisi' });
    if (!VALID_MODES.includes(mode)) {
        return res.status(400).json({ error: `mode harus salah satu dari: ${VALID_MODES.join(', ')}` });
    }

    // JSON wajib untuk mode full & value_only, opsional untuk empty_template
    if (mode !== 'empty_template' && !req.file) {
        return res.status(400).json({ error: 'File .json wajib untuk mode ' + mode });
    }

    // ── Parse JSON (skip jika empty_template) ────────────────────────────────
    let data = {};
    if (req.file) {
        try {
            data = JSON.parse(req.file.buffer.toString('utf-8'));
        } catch (e) {
            return res.status(400).json({ error: 'Format JSON tidak valid: ' + e.message });
        }
    }

    // ── Cek template ada ─────────────────────────────────────────────────────
    const templatePath = path.join(TEMPLATES_DIR, templateId);
    if (!fs.existsSync(templatePath)) {
        return res.status(404).json({ error: `Template '${templateId}' tidak ditemukan` });
    }

    console.log(`🔄 Render: template=${templateId} | mode=${mode}${req.file ? ` | data keys=${Object.keys(data).join(', ')}` : ''}`);

    // ── Siapkan source render ─────────────────────────────────────────────────
    // mode "full"           → pakai path asli langsung
    // mode "value_only"     → modifikasi DOCX, teks statis putih
    // mode "empty_template" → modifikasi DOCX, placeholder putih
    let renderSource = templatePath;
    let tempFilePath = null;

    if (mode === 'value_only' || mode === 'empty_template') {
        try {
            const modifiedBuffer = applyDocxMode(templatePath, mode);
            tempFilePath = path.join('/tmp', `${mode}_${Date.now()}_${templateId}`);
            fs.writeFileSync(tempFilePath, modifiedBuffer);
            renderSource = tempFilePath;
        } catch (e) {
            console.error(`❌ applyDocxMode(${mode}) error:`, e.message);
            return res.status(500).json({
                error: `Gagal memproses template mode ${mode}: ` + e.message,
            });
        }
    }

    // ── Cleanup helper ────────────────────────────────────────────────────────
    const cleanupTemp = () => {
        if (tempFilePath) fs.unlink(tempFilePath, () => { });
    };
    res.on('finish', cleanupTemp);
    res.on('close', cleanupTemp);

    // ── Render via Carbone ────────────────────────────────────────────────────
    const options = { convertTo: 'pdf', timeout: 60000 };

    carbone.render(renderSource, data, options, (err, result) => {
        if (err) {
            console.error('❌ Carbone error:', err.message);
            return res.status(500).json({
                error: err.message,
                hint: 'Pastikan LibreOffice terinstall dan template valid',
            });
        }

        console.log(`✅ PDF berhasil: ${result.length} bytes | mode=${mode}`);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="preview.pdf"`);
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