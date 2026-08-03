import type { Metadata } from 'next';
import ImageToPDF from '@/components/tools/pdf/ImageToPDF';

export const metadata: Metadata = {
  title: 'Image to PDF | Pixlar - Convert Images to PDF',
  description: 'Convert images to PDF online free. Combine multiple images into one PDF file. 100% private, no signup needed.',
};

export default function Page() {
  return <ImageToPDF />;
}