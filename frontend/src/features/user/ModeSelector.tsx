import { Icons } from "../../components/Icons";
import type { GenerateMode } from "../../store/Store";

// ─── Komponen: pilih mode generate ──────────────────────────────────────────
export function ModeSelector({
    mode,
    onChange,
}: {
    mode: GenerateMode;
    onChange: (m: GenerateMode) => void;
}) {
    const options: { value: GenerateMode; label: string; desc: string; icon: React.ReactNode; }[] = [
        {
            value: "empty_template",
            label: "Empty Template",
            desc: "Hanya cetak template kosong — untuk kertas template yang belum ditandatangani",
            icon: Icons.print,
        },
        {
            value: "value_only",
            label: "Value Only",
            desc: "Hanya cetak nilai — untuk kertas template yang sudah ditandatangani",
            icon: Icons.print,
        },
        {
            value: "full",
            label: "Full Document",
            desc: "Cetak dokumen lengkap beserta template dan value",
            icon: Icons.file,
        }
    ];

    return (
        <div className="grid grid-cols-2 gap-2">
            {options.map((opt) => {
                const isActive = mode === opt.value;
                return (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        className={`
              flex flex-col items-start gap-2 px-4 py-3.5 rounded-xl border text-left
              transition-all duration-150
              ${isActive
                                ? opt.value === "value_only"
                                    ? "border-violet-400 bg-violet-50 ring-1 ring-violet-300"
                                    : "border-indigo-400 bg-indigo-50 ring-1 ring-indigo-300"
                                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"}
            `}
                    >
                        <div className="flex items-center justify-between w-full">
                            <span className={`${isActive
                                ? opt.value === "value_only" ? "text-violet-500" : "text-indigo-500"
                                : "text-gray-400"}`}>
                                {opt.icon}
                            </span>
                            {isActive && (
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full
                  ${opt.value === "value_only"
                                        ? "bg-violet-100 text-violet-600"
                                        : "bg-indigo-100 text-indigo-600"}`}>
                                    ✓
                                </span>
                            )}
                        </div>
                        <div>
                            <p className={`text-sm font-semibold
                ${isActive
                                    ? opt.value === "value_only" ? "text-violet-700" : "text-indigo-700"
                                    : "text-gray-700"}`}>
                                {opt.label}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{opt.desc}</p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}