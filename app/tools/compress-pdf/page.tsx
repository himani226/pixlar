import type { Metadata } from 'next';
import CompressPDF from '@/components/tools/pdf/CompressPDF';

export const metadata: Metadata = {
  title: 'PDF Compressor | Pixlar - Reduce PDF File Size',
  description: 'Compress PDF files online for free. Reduce file size while maintaining quality. 100% private, no signup needed.',
};

export default function Page() {
  return <CompressPDF />;
}