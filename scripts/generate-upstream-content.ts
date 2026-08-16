import fs from "node:fs";
import path from "node:path";

type Group = "core" | "codex" | "reference" | "research";

interface ModuleSpec {
  directory: string;
  part: number;
  group: Group;
  requiredForRootAccess: boolean;
  include?: (file: string) => boolean;
}

const upstreamRoot = "/home/ubuntu/upstream-tps";
const outputPath = "/home/ubuntu/tps-app/lib/tps-data.ts";

const moduleSpecs: ModuleSpec[] = [
  { directory: "src/00_introduction", part: 0, group: "core", requiredForRootAccess: true },
  { directory: "src/01_diagnostic", part: 1, group: "core", requiredForRootAccess: true },
  { directory: "src/02_code", part: 2, group: "core", requiredForRootAccess: true },
  { directory: "src/03_patch", part: 3, group: "core", requiredForRootAccess: true },
  { directory: "src/04_personal_codex", part: 4, group: "codex", requiredForRootAccess: true },
  {
    directory: "src/05_back_matter",
    part: 5,
    group: "reference",
    requiredForRootAccess: true,
    include: (file) => !file.endsWith("02_01_lexicon.md"),
  },
  {
    directory: "src/alignment",
    part: 6,
    group: "research",
    requiredForRootAccess: true,
    include: (file) => file.endsWith("TPS_SiliconSutraWhitePaper_v1.md"),
  },
];

function markdownFiles(directory: string): string[] {
  const absolute = path.join(upstreamRoot, directory);
  if (!fs.existsSync(absolute)) return [];
  return fs
    .readdirSync(absolute, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(absolute, entry.name))
    .sort();
}

function cleanMarkdown(value: string): string {
  return value
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/\*\*/g, "")
    .replace(/[_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleFromMarkdown(markdown: string, fallback: string): string {
  const headings = markdown.match(/^#{1,3}\s+(.+)$/gm) ?? [];
  const firstHeading = headings
    .map((heading) => heading.replace(/^#{1,3}\s+/, "").trim())
    .find((heading) => heading.length > 2);
  return cleanMarkdown(firstHeading || fallback);
}

function taglineFromMarkdown(markdown: string): string | undefined {
  const paragraph = markdown
    .split(/\n\s*\n/)
    .map((block) => cleanMarkdown(block))
    .find((block) => block.length > 40 && block.length < 220 && !block.startsWith("#") && !block.startsWith("!["));
  return paragraph;
}

function sourceId(relativePath: string): string {
  return relativePath
    .replace(/\.md$/i, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function referencedImages(markdown: string): string[] {
  const matches = [...markdown.matchAll(/\]\(\/assets\/(?:infographics|images)\/([^\s)]+)\)/g)];
  return [...new Set(matches.map((match) => match[1]))];
}

function allDevlogFiles(): string[] {
  const logDirectory = path.join(upstreamRoot, "log");
  return fs
    .readdirSync(logDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(logDirectory, entry.name))
    .sort();
}

function parseLexicon() {
  const lexiconPath = path.join(upstreamRoot, "src/05_back_matter/02_01_lexicon.md");
  const lines = fs.readFileSync(lexiconPath, "utf8").split(/\r?\n/);
  let category = "Master Lexicon";
  const entries: Array<{
    id: string;
    tpsTerm: string;
    legacyCode: string;
    paliTerm: string;
    definition: string;
    category: string;
  }> = [];

  for (const line of lines) {
    const categoryMatch = line.match(/^##\s+(.+)$/);
    if (categoryMatch) {
      category = cleanMarkdown(categoryMatch[1]);
      continue;
    }

    if (!line.startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((cell) => cleanMarkdown(cell));
    if (cells.length < 3 || cells[0] === "TPS Terminology" || /^:?-{3,}/.test(cells[0])) continue;
    if (!cells[0] || !cells[1] || !cells[2]) continue;

    const id = `${sourceId(cells[0])}_${entries.length + 1}`;
    entries.push({
      id,
      tpsTerm: cells[0],
      legacyCode: cells[1],
      paliTerm: cells[1],
      definition: cells.slice(2).join(" | "),
      category,
    });
  }

  return entries;
}

const sourcedChapters = moduleSpecs.flatMap((spec) =>
  markdownFiles(spec.directory)
    .filter((file) => spec.include?.(file) ?? true)
    .map((file, index) => {
      const content = fs.readFileSync(file, "utf8");
      const relativePath = path.relative(upstreamRoot, file).replace(/\\/g, "/");
      const isCore = spec.group === "core";
      return {
        id: sourceId(relativePath),
        part: spec.part,
        group: spec.group,
        order: index + 1,
        title: titleFromMarkdown(content, path.basename(file, ".md")),
        tagline: taglineFromMarkdown(content),
        sourcePath: relativePath,
        content,
        infographics: referencedImages(content),
        xpReward: isCore ? 100 : spec.group === "codex" ? 125 : 90,
        requiredForRootAccess: spec.requiredForRootAccess,
      };
    }),
);

const editorialIntegrationIndex = {
  id: 'app_editorial_integration_index',
  part: 6,
  group: 'research' as const,
  order: 2,
  title: 'Integration Index: Comparative API Lenses',
  tagline: 'An editorial navigation layer for reading related traditions without collapsing their differences.',
  sourcePath: 'app/editorial/integration-index.md',
  content: `# Integration Index: Comparative API Lenses

## Scope and care

This is an editorial navigation aid for MythOS. It does **not** claim that the traditions below are interchangeable, nor does it replace their own primary texts, communities, or teachers. Its purpose is to make visible the comparative lenses already present across the upstream source archive and to help a reader locate them responsibly.

## Gnosticism

Use this lens when reading upstream passages about the constructed world, mistaken identification, hidden knowledge, or recovery from a false interface. The useful question is not “Are these systems the same?” but “How does each tradition diagnose the experience of being trapped by a misleading model of reality?”

## Hermeticism

Use this lens when the source explores correspondence, layered reality, symbolic translation, or the relationship between microcosm and macrocosm. Keep the comparison descriptive: terminology can overlap while metaphysical commitments remain distinct.

## Stoicism

Use this lens for the source’s read-only data, response selection, and write-access metaphors. The comparison can clarify a shared practical question: what is directly under the operator’s control, and what is presented as an input to be met without adding reactive overhead?

## Zen

Use this lens around direct observation, non-conceptual contact, and the limits of turning insight into another object of grasping. Treat the technical language as an interface metaphor rather than a replacement for Zen practice or lineage.

## Jungian / archetypal psychology

The current upstream repository contains archetypal language rather than a dedicated Jungian chapter. This lens is included to help readers locate those references in the Staging Environment and server-side architecture material: recurring images, roles, and narratives can be read as reusable “global asset libraries.” This is an interpretive bridge, not a claim of doctrinal equivalence.

## Where to continue in the source

- **Source core:** src/02_code/ch05_02_staging_environment.md
- **Source reference:** src/05_back_matter/02_03_server_side_architecture.md
- **Upstream field notes:** log/tps_devlog_004_TheSiliconSutra.md, log/tps_devlog_007_TPSOnIntegralPhilosophy.md, and log/tps_devlog_016_AgentsOfChaos.md

> Comparative reading works best when it increases precision, humility, and curiosity—not when it erases differences between traditions.`,
  infographics: [],
  xpReward: 50,
  requiredForRootAccess: false,
};

const chapters = [...sourcedChapters, editorialIntegrationIndex];

const devlogs = allDevlogFiles().map((file, index) => {
  const content = fs.readFileSync(file, "utf8");
  const relativePath = path.relative(upstreamRoot, file).replace(/\\/g, "/");
  return {
    id: sourceId(relativePath),
    title: titleFromMarkdown(content, path.basename(file, ".md")),
    content,
    sourcePath: relativePath,
    date: undefined,
    xpReward: 50,
    order: index + 1,
    infographics: referencedImages(content),
    requiredForRootAccess: true,
  };
});

const lexicon = parseLexicon();
const rootAccessXp = chapters.filter((chapter) => chapter.requiredForRootAccess).reduce((total, chapter) => total + chapter.xpReward, 0)
  + devlogs.reduce((total, devlog) => total + devlog.xpReward, 0);
const rootRequiredModules = chapters.filter((chapter) => chapter.requiredForRootAccess).map((chapter) => chapter.id);
const rootRequiredDevlogs = devlogs.filter((devlog) => devlog.requiredForRootAccess).map((devlog) => devlog.id);

const generated = `// This file is generated from c4chaos-io/trillions-per-second. Do not hand-edit.\n// Source commit: 77dae99 | Generated: ${new Date().toISOString()}\n\nexport type ContentGroup = "core" | "codex" | "reference" | "research";\n\nexport interface Chapter {\n  id: string;\n  part: number;\n  group: ContentGroup;\n  order: number;\n  title: string;\n  tagline?: string;\n  sourcePath: string;\n  content: string;\n  infographics: string[];\n  xpReward: number;\n  requiredForRootAccess: boolean;\n}\n\nexport interface Devlog {\n  id: string;\n  title: string;\n  content: string;\n  sourcePath: string;\n  date?: string;\n  xpReward: number;\n  order: number;\n  infographics: string[];\n  requiredForRootAccess: boolean;\n}\n\nexport interface LexiconEntry {\n  id: string;\n  tpsTerm: string;\n  legacyCode: string;\n  paliTerm: string;\n  definition: string;\n  category: string;\n}\n\nexport interface Badge {\n  id: string;\n  name: string;\n  description: string;\n  icon: string;\n}\n\nexport interface Level {\n  level: number;\n  name: string;\n  minXp: number;\n  maxXp: number;\n}\n\nexport const PARTS = [\n  { id: 0, title: "Introduction", subtitle: "Boot the Protocol", icon: "⚡", group: "core" },\n  { id: 1, title: "Diagnostic", subtitle: "Inspect the System", icon: "🔍", group: "core" },\n  { id: 2, title: "Code", subtitle: "Apply the Patch", icon: "🛠️", group: "core" },\n  { id: 3, title: "Patch", subtitle: "Integrate the Protocol", icon: "🔑", group: "core" },\n  { id: 4, title: "Personal Codex", subtitle: "Field Notes & Detours", icon: "📓", group: "codex" },\n  { id: 5, title: "Reference Library", subtitle: "Back Matter & Architecture", icon: "📚", group: "reference" },\n  { id: 6, title: "Research Library", subtitle: "Silicon Sutra White Paper", icon: "🧠", group: "research" },\n] as const;\n\nexport const CHAPTERS: Chapter[] = ${JSON.stringify(chapters, null, 2)};\n\nexport const DEVLOGS: Devlog[] = ${JSON.stringify(devlogs, null, 2)};\n\nexport const LEXICON: LexiconEntry[] = ${JSON.stringify(lexicon, null, 2)};\n\nexport const BADGES: Badge[] = [\n  { id: "core", name: "Core Protocol", description: "Completed the original four-part protocol.", icon: "⚡" },\n  { id: "codex", name: "Codex Keeper", description: "Read the complete Personal Codex.", icon: "📓" },\n  { id: "reference", name: "Systems Librarian", description: "Read the reference library.", icon: "📚" },\n  { id: "research", name: "Researcher", description: "Read the Silicon Sutra research paper.", icon: "🧠" },\n  { id: "devlogs", name: "Signal Archivist", description: "Read every upstream devlog.", icon: "📡" },\n  { id: "lexicon", name: "Lexicon Mapper", description: "Explore 50 lexicon entries.", icon: "🗺️" },\n  { id: "streak", name: "Steady Operator", description: "Maintain a 7-day study streak.", icon: "🔥" },\n  { id: "root", name: "Root Access", description: "Complete every required module and devlog.", icon: "🔓" },\n];\n\nexport const ROOT_ACCESS_XP = ${rootAccessXp};\nexport const ROOT_REQUIRED_MODULE_IDS = ${JSON.stringify(rootRequiredModules, null, 2)} as const;\nexport const ROOT_REQUIRED_DEVLOG_IDS = ${JSON.stringify(rootRequiredDevlogs, null, 2)} as const;\n\nexport const LEVELS: Level[] = [\n  { level: 1, name: "Booting Up", minXp: 0, maxXp: 500 },\n  { level: 2, name: "Kernel Loading", minXp: 500, maxXp: 1400 },\n  { level: 3, name: "Packet Sniffer", minXp: 1400, maxXp: 2500 },\n  { level: 4, name: "System Debugger", minXp: 2500, maxXp: 3800 },\n  { level: 5, name: "Protocol Admin", minXp: 3800, maxXp: 5200 },\n  { level: 6, name: "Systems Architect", minXp: 5200, maxXp: 6800 },\n  { level: 7, name: "Zero Lag", minXp: 6800, maxXp: ROOT_ACCESS_XP },\n  { level: 8, name: "Root Access", minXp: ROOT_ACCESS_XP, maxXp: ROOT_ACCESS_XP },\n];\n\nexport function getLevelForXP(xp: number): Level {\n  return [...LEVELS].reverse().find((level) => xp >= level.minXp) ?? LEVELS[0];\n}\n\nexport function getChaptersForPart(part: number): Chapter[] {\n  return CHAPTERS.filter((chapter) => chapter.part === part).sort((a, b) => a.order - b.order);\n}\n`;

fs.writeFileSync(outputPath, generated);

console.log(JSON.stringify({
  chapters: chapters.length,
  coreChapters: chapters.filter((chapter) => chapter.group === "core").length,
  codexChapters: chapters.filter((chapter) => chapter.group === "codex").length,
  referenceModules: chapters.filter((chapter) => chapter.group === "reference").length,
  researchModules: chapters.filter((chapter) => chapter.group === "research").length,
  devlogs: devlogs.length,
  lexiconEntries: lexicon.length,
  rootAccessXp,
  outputPath,
}, null, 2));
