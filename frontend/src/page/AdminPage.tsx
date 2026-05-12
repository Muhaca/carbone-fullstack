import { useEffect } from "react";
import axios from "axios";
import { useAdminStore, type TemplateItem } from "../store/Store";
import { Icons } from "../components/Icons";
import { Spinner } from "../components/Spinner";
import { ErrorBanner } from "../components/ErrorBanner";
import { DropZone } from "../components/DropZone";
import { TemplateList } from "../features/admin/TemplateList";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";

interface UploadTemplateResponse {
    templateId: string;
    originalName: string;
    uploadedAt: string;
}

// ─── Halaman Admin ────────────────────────────────────────────────────────────
export default function AdminPage() {
    const {
        templateFile, uploading, templates, loadingTemplates, error,
        setTemplateFile, setUploading, setTemplates, setLoadingTemplates,
        setError,
    } = useAdminStore();

    // Fetch daftar template saat mount
    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoadingTemplates(true);
        try {
            const { data } = await axios.get<TemplateItem[]>(`${API_BASE}/templates`);
            setTemplates(data);
        } catch {
            setError("Gagal memuat daftar template");
        } finally {
            setLoadingTemplates(false);
        }
    };

    const handleUpload = async () => {
        if (!templateFile) return;
        setUploading(true);
        setError(null);
        try {
            const form = new FormData();
            form.append("template", templateFile);

            await axios.post<UploadTemplateResponse>(
                `${API_BASE}/upload-template`,
                form,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            // Reset file input & refresh list
            setTemplateFile(null);
            await fetchTemplates();
        } catch (err) {
            const msg = axios.isAxiosError(err)
                ? (err.response?.data as { error?: string; })?.error ?? err.message
                : "Upload gagal";
            setError("Upload gagal: " + msg);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 px-4 py-8">
            <div className="max-w-2xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-indigo-100 text-indigo-600 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                            Admin
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Kelola Template</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Upload dan kelola template dokumen <span className="font-medium">.docx</span> yang akan digunakan untuk generate PDF
                    </p>
                </div>

                {/* Error */}
                {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

                <div className="flex flex-col gap-6">

                    {/* Upload card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3.5 border-b border-gray-100">
                            {Icons.upload}
                            <span className="text-sm font-semibold text-gray-900">Upload Template Baru</span>
                        </div>
                        <div className="p-4 flex flex-col gap-3">
                            <DropZone
                                accept=".docx"
                                label="Klik atau drag .docx ke sini"
                                hint="Gunakan sintaks Carbone untuk placeholder, contoh: {d.nama}"
                                file={templateFile}
                                onFile={setTemplateFile}
                                disabled={uploading}
                            />

                            {/* Info syntax reminder */}
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3.5 py-3 text-xs text-indigo-700">
                                <p className="font-semibold mb-1">Sintaks placeholder Carbone:</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono">
                                    <span>{"{d.nama}"}</span>
                                    <span>{"{d.alamat.kota}"}</span>
                                    <span>{"{d.agreement.nominal}"}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleUpload}
                                    disabled={!templateFile || uploading}
                                    className={`
                    flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                    text-sm font-semibold text-white transition-all duration-200
                    ${!templateFile || uploading
                                            ? "bg-gray-300 cursor-not-allowed"
                                            : "bg-indigo-500 hover:bg-indigo-600 active:scale-[.98]"}
                  `}
                                >
                                    {uploading ? <Spinner /> : Icons.upload}
                                    {uploading ? "Mengupload..." : "Upload Template"}
                                </button>

                                {templateFile && !uploading && (
                                    <button
                                        onClick={() => setTemplateFile(null)}
                                        className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-400
                      hover:text-gray-600 hover:bg-gray-50 transition-all duration-200"
                                    >
                                        {Icons.x}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Template list */}
                    <TemplateList
                        templates={templates}
                        loading={loadingTemplates}
                        onRefresh={fetchTemplates}
                    />

                </div>
            </div>
        </div>
    );
}