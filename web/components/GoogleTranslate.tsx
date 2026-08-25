'use client';

import Script from 'next/script';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    __gtInitialized?: boolean;
    __gtDomPatched?: boolean;
    google?: {
      translate: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            includedLanguages: string;
            autoDisplay: boolean;
          },
          elementId: string
        ) => void;
      };
    };
  }
}

/**
 * Fixed bottom-left Google Translate Element.
 * Mounted from root layout so it persists across App Router navigations.
 * Init callback + React DOM patch live in layout beforeInteractive Script.
 */
export function GoogleTranslate() {
  return (
    <>
      <div
        id="google_translate_element"
        className="notranslate google-translate-widget fixed bottom-4 left-4 z-[9999] max-w-[min(100vw-2rem,13.5rem)] rounded-xl border border-black/10 bg-paper/95 px-2.5 py-2 shadow-card backdrop-blur"
        aria-label="Translate page language"
      />
      <Script
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
        onLoad={() => {
          window.googleTranslateElementInit?.();
        }}
      />
    </>
  );
}
