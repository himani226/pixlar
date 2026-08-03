'use client';

import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';

export default function MergePDF() {
  const [files, setFiles] = useState<File[]>([]);
  const [merging, setMerging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    const validFiles = selectedFiles.filter(f => f.type === 'application/pdf');
    
    if (validFiles.length > 0) {
      setFiles([...files, ...validFiles]);
      setError('');
    } else if (selectedFiles.length > 0) {
      setError('Please select valid PDF files only');
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const moveFile = (fromIndex: number, direction: 'up' | 'down') => {
    const newFiles = [...files];
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    
    if (toIndex >= 0 && toIndex < files.length) {
      [newFiles[fromIndex], newFiles[toIndex]] = [newFiles[toIndex], newFiles[fromIndex]];
      setFiles(newFiles);
    }
  };

  const mergePDFs = async () => {
    if (files.length < 2) {
      setError('Please add at least 2 PDF files to merge');
      return;
    }

    setMerging(true);
    setProgress(0);

    try {
      const mergedPdf = await PDFDocument.create();
      
      for (let i = 0; i < files.length; i++) {
        const arrayBuffer = await files[i].arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        
        pages.forEach(page => mergedPdf.addPage(page));
        setProgress(Math.min((i + 1 / files.length) * 100, 99));
      }

      setProgress(100);
      const pdfBytesRaw = await mergedPdf.save();
      const pdfBytes = new Uint8Array(pdfBytesRaw);

      // Download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
      a.click();
      URL.revokeObjectURL(url);

      setFiles([]);
    } catch (err) {
      setError('Failed to merge PDFs. Please try again.');
      console.error(err);
    } finally {
      setMerging(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Merge PDF</h1>
          <p className="text-lg text-slate-600">
            Combine multiple PDFs into a single file. Drag to reorder, then merge. 100% browser-based.
          </p>
        </div>

        {/* Main Tool Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          {/* File Upload Area */}
          <div
            className="border-2 border-dashed border-indigo-300 rounded-xl p-12 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileChange}
              disabled={merging}
              hidden
            />
            <svg className="mx-auto h-12 w-12 text-indigo-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-xl font-semibold text-slate-900">Add PDF files to merge</p>
            <p className="text-slate-500 mt-2">or click to browse</p>
          </div>

          {files.length > 0 && (
            <div className="mt-8">
              <h3 className="font-semibold text-slate-900 mb-4">Files to merge ({files.length})</h3>
              
              {/* File List */}
              <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="flex-shrink-0 text-slate-400 font-semibold w-8 text-center">
                        {index + 1}
                      </div>
                      <svg className="h-6 w-6 text-red-500 mx-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.5 3.5a.5.5 0 11-1 0 .5.5 0 011 0zM4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2H4a1 1 0 110-2V4zm3 6a1 1 0 100-2 1 1 0 000 2zm0 4a1 1 0 100-2 1 1 0 000 2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{file.name}</p>
                        <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    
                    {/* Controls */}
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <button
                        onClick={() => moveFile(index, 'up')}
                        disabled={index === 0 || merging}
                        className="p-2 hover:bg-slate-200 disabled:text-slate-300 disabled:cursor-not-allowed rounded"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveFile(index, 'down')}
                        disabled={index === files.length - 1 || merging}
                        className="p-2 hover:bg-slate-200 disabled:text-slate-300 disabled:cursor-not-allowed rounded"
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeFile(index)}
                        disabled={merging}
                        className="p-2 hover:bg-red-100 text-red-600 disabled:text-slate-300 disabled:cursor-not-allowed rounded"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              {merging && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-900 font-medium">Merging...</span>
                    <span className="text-slate-500">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={mergePDFs}
                  disabled={merging || files.length < 2}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 disabled:from-slate-300 disabled:to-slate-300 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-105 disabled:scale-100"
                >
                  {merging ? 'Merging PDFs...' : 'Merge PDFs'}
                </button>
                <button
                  onClick={() => {
                    setFiles([]);
                    setError('');
                  }}
                  disabled={merging}
                  className="px-6 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 text-slate-900 font-semibold py-3 rounded-lg transition-all"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="font-semibold text-slate-900 mb-2">📋 Combine</h3>
            <p className="text-sm text-slate-600">Merge unlimited PDFs together</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="font-semibold text-slate-900 mb-2">🔄 Reorder</h3>
            <p className="text-sm text-slate-600">Arrange files before merging</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="font-semibold text-slate-900 mb-2">🔒 Secure</h3>
            <p className="text-sm text-slate-600">Nothing uploaded to servers</p>
          </div>
        </div>
      </div>
    </div>
  );
}