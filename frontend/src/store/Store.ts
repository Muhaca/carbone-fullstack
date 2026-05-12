import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface TemplateItem {
    templateId: string;
    size: number;
    uploadedAt: string;
}

export type GenerateMode = "full" | "value_only" | "empty_template";

// ────────────────────────────────────────────────────────────────────────────
// Admin Store — kelola upload template
// ────────────────────────────────────────────────────────────────────────────
interface AdminStore {
    templateFile: File | null;
    uploading: boolean;
    templates: TemplateItem[];
    loadingTemplates: boolean;
    error: string | null;

    setTemplateFile: (file: File | null) => void;
    setUploading: (val: boolean) => void;
    setTemplates: (list: TemplateItem[]) => void;
    setLoadingTemplates: (val: boolean) => void;
    setError: (msg: string | null) => void;
    reset: () => void;
}

const adminInitial = {
    templateFile: null,
    uploading: false,
    templates: [],
    loadingTemplates: false,
    error: null,
};

export const useAdminStore = create<AdminStore>((set) => ({
    ...adminInitial,
    setTemplateFile: (file) => set({ templateFile: file }),
    setUploading: (val) => set({ uploading: val }),
    setTemplates: (list) => set({ templates: list }),
    setLoadingTemplates: (val) => set({ loadingTemplates: val }),
    setError: (msg) => set({ error: msg }),
    reset: () => set(adminInitial),
}));

// ────────────────────────────────────────────────────────────────────────────
// User Store — generate PDF
// ────────────────────────────────────────────────────────────────────────────
interface UserStore {
    selectedTemplateId: string | null;
    jsonFile: File | null;
    mode: GenerateMode;
    generating: boolean;
    pdfUrl: string | null;
    pdfBlob: Blob | null;
    error: string | null;

    setSelectedTemplateId: (id: string | null) => void;
    setJsonFile: (file: File | null) => void;
    setMode: (mode: GenerateMode) => void;
    setGenerating: (val: boolean) => void;
    setPdf: (blob: Blob | null) => void;
    setError: (msg: string | null) => void;
    reset: () => void;
}

const userInitial = {
    selectedTemplateId: null,
    jsonFile: null,
    mode: "full" as GenerateMode,
    generating: false,
    pdfUrl: null,
    pdfBlob: null,
    error: null,
};

export const useUserStore = create<UserStore>((set, get) => ({
    ...userInitial,
    setSelectedTemplateId: (id) => set({ selectedTemplateId: id }),
    setJsonFile: (file) => set({ jsonFile: file }),
    setMode: (mode) => set({ mode }),
    setGenerating: (val) => set({ generating: val }),
    setPdf: (blob) => {
        const prev = get().pdfUrl;
        if (prev) URL.revokeObjectURL(prev);
        set({
            pdfBlob: blob,
            pdfUrl: blob ? URL.createObjectURL(blob) : null,
        });
    },
    setError: (msg) => set({ error: msg }),
    reset: () => {
        const prev = get().pdfUrl;
        if (prev) URL.revokeObjectURL(prev);
        set(userInitial);
    },
}));