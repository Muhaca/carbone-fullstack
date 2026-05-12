import { useState } from "react";
import AdminPage from "./page/AdminPage";
import UserPage from "./page/UserPage";

type Tab = "user" | "admin";

export default function App() {
  const [tab, setTab] = useState<Tab>("user");

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-sm">Carbone Generator</span>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            <TabButton active={tab === "user"} onClick={() => setTab("user")} color="emerald">
              User
            </TabButton>
            <TabButton active={tab === "admin"} onClick={() => setTab("admin")} color="indigo">
              Admin
            </TabButton>
          </div>

        </div>
      </nav>

      {/* Page content */}
      {tab === "user" ? <UserPage /> : <AdminPage />}
    </div>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
function TabButton({
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
      className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200
        ${active ? activeClass : "text-gray-500 hover:text-gray-700"}`}
    >
      {children}
    </button>
  );
}