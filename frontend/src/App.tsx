import React, { type ChangeEvent } from 'react';
import { useTemplateStore } from './store/useTemplateStore';
import { api } from './api/client';

const App: React.FC = () => {
  const {
    detectedTags,
    placeholders,
    updatePlaceholder,
    templateId,
    previewUrl,
    setPreviewUrl,
    setTemplateData
  } = useTemplateStore();

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('template', file);

    try {
      const res = await api.post('/upload-template', formData);
      // Backend sekarang mengirimkan detectedTags (hasil regex XML)
      setTemplateData(res.data.templateId, res.data.detectedTags);
      alert("Upload sukses & tag terdeteksi!");
    } catch (err) {
      console.error(err);
      alert("Gagal upload file.");
    }
  };

  const handleGeneratePreview = async () => {
    if (!templateId) return alert("Upload template dulu!");

    try {
      const response = await api.post('/generate-preview', {
        templateId,
        data: placeholders
      }, { responseType: 'blob' });


      const url = URL.createObjectURL(new Blob([response.data], {
        type: 'application/pdf'
        // type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      }));

      setPreviewUrl(response.data ? url : null);
    } catch (err) {
      console.error("Gagal generate preview", err);
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-1/3 p-6 bg-white shadow-xl overflow-y-auto border-r border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Carbone TS Editor</h1>

        <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <label className="block text-sm font-semibold text-blue-800 mb-2">Upload Template (.docx)</label>
          <input type="file" onChange={handleUpload} accept=".docx" className="text-sm" />
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Variables</h2>
          {detectedTags.length > 0 ? (
            detectedTags.map((tag) => (
              <div key={tag}>
                <label className="block text-xs font-bold text-gray-600 mb-1">{tag}</label>
                <input
                  type="text"
                  placeholder={`Value for ${tag}...`}
                  value={placeholders[tag] || ""}
                  onChange={(e) => updatePlaceholder(tag, e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            ))
          ) : (
            <p className="text-gray-400 italic text-sm">No variables detected yet.</p>
          )}
        </div>

        <button
          onClick={handleGeneratePreview}
          disabled={!templateId}
          className="w-full mt-8 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
        >
          Generate PDF Preview
        </button>
      </div>

      {/* Preview Area */}
      <div className="w-2/3 p-6 flex flex-col">
        <div className="flex-1 bg-white rounded-xl shadow-inner border border-gray-200 overflow-hidden">
          {previewUrl ? (
            <iframe src={previewUrl} className="w-full h-full" title="PDF Preview" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Upload a template and fill data to see preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
