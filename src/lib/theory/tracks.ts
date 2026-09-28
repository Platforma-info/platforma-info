/**
 * Curriculum definition for the theory section.
 *
 * Tracks and their sections are declared here so their order is explicit and
 * reviewable. Articles (content/theory/<track>/<slug>.md) reference a track and
 * a section by name; the loader rejects anything that does not match.
 */

export type TrackGroup = "foundations" | "algorithms";

export type Track = {
  slug: string;
  title: string;
  description: string;
  group: TrackGroup;
  /** Key into the icon map in components/theory/track-icon.tsx */
  icon: string;
  /** Ordered section titles; articles are grouped and ordered by these. */
  sections: string[];
};

export const GROUPS: Record<TrackGroup, { title: string; description: string }> = {
  foundations: {
    title: "Foundations",
    description: "Learn Python and the toolkit you need to solve problems fast.",
  },
  algorithms: {
    title: "Algorithms & Data Structures",
    description:
      "The classic competitive-programming curriculum, explained and implemented in Python.",
  },
};

export const TRACKS: Track[] = [
  {
    slug: "python-basics",
    title: "Python Fundamentals",
    description:
      "From your first program to classes and comprehensions: the language features every solution is built on.",
    group: "foundations",
    icon: "book",
    sections: [
      "Getting started",
      "Data and text",
      "Collections",
      "Control flow",
      "Functions",
      "Files and errors",
      "Objects",
      "Idiomatic Python",
    ],
  },
  {
    slug: "python-contests",
    title: "Python for Contests",
    description:
      "Fast input, the right standard-library tools and the performance traps that decide whether a solution passes the time limit.",
    group: "foundations",
    icon: "zap",
    sections: ["Input and output", "Standard library toolbox", "Performance"],
  },
  {
    slug: "math",
    title: "Number Theory & Algebra",
    description:
      "Divisibility, primes, modular arithmetic and the bit tricks behind many olympiad problems.",
    group: "algorithms",
    icon: "sigma",
    sections: [
      "Fundamentals",
      "Prime numbers",
      "Number-theoretic functions",
      "Modular arithmetic",
      "Bits",
    ],
  },
  {
    slug: "data-structures",
    title: "Data Structures",
    description:
      "Structures that answer range queries and maintain sets under updates in logarithmic time.",
    group: "algorithms",
    icon: "boxes",
    sections: ["Fundamentals", "Trees"],
  },
  {
    slug: "dynamic-programming",
    title: "Dynamic Programming",
    description: "Turn exponential recursions into polynomial algorithms by remembering subproblems.",
    group: "algorithms",
    icon: "layers",
    sections: ["Introduction", "Classic problems"],
  },
  {
    slug: "strings",
    title: "String Algorithms",
    description: "Hashing, pattern matching and palindromes in linear time.",
    group: "algorithms",
    icon: "text",
    sections: ["Fundamentals", "Tasks"],
  },
  {
    slug: "graphs",
    title: "Graph Algorithms",
    description:
      "Traversals, shortest paths, spanning trees, connectivity and matchings on graphs.",
    group: "algorithms",
    icon: "network",
    sections: [
      "Graph traversal",
      "Connectivity",
      "Shortest paths",
      "Spanning trees",
      "Trees and LCA",
      "Flows and matchings",
      "Ordering",
    ],
  },
  {
    slug: "combinatorics",
    title: "Combinatorics",
    description: "Counting objects without listing them: binomials, Catalan numbers and inclusion-exclusion.",
    group: "algorithms",
    icon: "dices",
    sections: ["Fundamentals", "Techniques"],
  },
  {
    slug: "searching",
    title: "Searching & Numerical Methods",
    description: "Binary search on arrays and on answers, ternary search and iterative root finding.",
    group: "algorithms",
    icon: "search",
    sections: ["Search"],
  },
  {
    slug: "miscellaneous",
    title: "Games & Miscellaneous",
    description: "Game theory, cycle detection and other classic tricks that do not fit elsewhere.",
    group: "algorithms",
    icon: "puzzle",
    sections: ["Game theory", "Classic problems"],
  },
];

export const TRACKS_BY_SLUG: Record<string, Track> = Object.fromEntries(
  TRACKS.map((t) => [t.slug, t]),
);
