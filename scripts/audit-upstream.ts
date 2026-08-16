import fs from "node:fs";
import path from "node:path";

import { CHAPTERS, DEVLOGS, LEXICON } from "../lib/tps-data";

const upstreamRoot = "/home/ubuntu/upstream-tps";
const outputPath = "/home/ubuntu/tps-app/reports/upstream-content-audit.json";

function listFiles(root: string, extension: string): string[] {
  if (!fs.existsSync(root)) return [];
  const files: string[] = [];
  const walk = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      if (entry.isFile() && fullPath.toLowerCase().endsWith(extension)) files.push(fullPath);
    }
  };
  walk(root);
  return files.sort();
}

function markdownTitle(content: string, fallback: string): string {
  const match = content.match(/^#{1,3}\s+(.+)$/m);
  return match?.[1]?.replace(/[*_`]/g, "").trim() || fallback;
}

const chapterDirectories = [
  "src/00_introduction",
  "src/01_diagnostic",
  "src/02_code",
  "src/03_patch",
  "src/04_personal_codex",
  "src/alignment",
];

const upstreamChapterFiles = chapterDirectories.flatMap((directory) =>
  listFiles(path.join(upstreamRoot, directory), ".md"),
);
const upstreamDevlogFiles = listFiles(path.join(upstreamRoot, "log"), ".md");
const infographicFiles = listFiles(path.join(upstreamRoot, "assets/infographics"), ".jpg");
const sourceLexiconPath = path.join(upstreamRoot, "src/05_back_matter/02_01_lexicon.md");
const sourceLexicon = fs.existsSync(sourceLexiconPath) ? fs.readFileSync(sourceLexiconPath, "utf8") : "";

const upstreamChapters = upstreamChapterFiles.map((file) => {
  const content = fs.readFileSync(file, "utf8");
  return {
    file: path.relative(upstreamRoot, file),
    title: markdownTitle(content, path.basename(file, ".md")),
    characters: content.length,
  };
});

const truncatedAppChapters = CHAPTERS.filter((chapter) => chapter.content.length < 1500).map((chapter) => ({
  id: chapter.id,
  title: chapter.title,
  characters: chapter.content.length,
}));

const audit = {
  generatedAt: new Date().toISOString(),
  upstreamCommit: fs.existsSync(path.join(upstreamRoot, ".git")) ? "77dae99" : "unknown",
  app: {
    chapters: CHAPTERS.length,
    devlogs: DEVLOGS.length,
    lexiconEntries: LEXICON.length,
    chapterCharacters: CHAPTERS.reduce((total, chapter) => total + chapter.content.length, 0),
    shortChaptersUnder1500Characters: truncatedAppChapters,
  },
  upstream: {
    chapterFiles: upstreamChapters.length,
    chapterCharacters: upstreamChapters.reduce((total, chapter) => total + chapter.characters, 0),
    chapters: upstreamChapters,
    devlogs: upstreamDevlogFiles.length,
    infographics: infographicFiles.length,
    lexiconHeadings: (sourceLexicon.match(/^##\s+/gm) || []).length,
  },
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(audit, null, 2)}\n`);

console.log(JSON.stringify({
  app: {
    chapters: audit.app.chapters,
    devlogs: audit.app.devlogs,
    lexiconEntries: audit.app.lexiconEntries,
    truncatedChapterCount: audit.app.shortChaptersUnder1500Characters.length,
  },
  upstream: {
    chapterFiles: audit.upstream.chapterFiles,
    devlogs: audit.upstream.devlogs,
    infographics: audit.upstream.infographics,
    lexiconHeadings: audit.upstream.lexiconHeadings,
  },
  report: outputPath,
}, null, 2));
