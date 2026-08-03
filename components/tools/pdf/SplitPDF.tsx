'use client';

import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';

export default function SplitPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [splitting, setSplitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractMode, setExtractMode] = useState<'range' | 'individual'>('range');
  const [pageRange, setPageRange] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
      
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        setTotalPages(pdfDoc.getPageCount());
      } catch {
        setError('Failed to read PDF file');
      }
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const parsePageRange = (range: string): number[] => {
    const pages: number[] = [];
    const parts = range.split(',').map(p => p.trim());
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(p => parseInt(p.trim()));
        for (let i = start - 1; i < end; i++) {
          if (i >= 0 && i < totalPages) pages.push(i);
        }
      } else {
        const num = parseInt(part) - 1;
        if (num >= 0 && num < totalPages) pages.push(num);
      }
    }
    
    return [...new Set(pages)];
  };

  const splitPDF = async () => {
    if (!file) return;

    setSplitting(true);
    setProgress(0);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      if (extractMode === 'range') {
        if (!pageRange.trim()) {
          setError('Please enter page numbers or range');
          setSplitting(false);
          return;
        }

        const pagesToExtract = parsePageRange(pageRange);
        if (pagesToExtract.length === 0) {
          setError('No valid pages found in range');
          setSplitting(false);
          return;
        }

        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdfDoc, pagesToExtract);
        
        copiedPages.forEach((page, index) => {
          newPdf.addPage(page);
          setProgress(Math.min(50 + (index / copiedPages.length) * 50, 99));
        });

        setProgress(100);
        const pdfBytes = await newPdf.save() as Uint8Array;
        downloadPDF(pdfBytes, `extracted-pages-${pageRange.replace(/[, -]/g, '-')}.pdf`);
      } else {
        const pageCount = pdfDoc.getPageCount();
        
        for (let i = 0; i < pageCount; i++) {
          const newPdf = await PDFDocument.create();
          const [page] = await newPdf.copyPages(pdfDoc, [i]);
          newPdf.addPage(page);
          
          const pdfBytes = await newPdf.save() as Uint8Array;
          downloadPDF(pdfBytes, `page-${i + 1}.pdf`);
          
          setProgress(Math.min((i + 1 / pageCount) * 100, 99));
        }
        
        setProgress(100);
      }

      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      setError('Failed to split PDF. Please try another file.');
    } finally {
      setSplitting(false);
      setProgress(0);
    }
  };

  const downloadPDF = (pdfBytes: Uint8Array, filename: string) => {
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Split PDF</h1>
          <p className="text-lg text-slate-600">
            Extract pages or split your PDF into individual files. All processing done locally on your device.
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
              onChange={handleFileChange}
              hidden
            />
            <svg className="mx-auto h-12 w-12 text-indigo-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-xl font-semibold text-slate-900">Drop your PDF here</p>
            <p className="text-slate-500 mt-2">or click to browse</p>
          </div>

          {file && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-6 p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center">
                  <svg className="h-8 w-8 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.5 3.5a.5.5 0 11-1 0 .5.5 0 011 0zM4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2H4a1 1 0 110-2V4zm3 6a1 1 0 100-2 1 1 0 000 2zm0 4a1 1 0 100-2 1 1 0 000 2z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-500">{totalPages} pages</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setTotalPages(0);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-slate-500 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              {/* Mode Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 mb-3">Split Mode</label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="range"
                      checked={extractMode === 'range'}
                      onChange={(e) => setExtractMode(e.target.value as 'range' | 'individual')}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    <span className="ml-2 text-slate-700">Extract specific pages</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="individual"
                      checked={extractMode === 'individual'}
                      onChange={(e) => setExtractMode(e.target.value as 'range' | 'individual')}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    <span className="ml-2 text-slate-700">Split into separate files</span>
                  </label>
                </div>
              </div>

              {extractMode === 'range' && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Page Range (e.g., 1-5, 7, 9-12)
                  </label>
                  <input
                    type="text"
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                    disabled={splitting}
                    placeholder="Enter page numbers or ranges"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:bg-slate-100"
                  />
                  <p className="text-xs text-slate-500 mt-2">Total pages in PDF: {totalPages}</p>
                </div>
              )}

              {/* Progress Bar */}
              {splitting && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-900 font-medium">Processing...</span>
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

              {/* Split Button */}
              <button
                onClick={splitPDF}
                disabled={splitting || (extractMode === 'range' && !pageRange.trim())}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 disabled:from-slate-300 disabled:to-slate-300 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-105 disabled:scale-100"
              >
                {splitting ? 'Processing...' : extractMode === 'range' ? 'Extract Pages' : 'Split PDF'}
              </button>
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
            <h3 className="font-semibold text-slate-900 mb-2">✂️ Extract</h3>
            <p className="text-sm text-slate-600">Pull out specific pages from your PDF</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="font-semibold text-slate-900 mb-2">📄 Split</h3>
            <p className="text-sm text-slate-600">Separate each page into its own file</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="font-semibold text-slate-900 mb-2">⚡ Instant</h3>
            <p className="text-sm text-slate-600">No waiting, no servers involved</p>
          </div>
        </div>
      </div>
    </div>
  );
}