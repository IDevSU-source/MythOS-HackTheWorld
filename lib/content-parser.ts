export type ContentSection =
  | { type: "heading"; content: string }
  | { type: "subheading"; content: string }
  | { type: "body"; content: string }
  | { type: "quote"; content: string }
  | { type: "code"; content: string }
  | { type: "list"; items: string[] }
  | { type: "image"; alt: string; assetName: string }
  | { type: "table"; headers: string[]; rows: string[][] };

function cleanInline(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "**$1**")
    .trim();
}

export function parseMarkdownToSections(markdown: string): ContentSection[] {
  const sections: ContentSection[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let index = 0;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    const content = paragraph.join("\n").trim();
    if (content) sections.push({ type: "body", content: cleanInline(content) });
    paragraph = [];
  };

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed || /^-{3,}$/.test(trimmed)) {
      flushParagraph();
      index += 1;
      continue;
    }

    const image = trimmed.match(/^!\[([^\]]*)\]\(\/assets\/(?:infographics|images)\/([^\s)]+)\)$/);
    if (image) {
      flushParagraph();
      sections.push({ type: "image", alt: image[1] || "Source illustration", assetName: image[2] });
      index += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      sections.push({
        type: heading[1].length <= 2 ? "heading" : "subheading",
        content: cleanInline(heading[2]),
      });
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      flushParagraph();
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      sections.push({ type: "code", content: code.join("\n") });
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      const quote: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quote.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      sections.push({ type: "quote", content: cleanInline(quote.join(" ")) });
      continue;
    }

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushParagraph();
      const tableLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        tableLines.push(lines[index].trim());
        index += 1;
      }
      const rows = tableLines
        .filter((tableLine) => !/^\|?\s*:?-{3,}/.test(tableLine))
        .map((tableLine) => tableLine.split("|").slice(1, -1).map((cell) => cleanInline(cell)));
      if (rows.length > 0) {
        sections.push({ type: "table", headers: rows[0], rows: rows.slice(1) });
      }
      continue;
    }

    if (/^(?:[-*+]\s+|\d+\.\s+)/.test(trimmed)) {
      flushParagraph();
      const items: string[] = [];
      while (index < lines.length && /^(?:[-*+]\s+|\d+\.\s+)/.test(lines[index].trim())) {
        items.push(cleanInline(lines[index].trim().replace(/^(?:[-*+]\s+|\d+\.\s+)/, "")));
        index += 1;
      }
      sections.push({ type: "list", items });
      continue;
    }

    paragraph.push(line);
    index += 1;
  }

  flushParagraph();
  return sections;
}
