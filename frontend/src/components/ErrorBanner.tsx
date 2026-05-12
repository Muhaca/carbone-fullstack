import { Icons } from "./Icons";

// ─── Error Banner ─────────────────────────────────────────────────────────────
export const ErrorBanner = ({ message, onClose }: { message: string; onClose: () => void; }) => (
    <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
        <span>⚠️ {message}</span>
        <button onClick={onClose} className="ml-3 hover:text-red-800 transition-colors">{Icons.x}</button>
    </div>
);