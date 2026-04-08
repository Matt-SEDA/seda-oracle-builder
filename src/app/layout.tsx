import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'SEDA Oracle Program Builder — v2',
  description: 'Build and deploy a SEDA Oracle Program in minutes. Select an asset, choose your logic, and connect via SEDA Fast with sub-50ms latency.',
  metadataBase: new URL('https://seda-oracle-builder.vercel.app'),
  openGraph: {
    title: 'SEDA Oracle Program Builder',
    description: 'Build and deploy a SEDA Oracle Program in minutes. Select an asset, choose your logic, and connect via SEDA Fast with sub-50ms latency.',
    siteName: 'SEDA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SEDA Oracle Program Builder',
    description: 'Build and deploy a SEDA Oracle Program in minutes. Select an asset, choose your logic, and connect via SEDA Fast with sub-50ms latency.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body data-theme="dark">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
