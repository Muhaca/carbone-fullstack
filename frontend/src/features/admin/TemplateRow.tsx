import { Icons } from "../../components/Icons";
import type { TemplateItem } from "../../store/Store";
import { formatBytes } from "../../utils/formatBytes";

export function TemplateRow({ item }: { item: TemplateItem; }) {
    const uploadedAt = new Date(item.uploadedAt).toLocaleString("id-ID", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });

    // Ambil nama asli (buang timestamp suffix _1234567890.docx)
    const displayName = item.templateId.replace(/_\d+\.docx$/, ".docx");

    return (
        <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
            <div className="text-indigo-400 shrink-0">{Icons.file}</div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{displayName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatBytes(item.size)} · {uploadedAt}</p>
            </div>
            <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full shrink-0">
                Aktif
            </span>
        </div>
    );
}