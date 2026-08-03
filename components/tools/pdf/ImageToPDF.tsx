'use client';

import { useState, useRef } from 'react';
import { PDFDocument, PDFPage } from 'pdf-lib';

export default function ImageToPDF() {
    const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
    const [converting, setConverting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [pageSize, setPageSize] = useState<'A4' | 'Letter' | 'Auto'>('Auto');
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
        const validImages = selectedFiles.filter(f => f.type.startsWith('image/'));

        if (validImages.length > 0) {
            validImages.forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const preview = event.target?.result as string;
                    setImages(prev => [...prev, { file, preview }]);
                };
                reader.readAsDataURL(file);
            });
            setError('');
        } else if (selectedFiles.length > 0) {
            setError('Please select valid image files (JPG, PNG, WebP, etc.)');
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const moveImage = (fromIndex: number, direction: 'up' | 'down') => {
        const newImages = [...images];
        const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;

        if (toIndex >= 0 && toIndex < images.length) {
            [newImages[fromIndex], newImages[toIndex]] = [newImages[toIndex], newImages[fromIndex]];
            setImages(newImages);
        }
    };

    const convertToPDF = async () => {
        if (images.length === 0) {
            setError('Please add at least one image');
            return;
        }

        setConverting(true);
        setProgress(0);

        try {
            const pdfDoc = await PDFDocument.create();

            for (let i = 0; i < images.length; i++) {
                const imgData = images[i].preview;
                const mimeType = images[i].file.type;

                let page: PDFPage;

                if (pageSize === 'Auto') {
                    // Create page with image dimensions
                    const img = new Image();
                    img.src = imgData;

                    await new Promise(resolve => {
                        img.onload = resolve;
                    });

                    const width = img.width;
                    const height = img.height;

                    page = pdfDoc.addPage([width, height]);
                } else {
                    const [width, height] = pageSize === 'A4'
                        ? orientation === 'portrait'
                            ? [595, 842]
                            : [842, 595]
                        : orientation === 'portrait'
                            ? [612, 792]
                            : [792, 612];

                    page = pdfDoc.addPage([width, height]);
                }

                // Embed and draw image
                let embeddedImage;
                if (mimeType === 'image/png') {
                    embeddedImage = await pdfDoc.embedPng(imgData);
                } else if (mimeType === 'image/jpeg') {
                    embeddedImage = await pdfDoc.embedJpg(imgData);
                } else {
                    // Convert other formats to PNG
                    embeddedImage = await pdfDoc.embedPng(imgData);
                }

                const { width: pageWidth, height: pageHeight } = page.getSize();
                const imgWidth = embeddedImage.width;
                const imgHeight = embeddedImage.height;

                // Calculate scaling to fit page
                const scale = Math.min(
                    pageWidth / imgWidth,
                    pageHeight / imgHeight
                );

                const scaledWidth = imgWidth * scale;
                const scaledHeight = imgHeight * scale;

                const x = (pageWidth - scaledWidth) / 2;
                const y = (pageHeight - scaledHeight) / 2;

                page.drawImage(embeddedImage, {
                    x,
                    y,
                    width: scaledWidth,
                    height: scaledHeight,
                });

                setProgress(Math.min((i + 1 / images.length) * 100, 99));
            }

            setProgress(100);
            const pdfBytesRaw = await pdfDoc.save();
            const pdfBytes = new Uint8Array(pdfBytesRaw);

            // Download
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'images.pdf';
            a.click();
            URL.revokeObjectURL(url);

            setImages([]);
        } catch (err) {
            setError('Failed to convert images to PDF. Please try again.');
            console.error(err);
        } finally {
            setConverting(false);
            setProgress(0);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 mb-3">Image to PDF</h1>
                    <p className="text-lg text-slate-600">
                        Convert one or multiple images into a single PDF file. Arrange and customize before converting.
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
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                            disabled={converting}
                            hidden
                        />
                        <svg className="mx-auto h-12 w-12 text-indigo-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-xl font-semibold text-slate-900">Add images to convert</p>
                        <p className="text-slate-500 mt-2">or click to browse</p>
                    </div>

                    {images.length > 0 && (
                        <div className="mt-8">
                            {/* Settings */}
                            <div className="grid md:grid-cols-2 gap-6 mb-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-900 mb-2">Page Size</label>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => setPageSize(e.target.value as 'A4' | 'Letter' | 'Auto')}
                                        disabled={converting}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:bg-slate-100"
                                    >
                                        <option value="Auto">Auto (Fit to Image)</option>
                                        <option value="A4">A4 (210x297mm)</option>
                                        <option value="Letter">Letter (8.5x11in)</option>
                                    </select>
                                </div>
                                {pageSize !== 'Auto' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-900 mb-2">Orientation</label>
                                        <select
                                            value={orientation}
                                            onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
                                            disabled={converting}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:bg-slate-100"
                                        >
                                            <option value="portrait">Portrait</option>
                                            <option value="landscape">Landscape</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <h3 className="font-semibold text-slate-900 mb-4">Images ({images.length})</h3>

                            {/* Image Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 max-h-96 overflow-y-auto">
                                {images.map((img, index) => (
                                    <div
                                        key={index}
                                        className="relative group bg-slate-50 rounded-lg overflow-hidden border border-slate-200 hover:border-indigo-300 transition-colors"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={img.preview}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-32 object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => moveImage(index, 'up')}
                                                disabled={index === 0 || converting}
                                                className="p-2 bg-white hover:bg-slate-100 disabled:opacity-50 rounded"
                                                title="Move up"
                                            >
                                                ↑
                                            </button>
                                            <button
                                                onClick={() => removeImage(index)}
                                                disabled={converting}
                                                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded"
                                                title="Remove"
                                            >
                                                ✕
                                            </button>
                                            <button
                                                onClick={() => moveImage(index, 'down')}
                                                disabled={index === images.length - 1 || converting}
                                                className="p-2 bg-white hover:bg-slate-100 disabled:opacity-50 rounded"
                                                title="Move down"
                                            >
                                                ↓
                                            </button>
                                        </div>
                                        <div className="absolute top-2 left-2 bg-indigo-600 text-white px-2 py-1 rounded text-xs font-semibold">
                                            {index + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Progress Bar */}
                            {converting && (
                                <div className="mb-6">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-900 font-medium">Converting...</span>
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
                                    onClick={convertToPDF}
                                    disabled={converting}
                                    className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 disabled:from-slate-300 disabled:to-slate-300 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-105 disabled:scale-100"
                                >
                                    {converting ? 'Converting...' : 'Convert to PDF'}
                                </button>
                                <button
                                    onClick={() => {
                                        setImages([]);
                                        setError('');
                                    }}
                                    disabled={converting}
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
                        <h3 className="font-semibold text-slate-900 mb-2">🖼️ Multiple</h3>
                        <p className="text-sm text-slate-600">Add as many images as you need</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow">
                        <h3 className="font-semibold text-slate-900 mb-2">🎨 Customize</h3>
                        <p className="text-sm text-slate-600">Choose page size and orientation</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow">
                        <h3 className="font-semibold text-slate-900 mb-2">⚡ Instant</h3>
                        <p className="text-sm text-slate-600">Convert in your browser instantly</p>
                    </div>
                </div>
            </div>
        </div>
    );
}