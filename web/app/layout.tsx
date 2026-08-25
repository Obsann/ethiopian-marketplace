import type { Metadata } from 'next';
import Script from 'next/script';
import { Cormorant, Montserrat } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileTabBar } from '@/components/MobileTabBar';
import { GoogleTranslate } from '@/components/GoogleTranslate';

const sans = Montserrat({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
});

const display = Cormorant({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
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
      <body className={`${sans.variable} ${display.variable} font-sans antialiased`}>
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
            function mountTranslate() {
              if (window.__suqetTranslateInited) return true;
              var el = document.getElementById('google_translate_element');
              var TE = window.google && window.google.translate && window.google.translate.TranslateElement;
              if (!el || typeof TE !== 'function') return false;
              if (el.childElementCount > 0) {
                window.__suqetTranslateInited = true;
                return true;
              }
              new TE({
                pageLanguage: 'en',
                includedLanguages: 'en,am,om,ti',
                autoDisplay: false
              }, 'google_translate_element');
              window.__suqetTranslateInited = true;
              return true;
            }
            window.googleTranslateElementInit = function () {
              if (mountTranslate()) return;
              var tries = 0;
              var maxTries = 40;
              var timer = setInterval(function () {
                tries += 1;
                if (mountTranslate() || tries >= maxTries) clearInterval(timer);
              }, 50);
            };
          })();
        `}</Script>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <ErrorBoundary>
              <main className="flex-1 pb-20 md:pb-0">{children}</main>
            </ErrorBoundary>
            <Footer />
            <MobileTabBar />
          </div>
          <GoogleTranslate />
        </AuthProvider>
      </body>
    </html>
  );
}
