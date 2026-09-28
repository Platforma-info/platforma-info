import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight, Clock, ExternalLink, ListTree } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  articleHref,
  getAdjacentArticles,
  getAllArticles,
  getArticle,
  getPrerequisites,
} from "@/lib/theory/content";
import { renderMarkdown } from "@/lib/theory/render";
import { TRACKS_BY_SLUG } from "@/lib/theory/tracks";
import { ArticleEnhancer } from "@/components/theory/article-enhancer";
import { CompleteButton } from "@/components/theory/complete-button";
import { TableOfContents } from "@/components/theory/toc";
import { TheoryDifficultyBadge } from "@/components/theory/theory-difficulty";
import { TrackNav } from "@/components/theory/track-nav";

const SITE_URL = "https://pyinfo.vercel.app";

type Params = { track: string; slug: string };

export function generateStaticParams(): Params[] {
  return getAllArticles().map((a) => ({ track: a.track, slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { track, slug } = await params;
  const article = getArticle(track, slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.summary,
    keywords: article.tags,
    alternates: { canonical: articleHref(article) },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.summary,
      url: articleHref(article),
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { track: trackSlug, slug } = await params;
  const article = getArticle(trackSlug, slug);
  const track = TRACKS_BY_SLUG[trackSlug];
  if (!article || !track) notFound();

  const { html, headings } = await renderMarkdown(article.body, `${article.track}/${article.slug}`);
  const { prev, next } = getAdjacentArticles(article);
  const prerequisites = getPrerequisites(article);
  const id = `${article.track}/${article.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: article.title,
    description: article.summary,
    inLanguage: "en",
    proficiencyLevel: article.difficulty,
    keywords: article.tags.join(", "),
    url: `${SITE_URL}${articleHref(article)}`,
    isPartOf: { "@type": "Course", name: track.title, url: `${SITE_URL}/theory/${track.slug}` },
    ...(article.source ? { isBasedOn: article.source.url, license: "https://creativecommons.org/licenses/by-sa/4.0/" } : {}),
  };

  return (
    <div className="mx-auto w-full max-w-7xl gap-10 px-4 py-8 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)_14rem]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ArticleEnhancer />

      <aside className="hidden lg:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
          <TrackNav trackSlug={track.slug} currentSlug={article.slug} />
        </div>
      </aside>

      <article className="min-w-0 max-w-3xl">
        <details className="mb-6 rounded-lg border p-3 lg:hidden">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <ListTree className="size-4" /> {track.title} contents
          </summary>
          <div className="mt-4">
            <TrackNav trackSlug={track.slug} currentSlug={article.slug} />
          </div>
        </details>

        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Link href="/theory" className="hover:text-foreground">
            Theory
          </Link>
          <ChevronRight className="size-3.5" />
          <Link href={`/theory/${track.slug}`} className="hover:text-foreground">
            {track.title}
          </Link>
          <ChevronRight className="size-3.5" />
          <span>{article.section}</span>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{article.title}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{article.summary}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <TheoryDifficultyBadge difficulty={article.difficulty} />
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="size-3.5" />
              {article.readingMinutes} min read
            </span>
            {article.tags.map((t) => (
              <Badge key={t} variant="secondary" className="text-[11px]">
                {t}
              </Badge>
            ))}
          </div>
          {prerequisites.length > 0 && (
            <p className="mt-4 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
              <span className="font-medium">Read first: </span>
              {prerequisites.map((p, i) => (
                <span key={`${p.track}/${p.slug}`}>
                  {i > 0 && ", "}
                  <Link href={articleHref(p)} className="underline underline-offset-2">
                    {p.title}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </header>

        <div className="theory-prose" dangerouslySetInnerHTML={{ __html: html }} />

        {article.problems.length > 0 && (
          <section className="mt-12 rounded-xl border p-5" aria-labelledby="practice">
            <h2 id="practice" className="mb-1 font-semibold">
              Practice
            </h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Apply this on the platform and get an instant verdict.
            </p>
            <div className="flex flex-wrap gap-2">
              {article.problems.map((p) => (
                <Button key={p} asChild variant="outline" size="sm">
                  <Link href={`/problems/${p}`}>{p.replace(/-/g, " ")}</Link>
                </Button>
              ))}
            </div>
          </section>
        )}

        <div className="mt-12 border-t pt-6">
          <CompleteButton id={id} />
          <nav aria-label="Previous and next article" className="mt-6 grid gap-3 sm:grid-cols-2">
            {prev ? (
              <Link
                href={articleHref(prev)}
                rel="prev"
                className="flex min-w-0 items-center gap-3 rounded-lg border p-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
              >
                <ArrowLeft className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="block text-xs text-muted-foreground">Previous</span>
                  <span className="block truncate font-medium">{prev.title}</span>
                </span>
              </Link>
            ) : (
              <span className="hidden sm:block" />
            )}
            {next && (
              <Link
                href={articleHref(next)}
                rel="next"
                className="flex min-w-0 items-center justify-end gap-3 rounded-lg border p-3 text-right transition-colors hover:border-primary/40 hover:bg-muted/40"
              >
                <span className="min-w-0">
                  <span className="block text-xs text-muted-foreground">Next</span>
                  <span className="block truncate font-medium">{next.title}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            )}
          </nav>
        </div>

        {article.source && (
          <footer className="mt-8 rounded-lg bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
            <p>
              This article is a Python adaptation of{" "}
              <a
                href={article.source.url}
                rel="noopener"
                className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-2"
              >
                “{article.source.title}” <ExternalLink className="size-3" />
              </a>{" "}
              from cp-algorithms.com, licensed under{" "}
              <a
                href="https://creativecommons.org/licenses/by-sa/4.0/"
                rel="noopener license"
                className="underline underline-offset-2"
              >
                {article.source.license}
              </a>
              . The text was condensed and rewritten and the C++ code was reimplemented in Python;
              this adaptation is shared under the same license.
            </p>
          </footer>
        )}
      </article>

      <aside className="hidden xl:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
          <TableOfContents headings={headings} />
        </div>
      </aside>
    </div>
  );
}
