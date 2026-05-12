import { Icons } from "../../components/Icons";
import { Spinner } from "../../components/Spinner";
import type { TemplateItem } from "../../store/Store";
import { TemplateRow } from "./TemplateRow";

// ─── Komponen: daftar template yang sudah tersimpan ───────────────────────────
export function TemplateList({
    templates,
    loading,
    onRefresh,
}: {
    templates: TemplateItem[];
    loading: boolean;
    onRefresh: () => void;
}) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    {Icons.template}
                    <span className="text-sm font-semibold text-gray-900">Template Tersimpan</span>
                    {templates.length > 0 && (
                        <span className="bg-indigo-100 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full">
                            {templates.length}
                        </span>
                    )}
                </div>
                <button
                    onClick={onRefresh}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800
            transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100"
                >
                    <span className={loading ? "animate-spin" : ""}>{Icons.refresh}</span>
                    Refresh
                </button>
            </div>

            {/* Body */}
            <div className="divide-y divide-gray-50">
                {loading ? (
                    <div className="flex items-center justify-center py-10 text-gray-400 text-sm gap-2">
                        <Spinner /> Memuat daftar template...
                    </div>
                ) : templates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <div className="mb-2 opacity-40">{Icons.file}</div>
                        <p className="text-sm">Belum ada template tersimpan</p>
                    </div>
                ) : (
                    templates.map((t) => <TemplateRow key={t.templateId} item={t} />)
                )}
            </div>
        </div>
    );
}
