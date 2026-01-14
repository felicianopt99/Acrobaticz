import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../globals.css';
import { ReactQueryProvider } from '@/providers/ReactQueryProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: "AV Rentals Installation Wizard",
  description: "Professional setup wizard for AV Rentals",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ReactQueryProvider>
        {children}
      </ReactQueryProvider>
    </>
  );
}
