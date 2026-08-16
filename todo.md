# TPS: Hack The World — Project TODO

## Setup & Branding
- [x] Generate custom app logo (terminal/hacker aesthetic)
- [x] Update theme colors to dark terminal palette
- [x] Update app.config.ts with branding
- [x] Configure tab navigation with 5 tabs

## Data Layer
- [x] Create TPS content data file (chapters, lexicon, devlogs)
- [x] Create AsyncStorage progress store (XP, completed chapters, badges)
- [x] Create gamification logic (XP calculation, level system, badges)

## Screens
- [x] Boot/Splash onboarding screen (terminal animation)
- [x] Home Dashboard screen (system status, XP bar, quick access)
- [x] Chapter Map screen (visual roadmap with locked/unlocked states)
- [x] Chapter Reader screen (markdown content, progress bar, complete button)
- [x] Checkpoint screen (milestone unlock, reflection, XP reward)
- [x] Lexicon screen (searchable glossary with filter)
- [x] Devlogs screen (list + immersive reader)
- [x] Infographic placeholder screen
- [x] Profile/Stats screen (XP, level, badges, progress)

## Gamification
- [x] XP system with level names (8 levels)
- [x] Chapter completion tracking (sequential unlock)
- [x] Checkpoint unlock animations
- [x] Badge system (8 badges)
- [x] Daily reading streak

## Polish
- [x] Terminal-style animations on key screens (blinking cursor, boot sequence)
- [x] Haptic feedback on XP earn and checkpoint unlock
- [x] XP popup animation on chapter completion
- [x] Monospace font throughout for terminal aesthetic
- [x] Part color coding (cyan/green/yellow/orange)

## Future Enhancements
- [ ] Add quiz/knowledge check after each chapter
- [x] Add visual infographic content (currently placeholder)
- [ ] Add search across all chapters
- [ ] Add "Daily Challenge" feature

## Termux Build Bootstrap
- [ ] Confirm a viable Termux-compatible Android build path for the restored MythOS source
- [ ] Add a paste-once Termux bootstrap script with safe local keystore handling
- [ ] Publish and validate the script in the public MythOS source repository

## Release-Candidate Content & Progression Overhaul
- [x] Audit every app content record against the current upstream HackTheWorldTPS repository
- [x] Import complete, untruncated upstream chapter content and all missing modules
- [x] Add Personal Codex chapters, API integration material, and the Silicon Sutra white paper
- [x] Reconcile all 39 upstream devlogs and replace hardcoded UI totals
- [x] Reconcile the lexicon with the full upstream source and correct the entry total
- [x] Import and bundle all available upstream infographic assets
- [x] Correct onboarding so Root Access is not granted during first boot
- [x] Redesign XP thresholds and completion gating so Root Access requires complete reading progress
- [x] Add content-integrity tests for counts, non-truncation, progression, and all release content
- [x] Validate the full release candidate and prepare Google Play launch guidance
- [x] Fix Metro infographic asset resolution error discovered during checkpoint validation
