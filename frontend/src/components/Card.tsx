import { CheckIcon } from "./icons/Icons";

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps {
    number: string;
    title: string;
    done: boolean;
    doneLabel?: string | null;
    disabled?: boolean;
    children: React.ReactNode;
}

export function Card({ number, title, done, doneLabel, disabled = false, children }: CardProps) {
    return (
        <div
            className={`
        bg-white rounded-2xl shadow-sm overflow-hidden transition-opacity duration-200
        ${done ? "border border-green-200" : "border border-gray-200"}
        ${disabled ? "opacity-50 pointer-events-none" : ""}
      `}
        >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
                <div
                    className={`
            w-7 h-7 rounded-full flex items-center justify-center shrink-0
            text-sm font-bold transition-colors duration-200
            ${done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}
          `}
                >
                    {done ? <CheckIcon /> : number}
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-900">{title}</p>
                    {doneLabel && (
                        <p className="text-xs text-green-600 mt-0.5 truncate max-w-[260px]">✓ {doneLabel}</p>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col gap-3">{children}</div>
        </div>
    );
}