import type { Metadata } from 'next';
import MergePDF from '@/components/tools/pdf/MergePDF';

export const metadata: Metadata = {
  title: 'PDF Merger | Pixlar - Combine PDFs Online',
  description: 'Merge multiple PDFs into one file online free. Combine and reorder PDFs instantly. 100% private, no signup.',
};

export default function Page() {
  return <MergePDF />;
}