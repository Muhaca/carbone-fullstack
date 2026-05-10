import { create } from 'zustand';

interface TemplateState {
    templateFile: string | null;
    templateId: string | null;
    detectedTags: string[];
    placeholders: Record<string, any>;
    previewUrl: string | null;

    setTemplateData: (id: string, tags: string[]) => void;
    updatePlaceholder: (key: string, value: any) => void;
    setPreviewUrl: (url: string | null) => void;
}

export const useTemplateStore = create<TemplateState>((set) => ({
    templateFile: null,
    templateId: null,
    detectedTags: [],
    placeholders: {},
    previewUrl: null,

    setTemplateData: (id, tags) => {
        const initialData: Record<string, any> = {};
        tags.forEach((tag) => (initialData[tag] = ""));
        set({
            templateId: id,
            detectedTags: tags,
            placeholders: initialData
        });
    },

    updatePlaceholder: (key, value) =>
        set((state) => ({
            placeholders: { ...state.placeholders, [key]: value },
        })),

    setPreviewUrl: (url) => set({ previewUrl: url }),
}));
