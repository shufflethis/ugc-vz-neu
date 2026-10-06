import { Metadata } from 'next';

// Interne Render-Buehne fuer den Video-Export (scripts/render-motion.py). Nicht indexieren.
export const metadata: Metadata = { title: 'Motion Render', robots: { index: false, follow: false } };

export default function MotionRenderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
