import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { articleHref, getTrackArticles, getTrackSections } from "@/lib/theory/content";
import { TRACKS, TRACKS_BY_SLUG } from "@/lib/theory/tracks";
import { CompletionMark } from "@/components/theory/completion-mark";
import { TheoryDifficultyBadge } from "@/components/theory/theory-difficulty";
import { TrackIcon } from "@/components/theory/track-icon";
import { TrackProgress } from "@/components/theory/track-progress";

type Params = { track: string };

export function generateStaticParams(): Params[] {
  return TRACKS.filter((t) => getTrackArticles(t.slug).length > 0).map((t) => ({ track: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const track = TRACKS_BY_SLUG[(await params).track];
  if (!track) return {};
  return {
    title: track.title,
    description: track.description,
    alternates: { canonical: `/theory/${track.slug}` },
  };
}

export default async function TrackPage({ params }: { params: Promise<Params> }) {
  const track = TRACKS_BY_SLUG[(await params).track];
  const sections = track ? getTrackSections(track.slug) : [];
  if (!track || sections.length === 0) notFound();

  const articles = sections.flatMap((s) => s.articles);
  const ids = articles.map((a) => `${a.track}/${a.slug}`);
  const minutes = articles.reduce((n, a) => n + a.readingMinutes, 0);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/theory" className="hover:text-foreground">
          Theory
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{track.title}</span>
      </nav>

      <header className="mb-10">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <TrackIcon name={track.icon} className="size-6" />
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">{track.title}</h1>
        </div>
        <p className="text-muted-foreground">{track.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span>{articles.length} articles</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />~{minutes} min total
          </span>
        </div>
        <div className="mt-4 max-w-sm">
          <TrackProgress ids={ids} />
        </div>
        <Button asChild className="mt-6">
          <Link href={articleHref(articles[0])}>
            Start with “{articles[0].title}” <ArrowRight className="size-4" />
          </Link>
        </Button>
      </header>

      <div className="space-y-10">
        {sections.map((section, i) => (
          <section key={section.title} aria-labelledby={`s-${i}`}>
            <h2 id={`s-${i}`} className="mb-3 text-lg font-semibold">
              {section.title}
            </h2>
            <ul className="divide-y rounded-xl border">
              {section.articles.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={articleHref(a)}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <CompletionMark id={`${a.track}/${a.slug}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium leading-tight">{a.title}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">{a.summary}</span>
                    </span>
                    <span className="hidden shrink-0 items-center gap-3 sm:flex">
                      <span className="text-xs text-muted-foreground">{a.readingMinutes} min</span>
                      <TheoryDifficultyBadge difficulty={a.difficulty} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
