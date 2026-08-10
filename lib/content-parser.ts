export interface ContentSection {
  type: 'heading' | 'subheading' | 'body' | 'quote' | 'code' | 'list';
  content?: string;
  items?: string[];
}

/**
 * Parses raw markdown content from TPS chapters into structured ContentSection arrays
 * for rendering in the interactive chapter reader.
 */
export function parseMarkdownToSections(markdown: string): ContentSection[] {
  const sections: ContentSection[] = [];
  const lines = markdown.split('\n');
  let i = 0;
  let currentBodyLines: string[] = [];

  const flushBody = () => {
    if (currentBodyLines.length > 0) {
      const text = currentBodyLines.join('\n').trim();
      if (text) {
        sections.push({ type: 'body', content: text });
      }
      currentBodyLines = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // Skip horizontal rules
    if (/^---+$/.test(line.trim())) {
      flushBody();
      i++;
      continue;
    }

    // H2 heading
    if (line.startsWith('## ')) {
      flushBody();
      sections.push({ type: 'heading', content: line.slice(3).trim() });
      i++;
      continue;
    }

    // H3 subheading
    if (line.startsWith('### ')) {
      flushBody();
      sections.push({ type: 'subheading', content: line.slice(4).trim() });
      i++;
      continue;
    }

    // Blockquote → quote
    if (line.startsWith('> ')) {
      flushBody();
      const quoteLines = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      sections.push({ type: 'quote', content: quoteLines.join(' ').replace(/\*/g, '') });
      continue;
    }

    // Code block
    if (line.startsWith('```')) {
      flushBody();
      const codeLines = [];
      i++; // skip opening ```
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      sections.push({ type: 'code', content: codeLines.join('\n') });
      continue;
    }

    // Unordered list
    if (/^[-*] /.test(line) || /^\d+\. /.test(line)) {
      flushBody();
      const items = [];
      while (i < lines.length && (/^[-*] /.test(lines[i]) || /^\d+\. /.test(lines[i]))) {
        const item = lines[i].replace(/^[-*] /, '').replace(/^\d+\. /, '').trim();
        items.push(item);
        i++;
      }
      sections.push({ type: 'list', items });
      continue;
    }

    // Table → skip (render as body note)
    if (line.startsWith('|')) {
      flushBody();
      const tableLines = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      // Convert table to a list of key: value pairs
      const headerLine = tableLines[0];
      const headers = headerLine.split('|').map(h => h.trim()).filter(Boolean);
      const dataRows = tableLines.slice(2); // skip header and separator
      const items = dataRows.map(row => {
        const cells = row.split('|').map(c => c.trim()).filter(Boolean);
        return cells.map((c, idx) => `**${headers[idx] ?? ''}:** ${c}`).join(' — ');
      }).filter(Boolean);
      if (items.length > 0) {
        sections.push({ type: 'list', items });
      }
      continue;
    }

    // Empty line — flush body paragraph
    if (line.trim() === '') {
      flushBody();
      i++;
      continue;
    }

    // Regular body text
    currentBodyLines.push(line);
    i++;
  }

  flushBody();
  return sections;
}
