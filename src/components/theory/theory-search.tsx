"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export type SearchItem = {
  href: string;
  title: string;
  summary: string;
  trackTitle: string;
  tags: string[];
};

function score(item: SearchItem, terms: string[]): number {
  const title = item.title.toLowerCase();
  const tags = item.tags.join(" ").toLowerCase();
  const rest = `${item.summary} ${item.trackTitle}`.toLowerCase();
  let total = 0;
  for (const t of terms) {
    if (title.startsWith(t)) total += 6;
    else if (title.includes(t)) total += 4;
    else if (tags.includes(t)) total += 3;
    else if (rest.includes(t)) total += 1;
    else return 0; // every term must match somewhere
  }
  return total;
}

export function TheorySearch({ items }: { items: SearchItem[] }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return items
      .map((item) => ({ item, s: score(item, terms) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((r) => r.item);
  }, [items, query]);

  return (
    <div className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search articles: dijkstra, segment tree, sieve…"
        aria-label="Search theory articles"
        className="h-11 pl-9"
      />
      {query.trim() && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-lg border bg-popover shadow-lg">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              No articles match “{query.trim()}”.
            </p>
          ) : (
            <ul>
              {results.map((r) => (
                <li key={r.href}>
                  <Link
                    href={r.href}
                    className="block border-b px-4 py-2.5 last:border-b-0 hover:bg-muted"
                  >
                    <span className="block text-sm font-medium">{r.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {r.trackTitle} · {r.summary}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
