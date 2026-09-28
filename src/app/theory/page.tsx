import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { articleHref, getAllArticles, getTrackArticles } from "@/lib/theory/content";
import { GROUPS, TRACKS, type TrackGroup } from "@/lib/theory/tracks";
import { TheorySearch, type SearchItem } from "@/components/theory/theory-search";
import { TrackIcon } from "@/components/theory/track-icon";
import { TrackProgress } from "@/components/theory/track-progress";

export const metadata: Metadata = {
  title: "Theory",
  description:
    "Free algorithm and Python theory: fundamentals, number theory, data structures, dynamic programming, strings and graphs, explained with tested Python code.",
  alternates: { canonical: "/theory" },
};

export default function TheoryHubPage() {
  const all = getAllArticles();
  const tracks = TRACKS.filter((t) => getTrackArticles(t.slug).length > 0);

  const searchItems: SearchItem[] = all.map((a) => ({
    href: articleHref(a),
    title: a.title,
    summary: a.summary,
    trackTitle: TRACKS.find((t) => t.slug === a.track)?.title ?? "",
    tags: a.tags,
  }));

  const groups = (Object.keys(GROUPS) as TrackGroup[]).map((g) => ({
    key: g,
    ...GROUPS[g],
    tracks: tracks.filter((t) => t.group === g),
  }));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <header className="mb-12 flex flex-col items-center gap-5 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
          <GraduationCap className="size-3.5" />
          {all.length} articles · every code sample is tested
        </div>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Theory</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Learn the language, then the algorithms. Each article explains the idea, proves why it
          works and gives a complete Python implementation you can paste into the editor.
        </p>
        <TheorySearch items={searchItems} />
      </header>

      <section aria-labelledby="path" className="mb-14 rounded-xl border bg-muted/30 p-6">
        <h2 id="path" className="mb-1 text-lg font-semibold">
          Where to start
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          A suggested order if you are new. Skip whatever you already know.
        </p>
        <ol className="grid gap-3 sm:grid-cols-3">
          {[
            { n: 1, slug: "python-basics", hint: "Never coded, or new to Python" },
            { n: 2, slug: "python-contests", hint: "Comfortable with Python, new to contests" },
            { n: 3, slug: "graphs", hint: "Ready for algorithms" },
          ].map((step) => {
            const track = tracks.find((t) => t.slug === step.slug);
            if (!track) return null;
            return (
              <li key={step.slug}>
                <Link
                  href={`/theory/${track.slug}`}
                  className="flex h-full items-start gap-3 rounded-lg border bg-background p-4 transition-colors hover:border-primary/40"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {step.n}
                  </span>
                  <span>
                    <span className="block font-medium leading-tight">{track.title}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{step.hint}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {groups.map((group) =>
        group.tracks.length === 0 ? null : (
          <section key={group.key} className="mb-12" aria-labelledby={`group-${group.key}`}>
            <h2 id={`group-${group.key}`} className="text-2xl font-semibold tracking-tight">
              {group.title}
            </h2>
            <p className="mb-5 mt-1 text-sm text-muted-foreground">{group.description}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {group.tracks.map((track) => {
                const articles = getTrackArticles(track.slug);
                const minutes = articles.reduce((n, a) => n + a.readingMinutes, 0);
                return (
                  <Link key={track.slug} href={`/theory/${track.slug}`} className="group">
                    <Card className="h-full transition-colors group-hover:border-primary/40 group-hover:bg-muted/30">
                      <CardContent className="flex h-full flex-col gap-3 pt-2">
                        <div className="flex items-start justify-between gap-3">
                          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <TrackIcon name={track.icon} className="size-5" />
                          </span>
                          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </div>
                        <div>
                          <h3 className="font-semibold leading-tight">{track.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{track.description}</p>
                        </div>
                        <div className="mt-auto flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                          <Badge variant="secondary">{articles.length} articles</Badge>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3" />~{minutes} min
                          </span>
                        </div>
                        <TrackProgress ids={articles.map((a) => `${a.track}/${a.slug}`)} />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        ),
      )}

      <p className="border-t pt-6 text-xs text-muted-foreground">
        The algorithms tracks are Python adaptations of articles from{" "}
        <a className="underline" href="https://cp-algorithms.com" rel="noopener">
          cp-algorithms.com
        </a>
        , shared under CC BY-SA 4.0. See the notice at the bottom of each article.
      </p>
    </div>
  );
}
