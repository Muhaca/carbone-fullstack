import { Icons } from "./Icons";

// ─── PDF Viewer ───────────────────────────────────────────────────────────────
interface PdfViewerProps {
    pdfUrl: string;
    filename?: string;
    onDownload: () => void;
}

export function PdfViewer({ pdfUrl, filename = "output.pdf", onDownload }: PdfViewerProps) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    {Icons.pdf}
                    <span>Preview PDF</span>
                    {filename && <span className="text-xs text-gray-400 font-normal">— {filename}</span>}
                </div>
                <button
                    onClick={onDownload}
                    className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white
            text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors duration-200"
                >
                    {Icons.download} Download
                </button>
            </div>
            <iframe src={pdfUrl} title="PDF Preview" className="w-full border-none block" style={{ height: "75vh" }} />
        </div>
    );
}