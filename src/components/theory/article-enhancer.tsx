"use client";

import { useEffect } from "react";

/** Wires up the "Copy" buttons rendered inside article HTML (event delegation). */
export function ArticleEnhancer() {
  useEffect(() => {
    const timers = new WeakMap<HTMLElement, number>();

    async function onClick(e: MouseEvent) {
      const button = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-copy]");
      if (!button) return;
      const code = button.closest("figure")?.querySelector("pre")?.textContent ?? "";
      try {
        await navigator.clipboard.writeText(code);
        button.textContent = "Copied";
      } catch {
        button.textContent = "Press Ctrl+C";
      }
      window.clearTimeout(timers.get(button));
      timers.set(
        button,
        window.setTimeout(() => (button.textContent = "Copy"), 1600),
      );
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
