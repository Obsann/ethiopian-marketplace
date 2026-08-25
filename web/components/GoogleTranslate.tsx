'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { useAuth } from '@/lib/auth';

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

const FIXED_STYLE = 'position:fixed;bottom:16px;left:16px;z-index:9999;';
const HEADER_STYLE = 'position:static;';

/**
 * Persistent Google Translate Element (MedSchedule layout).
 * Logged out → fixed bottom-left on body host.
 * Logged in → teleported into #google_translate_header_target (Navbar).
 * Init + React DOM patch live in root layout beforeInteractive Script.
 */
export function GoogleTranslate() {
  const { user, isLoading } = useAuth();
  const bodyHostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoading) return;

    const el = document.getElementById('google_translate_element');
    const bodyHost = bodyHostRef.current;
    const headerTarget = document.getElementById('google_translate_header_target');
    if (!el || !bodyHost) return;

    if (user && headerTarget) {
      el.setAttribute('style', HEADER_STYLE);
      if (el.parentElement !== headerTarget) {
        headerTarget.appendChild(el);
      }
    } else {
      el.setAttribute('style', FIXED_STYLE);
      if (el.parentElement !== bodyHost) {
        bodyHost.appendChild(el);
      }
    }
  }, [user, isLoading]);

  return (
    <>
      <div ref={bodyHostRef} id="google_translate_body_host">
        <div
          id="google_translate_element"
          className="notranslate"
          style={{ position: 'fixed', bottom: 16, left: 16, zIndex: 9999 }}
          aria-label="Translate page language"
        />
      </div>
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
