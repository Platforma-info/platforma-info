/**
 * Loads every theory article through the same loader the site uses, so invalid
 * front-matter, unknown sections or broken prerequisites fail here (and in CI)
 * instead of at build time. Then renders each article and fails on LaTeX that
 * KaTeX cannot parse (it would otherwise show up as red error text).
 *
 *   npm run theory:check
 */
import { getAllArticles } from "../src/lib/theory/content";
import { renderMarkdown } from "../src/lib/theory/render";
import { TRACKS } from "../src/lib/theory/tracks";

async function main() {
  const articles = getAllArticles();
  const perTrack = TRACKS.map((t) => `${t.slug}: ${articles.filter((a) => a.track === t.slug).length}`);
  console.log(`front-matter OK for ${articles.length} articles (${perTrack.join(", ")})`);

  const problems: string[] = [];
  for (const article of articles) {
    const { html } = await renderMarkdown(article.body);
    const errors = html.match(/<span class="katex-error"[^>]*title="([^"]*)"/g);
    if (errors) {
      for (const e of errors) problems.push(`${article.track}/${article.slug}: ${e.slice(0, 200)}`);
    }
  }
  if (problems.length > 0) {
    console.error(`\nKaTeX errors in ${problems.length} place(s):\n${problems.join("\n")}`);
    process.exit(1);
  }
  console.log("all formulas render");
}

main();
