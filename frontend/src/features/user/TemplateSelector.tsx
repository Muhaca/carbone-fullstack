import { Icons } from "../../components/Icons";
import { Spinner } from "../../components/Spinner";
import type { TemplateItem } from "../../store/Store";
import { formatBytes } from "../../utils/formatBytes";

// ─── Komponen: pilih template dari daftar ────────────────────────────────────
export function TemplateSelector({
    templates,
    loading,
    selected,
    onSelect,
}: {
    templates: TemplateItem[];
    loading: boolean;
    selected: string | null;
    onSelect: (id: string) => void;
}) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-8 text-gray-400 text-sm gap-2">
                <Spinner size="sm" /> Memuat template...
            </div>
        );
    }

    if (templates.length === 0) {
        return (
            <div className="text-center py-8 text-sm text-gray-400">
                Belum ada template tersedia. Hubungi Admin.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {templates.map((t) => {
                const isSelected = selected === t.templateId;
                const displayName = t.templateId.replace(/_\d+\.docx$/, ".docx");
                const uploadedAt = new Date(t.uploadedAt).toLocaleString("id-ID", {
                    day: "2-digit", month: "short", year: "numeric",
                });

                return (
                    <button
                        key={t.templateId}
                        onClick={() => onSelect(t.templateId)}
                        className={`
              flex items-center gap-3 px-4 py-3 rounded-xl border text-left
              transition-all duration-150 w-full
              ${isSelected
                                ? "border-indigo-400 bg-indigo-50 ring-1 ring-indigo-300"
                                : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40"}
            `}
                    >
                        <div className={`shrink-0 ${isSelected ? "text-indigo-500" : "text-gray-400"}`}>
                            {Icons.file}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isSelected ? "text-indigo-700" : "text-gray-800"}`}>
                                {displayName}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{formatBytes(t.size)} · {uploadedAt}</p>
                        </div>
                        {isSelected && (
                            <div className="shrink-0 text-indigo-500">{Icons.check}</div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
