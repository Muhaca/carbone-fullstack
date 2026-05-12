// ─── Tab Button ───────────────────────────────────────────────────────────────
export function TabButton({
    active, onClick, color, children,
}: {
    active: boolean;
    onClick: () => void;
    color: "indigo" | "emerald";
    children: React.ReactNode;
}) {
    const activeClass = color === "emerald"
        ? "bg-white text-emerald-600 shadow-sm"
        : "bg-white text-indigo-600 shadow-sm";

    return (
        <button
            onClick={onClick}
            className={`px-4 py-1.5 cursor-pointer rounded-lg text-sm font-semibold transition-all duration-200
        ${active ? activeClass : "text-gray-500 hover:text-gray-700"}`}
        >
            {children}
        </button>
    );
}