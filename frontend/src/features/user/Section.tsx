// ─── Section Card ─────────────────────────────────────────────────────────────
export function Section({
    number, title, done, doneLabel, disabled = false, children,
}: {
    number: string;
    title: string;
    done: boolean;
    doneLabel?: string | null;
    disabled?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-opacity duration-200
      ${done ? "border-green-200" : "border-gray-200"}
      ${disabled ? "opacity-50 pointer-events-none" : ""}`}
        >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0
          text-sm font-bold transition-colors duration-200
          ${done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                    {done
                        ? <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        : number}
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-900">{title}</p>
                    {doneLabel && <p className="text-xs text-green-600 mt-0.5 truncate max-w-[260px]">✓ {doneLabel}</p>}
                </div>
            </div>
            <div className="p-4">{children}</div>
        </div>
    );
}