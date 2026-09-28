import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { TRACKS, TRACKS_BY_SLUG, type Track } from "./tracks";

const CONTENT_DIR = path.join(process.cwd(), "content", "theory");

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export type TheoryDifficulty = (typeof DIFFICULTIES)[number];

export type ArticleSource = {
  title: string;
  url: string;
  license: string;
};

export type ArticleMeta = {
  track: string;
  slug: string;
  title: string;
  summary: string;
  section: string;
  order: number;
  difficulty: TheoryDifficulty;
  tags: string[];
  /** "track/slug" of articles worth reading first */
  prerequisites: string[];
  /** Slugs of practice problems on the platform */
  problems: string[];
  source: ArticleSource | null;
  readingMinutes: number;
};

export type Article = ArticleMeta & { body: string };

function fail(file: string, message: string): never {
  throw new Error(`[theory] ${file}: ${message}`);
}

function str(file: string, data: Record<string, unknown>, key: string): string {
  const v = data[key];
  if (typeof v !== "string" || !v.trim()) fail(file, `missing front-matter field "${key}"`);
  return v.trim();
}

function strList(file: string, data: Record<string, unknown>, key: string): string[] {
  const v = data[key];
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) {
    fail(file, `"${key}" must be a list of strings`);
  }
  return v as string[];
}

function readingMinutes(body: string): number {
  const words = body.replace(/```[\s\S]*?```/g, " ").split(/\s+/).filter(Boolean).length;
  const codeLines = (body.match(/```[\s\S]*?```/g) ?? []).reduce(
    (n, block) => n + block.split("\n").length - 2,
    0,
  );
  // ~200 wpm for prose plus a slower pace for code
  return Math.max(1, Math.round(words / 200 + codeLines / 25));
}

function parseArticle(track: Track, fileName: string): Article {
  const slug = fileName.replace(/\.md$/, "");
  const rel = `${track.slug}/${fileName}`;
  const raw = fs.readFileSync(path.join(CONTENT_DIR, track.slug, fileName), "utf8");
  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(raw);
  } catch (err) {
    fail(rel, `invalid front-matter: ${err instanceof Error ? err.message.split("\n")[0] : err}`);
  }
  const { data, content } = parsed;

  const section = str(rel, data, "section");
  if (!track.sections.includes(section)) {
    fail(rel, `unknown section "${section}" (expected one of: ${track.sections.join(", ")})`);
  }
  const difficulty = str(rel, data, "difficulty") as TheoryDifficulty;
  if (!DIFFICULTIES.includes(difficulty)) {
    fail(rel, `difficulty must be one of ${DIFFICULTIES.join(", ")}`);
  }
  const order = data.order;
  if (typeof order !== "number") fail(rel, `"order" must be a number`);

  let source: ArticleSource | null = null;
  if (data.source !== undefined) {
    const s = data.source as Record<string, unknown>;
    source = {
      title: str(rel, s, "title"),
      url: str(rel, s, "url"),
      license: str(rel, s, "license"),
    };
  }

  return {
    track: track.slug,
    slug,
    title: str(rel, data, "title"),
    summary: str(rel, data, "summary"),
    section,
    order,
    difficulty,
    tags: strList(rel, data, "tags"),
    prerequisites: strList(rel, data, "prerequisites"),
    problems: strList(rel, data, "problems"),
    source,
    body: content,
    readingMinutes: readingMinutes(content),
  };
}

let cache: Article[] | null = null;

function loadAll(): Article[] {
  if (cache && process.env.NODE_ENV === "production") return cache;

  const articles: Article[] = [];
  for (const track of TRACKS) {
    const dir = path.join(CONTENT_DIR, track.slug);
    if (!fs.existsSync(dir)) continue;
    for (const fileName of fs.readdirSync(dir).filter((f) => f.endsWith(".md"))) {
      articles.push(parseArticle(track, fileName));
    }
  }

  const known = new Set(articles.map((a) => `${a.track}/${a.slug}`));
  for (const a of articles) {
    for (const p of a.prerequisites) {
      if (!known.has(p)) fail(`${a.track}/${a.slug}.md`, `unknown prerequisite "${p}"`);
    }
  }

  articles.sort((a, b) => {
    const ta = TRACKS_BY_SLUG[a.track];
    const tb = TRACKS_BY_SLUG[b.track];
    return (
      TRACKS.indexOf(ta) - TRACKS.indexOf(tb) ||
      ta.sections.indexOf(a.section) - tb.sections.indexOf(b.section) ||
      a.order - b.order ||
      a.title.localeCompare(b.title)
    );
  });

  cache = articles;
  return articles;
}

export function getAllArticles(): Article[] {
  return loadAll();
}

export function getTrackArticles(trackSlug: string): Article[] {
  return loadAll().filter((a) => a.track === trackSlug);
}

export function getArticle(trackSlug: string, slug: string): Article | undefined {
  return loadAll().find((a) => a.track === trackSlug && a.slug === slug);
}

export type TrackSection = { title: string; articles: Article[] };

export function getTrackSections(trackSlug: string): TrackSection[] {
  const track = TRACKS_BY_SLUG[trackSlug];
  if (!track) return [];
  const articles = getTrackArticles(trackSlug);
  return track.sections
    .map((title) => ({ title, articles: articles.filter((a) => a.section === title) }))
    .filter((s) => s.articles.length > 0);
}

export function getAdjacentArticles(article: Article) {
  const list = getTrackArticles(article.track);
  const i = list.findIndex((a) => a.slug === article.slug);
  return { prev: list[i - 1] ?? null, next: list[i + 1] ?? null };
}

export function getPrerequisites(article: Article): Article[] {
  return article.prerequisites
    .map((p) => {
      const [t, s] = p.split("/");
      return getArticle(t, s);
    })
    .filter((a): a is Article => Boolean(a));
}

export function articleHref(a: { track: string; slug: string }) {
  return `/theory/${a.track}/${a.slug}`;
}
