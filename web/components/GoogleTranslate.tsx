'use client';

import { useEffect } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    __suqetTranslateInited?: boolean;
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

const HEADER_STYLE = 'position:static;';

/**
 * Persistent Google Translate Element.
 * Always teleports #google_translate_element into #google_translate_header_target (Navbar).
 * Falls back to an off-layout body host until the header target mounts, then moves.
 * Init callback is defined in root layout beforeInteractive; element.js uses cb= only.
 */
export function GoogleTranslate() {
  useEffect(() => {
    const moveToHeader = () => {
      const el = document.getElementById('google_translate_element');
      const headerTarget = document.getElementById('google_translate_header_target');
      if (!el || !headerTarget) return false;
      el.setAttribute('style', HEADER_STYLE);
      if (el.parentElement !== headerTarget) {
        headerTarget.appendChild(el);
      }
      return true;
    };

    if (moveToHeader()) return;

    // Header target may not exist on first paint; retry briefly until Navbar mounts.
    let tries = 0;
    const maxTries = 40;
    const timer = setInterval(() => {
      tries += 1;
      if (moveToHeader() || tries >= maxTries) clearInterval(timer);
    }, 50);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* Fallback host until Navbar header target is available */}
      <div id="google_translate_body_host" className="sr-only" aria-hidden>
        <div
          id="google_translate_element"
          className="notranslate"
          aria-label="Translate page language"
        />
      </div>
      {/* Load once via cb= only — do not also call init from onLoad (race). */}
      <Script
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
}
