import { create } from "zustand";

export interface TemplateStore {
    // ── Step 1: Template ──────────────────────────────────────────────────────
    templateFile: File | null;
    templateId: string | null;
    uploadingTemplate: boolean;

    // ── Step 2: JSON & Generate ───────────────────────────────────────────────
    jsonFile: File | null;
    generating: boolean;

    // ── Output ────────────────────────────────────────────────────────────────
    pdfUrl: string | null;
    pdfBlob: Blob | null;

    // ── Error ─────────────────────────────────────────────────────────────────
    error: string | null;

    // ── Actions ───────────────────────────────────────────────────────────────
    setTemplateFile: (file: File | null) => void;
    setTemplateId: (id: string | null) => void;
    setUploadingTemplate: (val: boolean) => void;
    setJsonFile: (file: File | null) => void;
    setGenerating: (val: boolean) => void;
    setPdf: (blob: Blob | null) => void;
    setError: (msg: string | null) => void;
    reset: () => void;
}

const initialState = {
    templateFile: null,
    templateId: null,
    uploadingTemplate: false,
    jsonFile: null,
    generating: false,
    pdfUrl: null,
    pdfBlob: null,
    error: null,
};

export const useTemplateStore = create<TemplateStore>((set, get) => ({
    ...initialState,

    setTemplateFile: (file) => set({ templateFile: file }),
    setTemplateId: (id) => set({ templateId: id }),
    setUploadingTemplate: (val) => set({ uploadingTemplate: val }),
    setJsonFile: (file) => set({ jsonFile: file }),
    setGenerating: (val) => set({ generating: val }),

    setPdf: (blob) => {
        // Revoke URL lama agar tidak memory leak
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
        set(initialState);
    },
}));