"use client";

/**
 * Lightweight, dependency-free emoji picker.
 * - Categorized tabs + search + frequently-used recents (localStorage).
 * - Renders as a floating popover anchored to the composer's smile button.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { SearchX } from "lucide-react";

const RECENTS_KEY = "findback:emoji-recents";

const CATEGORIES: { id: string; label: string; icon: string; emojis: string[] }[] = [
  {
    id: "smileys",
    label: "Smileys",
    icon: "😀",
    emojis: [
      "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙",
      "🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬",
      "🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🥵","🥶","😵","🤯","🤠","🥳","😎","🤓","🧐",
    ],
  },
  {
    id: "gestures",
    label: "People",
    icon: "👍",
    emojis: [
      "👍","👎","👌","🤌","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","☝️","👋","🤚","🖐️","✋","🖖","🤛",
      "🙌","🤝","🙏","💪","🦾","✍️","💅","👀","🧠","🫶","🤲","👐","🙋","💆","🤷","🙅","🙆","💁","🧑","🧕",
    ],
  },
  {
    id: "hearts",
    label: "Hearts",
    icon: "❤️",
    emojis: [
      "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","♥️",
      "💌","😻","🫀","💐","🌹","🌸","🌺","🌻","🌼","🌷",
    ],
  },
  {
    id: "items",
    label: "Items",
    icon: "🎒",
    emojis: [
      "🎒","👜","👛","📌","📍","🔍","🔎","🗺️","🧭","📱","💻","📷","📸","🎥","🔔","🔊","🔑","🗝️","🧳","⛓️",
      "👓","🕶️","🧢","👒","🎓","💍","🌂","☂️","🧣","🧤","🥇","🏆","🎁","🎈","🐶","🐱","🦴","🐾","🪪","🧸",
    ],
  },
  {
    id: "misc",
    label: "Misc",
    icon: "🔥",
    emojis: [
      "🔥","✨","⭐","🌟","💫","⚡","💥","💯","🎉","🎊","🎯","🚀","🆗","✅","❌","⚠️","❗","❓","💡","🕐",
      "☕","🍕","🍔","🍟","🍩","🍪","🌈","☀️","🌙","☁️",
    ],
  },
];

export function EmojiPicker({
  onPick,
  onClose,
}: {
  onPick: (emoji: string) => void;
  onClose: () => void;
}) {
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].id);
  const [query, setQuery] = useState("");
  const [recents, setRecents] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  // Load recents once.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENTS_KEY);
      if (raw) setRecents(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, []);

  // Close on outside click / Escape.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const pick = (emoji: string) => {
    onPick(emoji);
    setRecents((prev) => {
      const next = [emoji, ...prev.filter((e) => e !== emoji)].slice(0, 24);
      try {
        localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const grid = useMemo(() => {
    if (query.trim()) return CATEGORIES.flatMap((c) => c.emojis);
    const cat = CATEGORIES.find((c) => c.id === activeCat);
    return cat ? cat.emojis : [];
  }, [query, activeCat]);

  const showRecents = !query.trim() && activeCat === CATEGORIES[0].id && recents.length > 0;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label="Emoji picker"
      className="absolute bottom-12 left-0 z-30 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
    >
      {/* Search */}
      <div className="border-b border-slate-100 p-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search emoji"
          aria-label="Search emoji"
          className="w-full rounded-full bg-slate-100 px-3 py-1.5 text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-electric-200"
        />
      </div>

      {/* Category tabs */}
      {!query.trim() && (
        <div className="flex items-center gap-0.5 border-b border-slate-100 px-2 py-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCat(c.id)}
              aria-label={c.label}
              aria-pressed={activeCat === c.id}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg transition ${
                activeCat === c.id ? "bg-electric-50" : "hover:bg-slate-100"
              }`}
            >
              {c.icon}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="max-h-56 overflow-y-auto p-2">
        {showRecents && (
          <>
            <p className="px-1 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Frequently used
            </p>
            <div className="grid grid-cols-8 gap-0.5 pb-2">
              {recents.map((e) => (
                <button
                  key={`r-${e}`}
                  type="button"
                  onClick={() => pick(e)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition hover:bg-slate-100"
                  aria-label={`Emoji ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </>
        )}
        {grid.length === 0 ? (
          <div className="flex flex-col items-center gap-1 py-6 text-slate-400">
            <SearchX size={18} />
            <p className="text-xs">No emoji found</p>
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-0.5">
            {grid.map((e, i) => (
              <button
                key={`${e}-${i}`}
                type="button"
                onClick={() => pick(e)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition hover:bg-slate-100"
                aria-label={`Emoji ${e}`}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
