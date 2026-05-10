import { useEffect, useState } from "react";

// ─── JSON Preview ─────────────────────────────────────────────────────────────
export function JsonPreview({ file }: { file: File; }) {
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
