export type Inline =
  | { readonly type: "text"; readonly text: string }
  | { readonly type: "strong"; readonly text: string }
  | { readonly type: "link"; readonly text: string; readonly href: string };

export type Block =
  | { readonly type: "h2"; readonly text: string }
  | { readonly type: "p"; readonly inlines: readonly Inline[] }
  | { readonly type: "ul"; readonly items: readonly (readonly Inline[])[] };

export class ArticleMarkdownError extends Error {}

const INLINE = /\*\*([^*\n]+)\*\*|\[([^\]\n]+)\]\(([^)\s]+)\)/g;
const INTERNAL_HREF = /^\/[a-z0-9\-/]*$/;
const LEFTOVER_MARKUP = /[*[\]<>`|]|\]\(/;
const UNSUPPORTED_LINE = /^(#|>|```|[-*+]\s|\d+\.\s|\|)/;

function assertPlain(text: string): string {
  if (LEFTOVER_MARKUP.test(text)) throw new ArticleMarkdownError(`неподдерживаемая разметка: ${text.slice(0, 60)}`);
  return text;
}

function parseInlines(text: string): Inline[] {
  const result: Inline[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const at = match.index ?? 0;
    if (at > last) result.push({ type: "text", text: assertPlain(text.slice(last, at)) });
    if (match[1] !== undefined) {
      result.push({ type: "strong", text: match[1] });
    } else {
      const href = match[3] ?? "";
      if (!INTERNAL_HREF.test(href)) throw new ArticleMarkdownError(`ссылка должна быть внутренней (начинаться с «/»): ${href}`);
      result.push({ type: "link", text: match[2] ?? "", href });
    }
    last = at + match[0].length;
  }
  if (last < text.length) result.push({ type: "text", text: assertPlain(text.slice(last)) });
  return result;
}

function parseBlock(chunk: string): Block {
  const lines = chunk.split("\n");
  if (chunk.startsWith("## ")) {
    if (lines.length !== 1) throw new ArticleMarkdownError(`заголовок должен быть в одной строке: ${chunk.slice(0, 60)}`);
    return { type: "h2", text: assertPlain(chunk.slice(3).trim()) };
  }
  if (lines.every((line) => line.startsWith("- "))) return { type: "ul", items: lines.map((line) => parseInlines(line.slice(2).trim())) };
  if (lines.some((line) => UNSUPPORTED_LINE.test(line))) throw new ArticleMarkdownError(`неподдерживаемый блок: ${chunk.slice(0, 60)}`);
  return { type: "p", inlines: parseInlines(lines.map((line) => line.trim()).join(" ")) };
}

export function parseMarkdown(body: string): Block[] {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map(parseBlock);
}

const inlineText = (inlines: readonly Inline[]): string => inlines.map((inline) => inline.text).join("");

export function plainText(blocks: readonly Block[]): string {
  return blocks
    .flatMap((block) => (block.type === "h2" ? [block.text] : block.type === "p" ? [inlineText(block.inlines)] : block.items.map(inlineText)))
    .join("\n");
}

export function linksOf(blocks: readonly Block[]): string[] {
  const inlines = blocks.flatMap((block) => (block.type === "p" ? [block.inlines] : block.type === "ul" ? block.items : []));
  return inlines.flat().flatMap((inline) => (inline.type === "link" ? [inline.href] : []));
}
