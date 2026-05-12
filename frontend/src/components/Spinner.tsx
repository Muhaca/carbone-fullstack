// ─── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner = ({ size = "md" }: { size?: "sm" | "md"; }) => (
    <span className={`inline-block border-2 border-white/40 border-t-white rounded-full animate-spin
    ${size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"}`}
    />
);