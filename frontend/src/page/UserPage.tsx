import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useUserStore } from "../store/Store";
import { type TemplateItem } from "../store/Store";
import { Spinner } from "../components/Spinner";
import { Icons } from "../components/Icons";
import { ErrorBanner } from "../components/ErrorBanner";
import { DropZone } from "../components/DropZone";
import { PdfViewer } from "../components/PdfViewer";
import { ModeSelector } from "../features/user/ModeSelector";
import { Section } from "../features/user/Section";
import { TemplateSelector } from "../features/user/TemplateSelector";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";


// ─── Halaman User ─────────────────────────────────────────────────────────────
export default function UserPage() {
    const {
        selectedTemplateId, jsonFile, mode, generating,
        pdfUrl, pdfBlob, error,
        setSelectedTemplateId, setJsonFile, setMode,
        setGenerating, setPdf, setError, reset,
    } = useUserStore();

    const [templates, setTemplates] = useState<TemplateItem[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

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

    const handleGenerate = async () => {
        if (!selectedTemplateId) return;
        setGenerating(true);
        setError(null);
        setPdf(null);

        try {
            const form = new FormData();
            form.append("templateId", selectedTemplateId);
            form.append("mode", mode);
            if (mode !== "empty_template" && jsonFile) form.append("json", jsonFile);

            const response = await axios.post(`${API_BASE}/generate-pdf`, form, {
                headers: { "Content-Type": "multipart/form-data" },
                responseType: "blob",
            });

            setPdf(new Blob([response.data as BlobPart], { type: "application/pdf" }));
        } catch (err) {
            let msg = "Generate gagal";
            if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
                const text = await (err.response.data as Blob).text();
                try { msg = (JSON.parse(text) as { error?: string; }).error ?? msg; } catch { /* noop */ }
            } else if (axios.isAxiosError(err)) {
                msg = (err.response?.data as { error?: string; })?.error ?? err.message;
            }
            setError("Generate PDF gagal: " + msg);
        } finally {
            setGenerating(false);
        }
    };

    const handleDownload = () => {
        if (!pdfBlob) return;
        const baseName = selectedTemplateId?.replace(/_\d+\.docx$/, "") ?? "output";
        const suffix = mode === "value_only" ? "_value_only" : "";
        const a = document.createElement("a");
        a.href = URL.createObjectURL(pdfBlob);
        a.download = `${baseName}${suffix}.pdf`;
        a.click();
    };

    const isReady = !!selectedTemplateId && (mode !== "empty_template" ? !!jsonFile : true);

    const labelButtonGenerate = useMemo(() => {
        let label = "Download Template";
        if (mode === "value_only") label = "Generate Value Only";
        if (mode === "full") label = "Generate Full Document";
        if (generating) label = "Memproses PDF";
        return label;
    }, [mode, generating]);

    return (
        <div className="min-h-screen bg-gray-100 px-4 py-8 w-full">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-emerald-100 text-emerald-600 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                            User
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Generate Dokumen</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Pilih template, upload data JSON, lalu generate PDF
                    </p>
                </div>

                {/* Error */}
                {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

                <div className={`grid gap-6 items-start w-full ${pdfUrl ? "grid-cols-[400px_1fr]" : "grid-cols-1 max-w-lg"}`}>

                    {/* Panel kiri — kontrol */}
                    <div className="flex flex-col gap-5">

                        {/* Step 1: Pilih Template */}
                        <Section number="1" title="Pilih Template" done={!!selectedTemplateId} doneLabel={selectedTemplateId?.replace(/_\d+\.docx$/, ".docx") ?? null}>
                            <TemplateSelector
                                templates={templates}
                                loading={loadingTemplates}
                                selected={selectedTemplateId}
                                onSelect={(id) => { setSelectedTemplateId(id); setPdf(null); }}
                            />
                        </Section>

                        {/* Step 2: Mode */}
                        <Section number="2" title="Pilih Mode Cetak" done={false} disabled={!selectedTemplateId}>
                            <ModeSelector mode={mode} onChange={(m) => { setMode(m); setPdf(null); }} />
                        </Section>

                        {/* Step 3: Upload JSON */}
                        {mode === "empty_template" ? null :
                            <Section number="3" title="Upload Data JSON" done={!!jsonFile} doneLabel={jsonFile?.name ?? null} disabled={!selectedTemplateId}>
                                <DropZone
                                    accept=".json"
                                    label="Klik atau drag .json ke sini"
                                    hint="File JSON berisi data untuk mengisi template"
                                    file={jsonFile}
                                    onFile={(f) => { setJsonFile(f); setPdf(null); }}
                                    disabled={!selectedTemplateId}
                                />
                            </Section>
                        }

                        {/* Tombol Generate */}
                        <button
                            onClick={handleGenerate}
                            disabled={!isReady || generating}
                            className={`
                flex items-center justify-center gap-2 w-full py-3 rounded-xl
                text-sm font-semibold text-white transition-all duration-200
                ${!isReady || generating
                                    ? "bg-gray-300 cursor-not-allowed"
                                    : mode === "value_only"
                                        ? "bg-violet-600 hover:bg-violet-700 active:scale-[.98]"
                                        : "bg-indigo-500 hover:bg-indigo-600 active:scale-[.98]"}
              `}
                        >
                            {generating ? <Spinner /> : Icons.pdf}
                            {labelButtonGenerate}
                        </button>

                        {/* Reset */}
                        {(selectedTemplateId || pdfUrl) && (
                            <button
                                onClick={reset}
                                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                  text-sm font-semibold text-gray-500 bg-white border border-gray-200
                  hover:bg-gray-50 transition-all duration-200 active:scale-[.98]"
                            >
                                {Icons.refresh} Reset
                            </button>
                        )}
                    </div>

                    {/* Panel kanan — PDF preview */}
                    {pdfUrl && (
                        <PdfViewer
                            pdfUrl={`${pdfUrl}#toolbar=0&navpanes=0`}
                            filename={`${selectedTemplateId?.replace(/_\d+\.docx$/, "") ?? "output"}${mode === "value_only" ? "_value_only" : ""}.pdf`}
                            onDownload={handleDownload}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

