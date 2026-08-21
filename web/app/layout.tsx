import type { Metadata } from 'next';
import { DM_Sans, Fraunces } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';

const sans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: {
    default: 'SuqET — Ethiopian Second-Hand Marketplace',
    template: '%s · SuqET',
  },
  description: 'Buy and sell trusted second-hand goods across Ethiopia with escrow payments.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} font-sans antialiased`}>
        <AuthProvider>
          <Navbar />
          <main className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-6xl px-4 py-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
