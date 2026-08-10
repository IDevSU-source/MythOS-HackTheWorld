# TPS: Hack The World — Mobile App Design

## App Concept

A gamified knowledge explorer for the "Trillions Per Second" (TPS) framework — a hacker-metaphor guide to consciousness, meditation, and the nature of reality. The app presents Buddhist/Dharma teachings reframed as a hacker's operating system manual. Users progress through chapters, earn XP, unlock checkpoints, and explore an interactive lexicon.

---

## Color Palette

The app uses a **dark terminal/cyberpunk aesthetic** — evoking a hacker's terminal with neon accents on deep dark backgrounds.

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `background` | `#0A0E1A` | `#0A0E1A` | Deep navy-black terminal background |
| `surface` | `#111827` | `#111827` | Card/panel surfaces |
| `primary` | `#00FF88` | `#00FF88` | Neon green — the "signal" / active state |
| `secondary` | `#00D4FF` | `#00D4FF` | Cyan — info / links |
| `accent` | `#FF6B35` | `#FF6B35` | Orange — warnings / checkpoints |
| `foreground` | `#E2E8F0` | `#E2E8F0` | Primary text |
| `muted` | `#64748B` | `#64748B` | Secondary text |
| `border` | `#1E293B` | `#1E293B` | Subtle borders |
| `success` | `#00FF88` | `#00FF88` | Completed states |
| `warning` | `#FBBF24` | `#FBBF24` | Warning states |
| `error` | `#F87171` | `#F87171` | Error states |

The app is **always dark** — no light mode — to reinforce the terminal aesthetic.

---

## Screen List

1. **Boot Screen** (Splash/Onboarding) — Animated terminal boot sequence
2. **Home / Dashboard** — System status, XP bar, quick access to all sections
3. **Chapter Map** — Visual roadmap of all 4 parts and 6 checkpoints
4. **Chapter Reader** — Full chapter content with progress tracking
5. **Checkpoint Screen** — Gamified milestone unlock with quiz/reflection
6. **Lexicon** — Searchable glossary of all TPS terms vs. legacy code
7. **Devlogs** — The 4 developer logs with immersive reading experience
8. **Infographics Gallery** — All visual assets from the repo
9. **Profile / Stats** — User XP, unlocked chapters, badges earned
10. **Settings** — Theme, text size, reset progress

---

## Primary Content and Functionality

### Boot Screen
- Animated terminal text: `SYSTEM_BOOT_SEQUENCE...`, `KERNEL_VERSION: TPS_v1.0`, `ROOT_ACCESS_GRANTED`
- Tap to continue into the app
- Only shown on first launch

### Home / Dashboard
- Header: `> SYSTEM STATUS: ONLINE` with blinking cursor
- XP Progress bar with level name (e.g., "White Hat Initiate")
- Quick-access cards: DIAGNOSTIC, CODE, PATCH, CODEX
- "Daily Signal" — a random TPS concept card
- Recent activity feed

### Chapter Map
- Scrollable vertical roadmap with nodes for each chapter
- Locked/unlocked/completed states per chapter
- 6 checkpoint nodes styled as "SAVE POINTS" with special visual treatment
- Progress percentage overlay

### Chapter Reader
- Full markdown content rendered with terminal-style typography
- Monospace font for code blocks, clean serif for body text
- Bottom progress bar
- "Mark Complete" button to earn XP
- Share button for key quotes

### Checkpoint Screen
- Dramatic unlock animation when reaching a checkpoint
- Summary of what was learned
- Reflection prompt (open-ended, no wrong answers)
- XP reward display with haptic feedback
- Badge unlock if applicable

### Lexicon
- Searchable list of all TPS terms
- Each entry shows: TPS Term | Legacy Code (Pali) | System Definition
- Filter by category (Physics Engine, Render Engine, Virus, etc.)
- Tap for full detail card

### Devlogs
- List of 4 devlogs with metadata (date, mood, status)
- Full immersive reader with pull-quote highlights
- "Signal strength" indicator (reading progress)

### Infographics Gallery
- Grid of all 18+ infographic images from the repo
- Tap to fullscreen with pinch-to-zoom
- Caption and chapter reference

### Profile / Stats
- Username (default: "User_[random]")
- Current level and XP
- Chapters completed / total
- Badges earned
- "System Version" (v1.0 = Stream Entry, etc.)

---

## Key User Flows

### First Launch Flow
Boot Screen → Onboarding (3 slides explaining TPS concept) → Home Dashboard

### Chapter Reading Flow
Home → Chapter Map → Select Chapter → Chapter Reader → Complete → XP Award → (if checkpoint) Checkpoint Screen

### Lexicon Lookup Flow
Home → Lexicon → Search term → Detail card → Related chapter link

### Checkpoint Unlock Flow
Complete prerequisite chapters → Chapter Map shows checkpoint glowing → Tap → Checkpoint Screen → Reflection → Badge + XP

---

## Gamification System

| Element | Description |
|---------|-------------|
| XP Points | Earned by reading chapters (50 XP), completing checkpoints (200 XP), reading devlogs (25 XP) |
| Levels | White Hat Initiate → Debugger → Signal Locked → Overclocked → Zero Lag → Root Access |
| Badges | "Stream Analyst", "Virus Hunter", "Overclocker", "Zero Lag", "Root Access" |
| Streaks | Daily reading streak counter |
| Progress | Per-chapter completion tracking stored in AsyncStorage |

---

## Typography

- **Headers**: `SpaceMono` or system monospace — terminal feel
- **Body**: System default sans-serif for readability
- **Code blocks**: Monospace with syntax-highlight-style coloring
- **Accent text**: Neon green `#00FF88` for key terms

---

## Navigation Structure

```
Tab Bar (bottom):
  [>_] Terminal    → Home Dashboard
  [◉]  Map         → Chapter Map  
  [≡]  Lexicon     → Lexicon Screen
  [◈]  Logs        → Devlogs
  [☉]  Profile     → Profile/Stats
```
