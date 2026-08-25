import type { Metadata } from 'next';
import Script from 'next/script';
import { DM_Sans, Fraunces } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { GoogleTranslate } from '@/components/GoogleTranslate';

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
  description: 'Buy and sell second-hand goods across Ethiopia.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
        />
      </head>
      <body className={`${sans.variable} ${display.variable} font-sans antialiased`}>
        {/* Google Translate: React DOM patch + init callback before element.js loads. */}
        <Script id="google-translate-bootstrap" strategy="beforeInteractive">{`
          (function () {
            if (typeof Node === 'function' && Node.prototype && !window.__gtDomPatched) {
              window.__gtDomPatched = true;
              var _origRemoveChild = Node.prototype.removeChild;
              Node.prototype.removeChild = function (child) {
                if (child.parentNode !== this) return child;
                return _origRemoveChild.apply(this, arguments);
              };
              var _origInsertBefore = Node.prototype.insertBefore;
              Node.prototype.insertBefore = function (newNode, refNode) {
                if (refNode && refNode.parentNode !== this) return newNode;
                return _origInsertBefore.apply(this, arguments);
              };
            }
            window.googleTranslateElementInit = function () {
              if (window.__gtInitialized) return;
              var el = document.getElementById('google_translate_element');
              if (!el || !window.google || !window.google.translate) return;
              if (el.childElementCount > 0) {
                window.__gtInitialized = true;
                return;
              }
              new google.translate.TranslateElement({
                pageLanguage: 'en',
                includedLanguages: 'en,am,om,ti',
                autoDisplay: false
              }, 'google_translate_element');
              window.__gtInitialized = true;
            };
          })();
        `}</Script>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <ErrorBoundary>
              <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>
            </ErrorBoundary>
            <Footer />
          </div>
          <GoogleTranslate />
        </AuthProvider>
      </body>
    </html>
  );
}
