import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeKatex from "rehype-katex";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import { toString } from "hast-util-to-string";
import type { Element, Root, ElementContent } from "hast";
import type { Processor } from "unified";
import type { VFile } from "vfile";

export type Heading = { id: string; text: string; depth: 2 | 3 };

declare module "vfile" {
  interface DataMap {
    headings: Heading[];
  }
}

export type RenderedArticle = { html: string; headings: Heading[] };

const CALLOUTS: Record<string, string> = {
  NOTE: "Note",
  TIP: "Tip",
  WARNING: "Warning",
  IMPORTANT: "Important",
  EXAMPLE: "Example",
  PYTHON: "Python note",
};

const CALLOUT_RE = new RegExp(`^\\[!(${Object.keys(CALLOUTS).join("|")})\\][ \\t]*\\n?`, "i");

function el(
  tagName: string,
  properties: Element["properties"],
  children: ElementContent[] = [],
): Element {
  return { type: "element", tagName, properties, children };
}

/** `> [!NOTE]` blockquotes become styled callouts. */
function rehypeCallouts() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "blockquote") return;
      const firstP = node.children.find(
        (c): c is Element => c.type === "element" && c.tagName === "p",
      );
      const first = firstP?.children[0];
      if (!firstP || !first || first.type !== "text") return;
      const m = CALLOUT_RE.exec(first.value);
      if (!m) return;

      const kind = m[1].toUpperCase();
      first.value = first.value.slice(m[0].length);
      const body = node.children.filter((c) => !(c.type === "text" && !c.value.trim()));

      node.tagName = "aside";
      node.properties = { className: ["callout", `callout-${kind.toLowerCase()}`] };
      node.children = [el("p", { className: ["callout-title"] }, [{ type: "text", value: CALLOUTS[kind] }]), ...body];
    });
  };
}

/** Collect h2/h3 headings (after ids have been assigned by rehype-slug) into `file.data.headings`. */
function rehypeCollectHeadings(): (tree: Root, file: VFile) => void {
  return (tree, file) => {
    const headings: Heading[] = [];
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "h2" && node.tagName !== "h3") return;
      const id = String(node.properties?.id ?? "");
      if (!id) return;
      headings.push({ id, text: toString(node), depth: node.tagName === "h2" ? 2 : 3 });
    });
    file.data.headings = headings;
  };
}

/** Wrap code blocks with a header (language + copy button) and tables for scrolling. */
function rehypeChrome() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (!parent || index === undefined) return;

      if (node.tagName === "table") {
        parent.children[index] = el("div", { className: ["table-wrap"] }, [node]);
        return "skip";
      }

      if (node.tagName === "pre") {
        const lang = langOf(node);
        const header = el("div", { className: ["code-header"] }, [
          el("span", { className: ["code-lang"] }, [{ type: "text", value: lang || "text" }]),
          el("button", { type: "button", className: ["code-copy"], "data-copy": "" }, [
            { type: "text", value: "Copy" },
          ]),
        ]);
        parent.children[index] = el("figure", { className: ["code-block"] }, [header, node]);
        return "skip";
      }
    });
  };
}

function langOf(pre: Element): string {
  const classes = (pre.properties?.className as string[] | undefined) ?? [];
  const code = pre.children.find((c): c is Element => c.type === "element" && c.tagName === "code");
  const codeClasses = (code?.properties?.className as string[] | undefined) ?? [];
  const cls = [...classes, ...codeClasses].find((c) => c.startsWith("language-"));
  return cls ? cls.slice("language-".length) : "";
}

// Only the languages the articles use are loaded, with the pure-JS regex engine: this avoids
// Shiki's WebAssembly engine and its ~200 grammars, cutting the cold start from seconds to ms.
async function buildProcessor() {
  const highlighter = await createHighlighterCore({
    themes: [import("@shikijs/themes/github-light"), import("@shikijs/themes/github-dark")],
    langs: [import("@shikijs/langs/python")],
    engine: createJavaScriptRegexEngine(),
  });

  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeCallouts)
    .use(rehypeSlug)
    .use(rehypeCollectHeadings)
    .use(rehypeKatex, { strict: "ignore" })
    .use(rehypeChrome)
    .use(rehypeShikiFromHighlighter, highlighter as unknown as Parameters<typeof rehypeShikiFromHighlighter>[0], {
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
      fallbackLanguage: "text",
    })
    .use(rehypeStringify)
    .freeze();
}

let processorPromise: Promise<Processor<Root, Root, Root, Root, string>> | undefined;
const renderCache = new Map<string, RenderedArticle>();

/**
 * Render an article. The processor is built once per server instance, and in production
 * the result is memoized by `cacheKey` (content only changes with a new deployment).
 */
export async function renderMarkdown(markdown: string, cacheKey?: string): Promise<RenderedArticle> {
  const useCache = Boolean(cacheKey) && process.env.NODE_ENV === "production";
  if (useCache) {
    const hit = renderCache.get(cacheKey!);
    if (hit) return hit;
  }

  processorPromise ??= buildProcessor() as unknown as Promise<Processor<Root, Root, Root, Root, string>>;
  const processor = await processorPromise;
  const file = await processor.process(markdown);
  const result: RenderedArticle = { html: String(file), headings: file.data.headings ?? [] };

  if (useCache) renderCache.set(cacheKey!, result);
  return result;
}
