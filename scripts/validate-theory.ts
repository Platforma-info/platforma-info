/**
 * Loads every theory article through the same loader the site uses, so invalid
 * front-matter, unknown sections or broken prerequisites fail here (and in CI)
 * instead of at build time.
 *
 *   npm run theory:check
 */
import { getAllArticles } from "../src/lib/theory/content";
import { TRACKS } from "../src/lib/theory/tracks";

const articles = getAllArticles();
const perTrack = TRACKS.map((t) => `${t.slug}: ${articles.filter((a) => a.track === t.slug).length}`);
console.log(`front-matter OK for ${articles.length} articles (${perTrack.join(", ")})`);
