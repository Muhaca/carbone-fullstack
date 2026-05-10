import axios from "axios";
import { useTemplateStore } from "../store/useTemplateStore";
import { DownloadIcon, PdfIcon, RefreshIcon, Spinner, UploadIcon, XIcon } from "./CustomIcons";
import { Card } from "./Card";
import { JsonPreview } from "./JsonPreview";
import { DropZone } from "./DropZone";
import { API_BASE } from "../api/client";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UploadTemplateResponse {
    templateId: string;
    originalName: string;
    uploadedAt: string;
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
                    <h1 className="text-2xl font-bold text-gray-900">Proof of Concept Sicetak Template</h1>
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
