// ─── DropZone ─────────────────────────────────────────────────────────────────

import { useRef, useState, useCallback, type DragEvent, type ChangeEvent } from "react";
import { Icons } from "./Icons";

interface DropZoneProps {
    accept: string;
    label: string;
    hint: string;
    file: File | null;
    onFile: (f: File) => void;
    disabled?: boolean;
}


export function DropZone({ accept, label, hint, file, onFile, disabled = false }: DropZoneProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(false);
        if (disabled) return;
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
    }, [disabled, onFile]);

    return (
        <div
            onClick={() => !disabled && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`
        border-2 border-dashed rounded-xl px-5 py-6 text-center transition-all duration-200
        ${dragging ? "border-indigo-400 bg-indigo-50" : file ? "border-green-400 bg-green-50" : "border-gray-300 bg-gray-50"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-indigo-400 hover:bg-indigo-50"}
      `}
        >
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    if (e.target.files?.[0]) onFile(e.target.files[0]);
                }}
            />
            {file ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                    <span className="text-green-500">{Icons.check}</span>
                    <span className="font-semibold text-sm truncate max-w-[220px]">{file.name}</span>
                </div>
            ) : (
                <>
                    <div className="flex justify-center text-gray-400 mb-2">{Icons.upload}</div>
                    <p className="text-sm font-semibold text-gray-700">{label}</p>
                    <p className="text-xs text-gray-400 mt-1">{hint}</p>
                </>
            )}
        </div>
    );
}
