import Link from "next/link";
import { cn } from "@/lib/utils";
import { articleHref, getTrackSections } from "@/lib/theory/content";
import { TRACKS_BY_SLUG } from "@/lib/theory/tracks";
import { CompletionMark } from "./completion-mark";
import { TrackProgress } from "./track-progress";

export function TrackNav({ trackSlug, currentSlug }: { trackSlug: string; currentSlug?: string }) {
  const track = TRACKS_BY_SLUG[trackSlug];
  const sections = getTrackSections(trackSlug);
  const ids = sections.flatMap((s) => s.articles.map((a) => `${a.track}/${a.slug}`));

  return (
    <nav aria-label={`${track.title} contents`} className="text-sm">
      <Link href={`/theory/${track.slug}`} className="font-semibold hover:underline">
        {track.title}
      </Link>
      <div className="mt-3 mb-5">
        <TrackProgress ids={ids} />
      </div>
      <div className="space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.articles.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={articleHref(a)}
                    aria-current={a.slug === currentSlug ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 leading-snug transition-colors hover:bg-muted",
                      a.slug === currentSlug && "bg-muted font-medium",
                    )}
                  >
                    <CompletionMark id={`${a.track}/${a.slug}`} />
                    <span>{a.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
