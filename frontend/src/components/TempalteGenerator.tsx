import { useRef, useCallback, useEffect, useState, type DragEvent, type ChangeEvent } from "react";
import axios from "axios";
import { useTemplateStore } from "../store/useTemplateStore";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UploadTemplateResponse {
    templateId: string;
    originalName: string;
    uploadedAt: string;
}

// ─── Ikon SVG ─────────────────────────────────────────────────────────────────
const UploadIcon = () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const CheckIcon = () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const DownloadIcon = () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const RefreshIcon = () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <polyline points="23 4 23 10 17 10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const PdfIcon = () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
);
const XIcon = () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = () => (
    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
);

// ─── DropZone ─────────────────────────────────────────────────────────────────
interface DropZoneProps {
    accept: string;
    label: string;
    hint: string;
    file: File | null;
    onFile: (f: File) => void;
    disabled?: boolean;
}

function DropZone({ accept, label, hint, file, onFile, disabled = false }: DropZoneProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const handleDrop = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setDragging(false);
            if (disabled) return;
            const f = e.dataTransfer.files[0];
            if (f) onFile(f);
        },
        [disabled, onFile]
    );

    const borderColor = dragging ? "border-indigo-400" : file ? "border-green-400" : "border-gray-300";
    const bgColor = dragging ? "bg-indigo-50" : file ? "bg-green-50" : "bg-gray-50";

    return (
        <div
            onClick={() => !disabled && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`
        border-2 border-dashed rounded-xl px-5 py-6 text-center transition-all duration-200
        ${borderColor} ${bgColor}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-indigo-400 hover:bg-indigo-50"}
      `}
        >
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    if (e.target.files?.[0]) onFile(e.target.files[0]);
                }}
            />

            {file ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                    <span className="text-green-500"><CheckIcon /></span>
                    <span className="font-semibold text-sm truncate max-w-[220px]">{file.name}</span>
                </div>
            ) : (
                <>
                    <div className="flex justify-center text-gray-400 mb-2"><UploadIcon /></div>
                    <p className="text-sm font-semibold text-gray-700">{label}</p>
                    <p className="text-xs text-gray-400 mt-1">{hint}</p>
                </>
            )}
        </div>
    );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps {
    number: string;
    title: string;
    done: boolean;
    doneLabel?: string | null;
    disabled?: boolean;
    children: React.ReactNode;
}

function Card({ number, title, done, doneLabel, disabled = false, children }: CardProps) {
    return (
        <div
            className={`
        bg-white rounded-2xl shadow-sm overflow-hidden transition-opacity duration-200
        ${done ? "border border-green-200" : "border border-gray-200"}
        ${disabled ? "opacity-50 pointer-events-none" : ""}
      `}
        >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
                <div
                    className={`
            w-7 h-7 rounded-full flex items-center justify-center shrink-0
            text-sm font-bold transition-colors duration-200
            ${done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}
          `}
                >
                    {done ? <CheckIcon /> : number}
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-900">{title}</p>
                    {doneLabel && (
                        <p className="text-xs text-green-600 mt-0.5 truncate max-w-[260px]">✓ {doneLabel}</p>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col gap-3">{children}</div>
        </div>
    );
}

// ─── JSON Preview ─────────────────────────────────────────────────────────────
function JsonPreview({ file }: { file: File; }) {
    const [text, setText] = useState<string | null>(null);

    useEffect(() => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed: unknown = JSON.parse(e.target?.result as string);
                setText(JSON.stringify(parsed, null, 2));
            } catch {
                setText("⚠️ JSON tidak valid");
            }
        };
        reader.readAsText(file);
    }, [file]);

    if (!text) return null;

    const lines = text.split("\n");
    const preview = lines.slice(0, 12).join("\n") + (lines.length > 12 ? "\n  ..." : "");

    return (
        <pre className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-[11px] text-slate-600 overflow-x-auto max-h-36 overflow-y-auto">
            {preview}
        </pre>
    );
}

// ─── Komponen Utama ───────────────────────────────────────────────────────────
export default function TemplateGenerator() {
    const {
        templateFile, templateId, uploadingTemplate,
        jsonFile, generating,
        pdfUrl, pdfBlob,
        error,
        setTemplateFile, setTemplateId, setUploadingTemplate,
        setJsonFile, setGenerating,
        setPdf, setError, reset,
    } = useTemplateStore();

    const step1Done = !!templateId;
    const step2Ready = step1Done && !!jsonFile;

    // ── Upload Template ─────────────────────────────────────────────────────
    const handleUploadTemplate = async () => {
        if (!templateFile) return;
        setUploadingTemplate(true);
        setError(null);
        try {
            const form = new FormData();
            form.append("template", templateFile);

            const { data } = await axios.post<UploadTemplateResponse>(
                `${API_BASE}/upload-template`,
                form,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            setTemplateId(data.templateId);
        } catch (err) {
            const msg = axios.isAxiosError(err)
                ? (err.response?.data as { error?: string; })?.error ?? err.message
                : "Upload gagal";
            setError("Upload template gagal: " + msg);
        } finally {
            setUploadingTemplate(false);
        }
    };

    // ── Generate PDF ────────────────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!templateId || !jsonFile) return;
        setGenerating(true);
        setError(null);
        setPdf(null);

        try {
            const form = new FormData();
            form.append("templateId", templateId);
            form.append("json", jsonFile);

            const response = await axios.post(`${API_BASE}/generate-pdf`, form, {
                headers: { "Content-Type": "multipart/form-data" },
                responseType: "blob",
            });

            setPdf(new Blob([response.data as BlobPart], { type: "application/pdf" }));
        } catch (err) {
            let msg = "Generate gagal";
            if (axios.isAxiosError(err)) {
                // Response blob perlu di-parse manual jika error
                if (err.response?.data instanceof Blob) {
                    const text = await (err.response.data as Blob).text();
                    try { msg = (JSON.parse(text) as { error?: string; }).error ?? msg; } catch { /* noop */ }
                } else {
                    msg = (err.response?.data as { error?: string; })?.error ?? err.message;
                }
            }
            setError("Generate PDF gagal: " + msg);
        } finally {
            setGenerating(false);
        }
    };

    // ── Download ────────────────────────────────────────────────────────────
    const handleDownload = () => {
        if (!pdfBlob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(pdfBlob);
        a.download = `${templateId?.replace(".docx", "") ?? "output"}.pdf`;
        a.click();
    };

    return (
        <div className="min-h-screen w-full bg-gray-100 px-4 py-8">
            <div className="">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Carbone Template Generator</h1>
                    <p className="text-sm text-gray-500 mt-1">Upload template .docx dan data .json untuk generate PDF</p>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
                        <span>⚠️ {error}</span>
                        <button onClick={() => setError(null)} className="ml-3 hover:text-red-800 transition-colors">
                            <XIcon />
                        </button>
                    </div>
                )}

                {/* Layout — panel kiri + preview kanan */}
                <div className={`grid gap-6 items-start ${pdfUrl ? "grid-cols-[380px_1fr]" : "grid-cols-1 max-w-md"}`}>

                    {/* Panel kiri */}
                    <div className="flex flex-col gap-5">

                        {/* Step 1 */}
                        <Card number="1" title="Upload Template" done={step1Done} doneLabel={templateId}>
                            <DropZone
                                accept=".docx"
                                label="Klik atau drag .docx ke sini"
                                hint="Format: Microsoft Word (.docx)"
                                file={templateFile}
                                onFile={(f) => { setTemplateFile(f); setTemplateId(null); setPdf(null); }}
                                disabled={uploadingTemplate}
                            />
                            {templateFile && !templateId && (
                                <button
                                    onClick={handleUploadTemplate}
                                    disabled={uploadingTemplate}
                                    className={`
                    flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                    text-sm font-semibold text-white transition-all duration-200
                    ${uploadingTemplate ? "bg-gray-300 cursor-not-allowed" : "bg-indigo-500 hover:bg-indigo-600 active:scale-[.98]"}
                  `}
                                >
                                    {uploadingTemplate ? <Spinner /> : <UploadIcon />}
                                    {uploadingTemplate ? "Mengupload..." : "Upload Template"}
                                </button>
                            )}
                        </Card>

                        {/* Step 2 */}
                        <Card number="2" title="Upload Data JSON" done={false} disabled={!step1Done}>
                            <DropZone
                                accept=".json"
                                label="Klik atau drag .json ke sini"
                                hint="File JSON berisi data untuk template"
                                file={jsonFile}
                                onFile={(f) => { setJsonFile(f); setPdf(null); }}
                                disabled={!step1Done}
                            />

                            {jsonFile && <JsonPreview file={jsonFile} />}

                            <button
                                onClick={handleGenerate}
                                disabled={!step2Ready || generating}
                                className={`
                  flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                  text-sm font-semibold text-white transition-all duration-200
                  ${!step2Ready || generating ? "bg-gray-300 cursor-not-allowed" : "bg-violet-600 hover:bg-violet-700 active:scale-[.98]"}
                `}
                            >
                                {generating ? <Spinner /> : <PdfIcon />}
                                {generating ? "Memproses PDF..." : "Generate PDF"}
                            </button>
                        </Card>

                        {/* Reset */}
                        {(templateFile || pdfUrl) && (
                            <button
                                onClick={reset}
                                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                  text-sm font-semibold text-gray-500 bg-white border border-gray-200
                  hover:bg-gray-50 transition-all duration-200 active:scale-[.98]"
                            >
                                <RefreshIcon /> Reset
                            </button>
                        )}
                    </div>

                    {/* Panel kanan — PDF Preview */}
                    {pdfUrl && (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                <span className="text-sm font-semibold text-gray-900">Preview PDF</span>
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white
                    text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors duration-200"
                                >
                                    <DownloadIcon /> Download
                                </button>
                            </div>
                            <iframe
                                src={pdfUrl}
                                title="PDF Preview"
                                className="w-full border-none block"
                                style={{ height: "75vh" }}
                            />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
