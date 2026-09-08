"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

/**
 * Cloudflare Turnstile widget (client).
 *
 * Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY is not configured, so
 * local dev and pre-launch deploys keep working unchanged. When configured, it
 * lazy-loads Cloudflare's script, renders the Managed challenge, and exposes
 * the resulting token via onVerify + a ref-style imperative reset (so parents
 * can reset the widget after a failed submission — a spent token cannot be
 * reused).
 *
 * Token lifecycle: each solve is single-use server-side. Parents MUST call
 * reset() after a failed server attempt, or the retry will fail verification.
 */

type TurnstileApi = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      "error-callback"?: () => void;
      "expired-callback"?: () => void;
      theme?: "light" | "dark" | "auto";
    }
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadTurnstileScript(): Promise<TurnstileApi> {
  return new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    const onReady = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("Turnstile script loaded but API missing"));
    };
    if (existing) {
      existing.addEventListener("load", onReady);
      existing.addEventListener("error", () => reject(new Error("Turnstile script failed")));
      // Already loaded previously (async/defer scripts fire load once).
      if (window.turnstile) onReady();
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", onReady);
    script.addEventListener("error", () => reject(new Error("Turnstile script failed")));
    document.head.appendChild(script);
  });
}

export function TurnstileWidget({
  onVerify,
  onError,
  onExpire,
  resetRef,
}: {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  /** Receives a reset() callback once the widget is rendered. */
  resetRef?: (reset: (() => void) | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);
  const elementId = useId();

  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);
  onVerifyRef.current = onVerify;
  onErrorRef.current = onError;
  onExpireRef.current = onExpire;

  const reset = useCallback(() => {
    if (widgetIdRef.current !== null && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    loadTurnstileScript()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) return;
        // Render into a fresh child so React never fights the injected iframe.
        const mount = document.createElement("div");
        containerRef.current.appendChild(mount);
        widgetIdRef.current = turnstile.render(mount, {
          sitekey: SITE_KEY,
          callback: (token) => onVerifyRef.current(token),
          "error-callback": () => {
            setFailed(true);
            onErrorRef.current?.();
          },
          "expired-callback": () => onExpireRef.current?.(),
          theme: "auto",
        });
        resetRef?.(reset);
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      resetRef?.(null);
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Widget already gone (e.g. unmounted mid-render).
        }
        widgetIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SITE_KEY]);

  if (!SITE_KEY) return null;

  if (failed) {
    return (
      <p className="auth-error-block" role="alert">
        <span>
          Security challenge failed to load. Refresh the page to try again.
        </span>
      </p>
    );
  }

  return (
    <div
      id={elementId}
      ref={containerRef}
      aria-label="Security challenge"
      role="group"
      style={{ display: "flex", justifyContent: "center", minHeight: 65 }}
    />
  );
}
