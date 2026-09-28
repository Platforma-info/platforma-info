import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeKatex from "rehype-katex";
import rehypeShiki from "@shikijs/rehype";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import { toString } from "hast-util-to-string";
import type { Element, Root, ElementContent } from "hast";

export type Heading = { id: string; text: string; depth: 2 | 3 };

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

/** Collect h2/h3 headings (after ids have been assigned by rehype-slug). */
function rehypeCollectHeadings(out: Heading[]) {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "h2" && node.tagName !== "h3") return;
      const id = String(node.properties?.id ?? "");
      if (!id) return;
      out.push({ id, text: toString(node), depth: node.tagName === "h2" ? 2 : 3 });
    });
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

export async function renderMarkdown(markdown: string): Promise<RenderedArticle> {
  const headings: Heading[] = [];

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeCallouts)
    .use(rehypeSlug)
    .use(rehypeCollectHeadings, headings)
    .use(rehypeKatex, { strict: "ignore" })
    .use(rehypeChrome)
    .use(rehypeShiki, {
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
      defaultLanguage: "text",
      fallbackLanguage: "text",
    })
    .use(rehypeStringify)
    .process(markdown);

  return { html: String(file), headings };
}
