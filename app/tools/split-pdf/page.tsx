import type { Metadata } from 'next';
import SplitPDF from '@/components/tools/pdf/SplitPDF';

export const metadata: Metadata = {
  title: 'PDF Splitter | Pixlar - Extract & Split PDF Pages',
  description: 'Split PDF pages online free. Extract specific pages or split into separate files. 100% private, no upload.',
};

export default function Page() {
  return <SplitPDF />;
}