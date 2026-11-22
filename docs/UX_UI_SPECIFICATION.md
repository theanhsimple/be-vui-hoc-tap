# little — UX / UI Specification

> **Status:** Tokens and core components implemented in Sprint 01 (`src/styles/tokens.css`, `src/components/`). Live gallery: `/dev/design-system`. Mascot art and audio files are still placeholders.

## 1. Design principles

1. **Hear it, see it, tap it.** Every child-facing instruction is spoken and shown as a picture. Text on kid screens is decoration for parents, never required.
2. **One thing at a time.** One question, one main action per screen. No menus in kid mode.
3. **Never shame.** Wrong answers get warmth and a hint; no red crosses, buzzers, timers, or lost lives.
4. **Big, soft, tactile.** Chunky 3D-looking objects that squash when pressed; generous spacing.
5. **Calm by default.** Ambient motion is slow; celebrations are short (≤ 2 s) and skippable.
6. **Parents are in charge.** Every exit from kid mode is behind the parent gate.

## 2. Visual direction — "Premium 3D Playful"

- **Look:** soft clay/vinyl-toy 3D objects, rounded everything, gentle ambient lighting from top-left, soft contact shadows, pastel world with a few saturated accent colours for interactive objects.
- **World:** "Little Explorer World" — floating islands over a pastel sky; each module is an island (Number Garden, Shape Bay, Pattern Forest, Sound Cave, Weather Hill…). Working names, to be finalised with content.
- **Mascots:** a small cast of friendly characters (e.g. the guide plus one per island). The prototype's sun mascot *Bạn Nắng* is the reference character to redesign in 3D. Mascots have expressive idle, talk, cheer, think, and encourage states.
- **3D assets:** pre-rendered (Blender or similar) to transparent WebP/AVIF at 1x/2x, plus short loops (Lottie or WebM/HEVC with alpha) for mascot states. **No realtime 3D in v1.** Assets are not produced in Sprint 00.

## 3. Foundations (tokens)

### 3.1 Colour — soft pastel palette

| Token | Light value | Use |
|-------|-------------|-----|
| `--sky-100` | `#EAF6FF` | page background top |
| `--sky-200` | `#D3ECFF` | page background bottom |
| `--cream-50` | `#FFFBF4` | cards, bubbles |
| `--ink-900` | `#1E2A55` | primary text (parent/admin), icons |
| `--ink-600` | `#56608A` | secondary text |
| `--peach-300` | `#FFC9A8` | warm surfaces |
| `--mint-300` | `#A8E6CF` | success / "correct" glow |
| `--lilac-300` | `#CDBDFF` | module accent |
| `--butter-300` | `#FFE38A` | stars, rewards |
| `--rose-300` | `#FFB3C7` | module accent |
| `--sky-400` | `#7CC4FF` | primary action surface |
| `--sky-600` | `#2F8EE0` | primary action edge / pressed |
| `--coral-400` | `#FF8A7A` | attention (used sparingly, never for "wrong") |

Implemented additional 3D pairs (top `-400` / edge `-600`): butter `#FFD45C/#E0A91F`, mint `#6FD6A8/#35A97A`, lilac `#A992FF/#7A5FE0`, rose `#FF8FAE/#E0567E`, peach `#FFAE80/#E57F4A`, and `cream-edge #D9CDB8`.

Rules: interactive objects use the saturated `-400/-600` pairs (top face / extruded edge) to read as tappable 3D. Text contrast on parent/admin screens meets WCAG AA (≥ 4.5:1). Dark mode: parent/admin only (P1); kid mode is a single "daylight" theme with an optional "night world" skin later.

### 3.2 Typography — Nunito Sans

Loaded with `next/font/google`, subsets `latin` + `vietnamese`, weights 400/600/800 (variable).

| Role | Size (iPad) | Weight | Line height |
|------|-------------|--------|-------------|
| Kid display (decorative) | 40–56 px | 800 | 1.1 |
| Kid label (numerals, single words) | 32 px | 800 | 1.1 |
| Parent H1 | 32 px | 800 | 1.2 |
| Parent H2 | 24 px | 700 | 1.25 |
| Body | 17 px | 400 | 1.5 |
| Caption | 14 px | 600 | 1.4 |

Vietnamese diacritics need extra line height; never set `line-height < 1.1` on Vietnamese text.

### 3.3 Shape, depth, light

| Token | Value |
|-------|-------|
| Radius | `--r-sm 12px`, `--r-md 20px`, `--r-lg 28px`, `--r-xl 40px`, pills `999px` |
| 3D button edge | `box-shadow: 0 6px 0 var(--edge)`; pressed → translateY(4px), edge 2px |
| Soft shadow | `0 12px 32px -8px rgb(30 42 85 / .18)` |
| Ambient glow | radial highlight top-left on cards (`inset 0 2px 0 rgb(255 255 255 / .6)`) |
| Spacing scale | 4, 8, 12, 16, 24, 32, 48, 64 px |

### 3.4 Touch targets

- Kid mode: **minimum 64×64 px**, answer choices typically 140–220 px; ≥ 16 px gap between targets.
- Parent/admin: minimum 44×44 px.
- Exception: the parent-gate entry button inside kid mode is an adult control (52 px, corner placement) — see DECISIONS D-016.
- No hover-dependent behaviour anywhere; no double-tap; long-press only for parent gate.

### 3.5 Motion

| Name | Spec | Use |
|------|------|-----|
| `press` | spring, stiffness 500, damping 30 | buttons/choices squash |
| `enter` | 280 ms, ease-out, y 16 → 0, fade | screen content |
| `bob` | 3 s loop, ±4 px | mascot idle |
| `celebrate` | ≤ 2 s, confetti + mascot cheer | correct answer / lesson end |
| `nudge` | 400 ms gentle wobble | wrong answer (on the chosen item, not the screen) |

`prefers-reduced-motion`: replace movement with opacity changes; no confetti.

### 3.6 Sound

- Every kid screen has an **audio prompt** that auto-plays once (after the audio unlock tap) and a always-visible **replay** button (speaker icon, top-left of the prompt bubble).
- SFX set: tap, correct, gentle-try-again, reward, page transition. Volume ducked under voice.
- Background music: off by default; parent setting.

## 4. Layout

- **iPad-first**, landscape primary (1180×820 / 1366×1024), portrait supported.
- Kid screens: 3 zones — **guide row** (mascot + speech bubble + replay), **stage** (the activity), **action row** (large answers or "next"). Safe-area insets respected.
- Desktop: kid stage centred with max width 1200 px and scenery filling the sides.
- Parent: responsive dashboard; 12-col grid ≥ 1024 px, single column < 768 px.
- Admin: desktop-first dense layout (sidebar + table/editor), usable ≥ 1280 px.

## 5. Screen specifications

### 5.1 Student

| Screen | Key elements | Behaviour |
|--------|--------------|-----------|
| Welcome | Sky scene, mascot waves, one giant "Chơi nào!" 3D button | First tap unlocks audio and plays greeting |
| Profile selection | Grid of child avatars (3D character portraits), each speaks the child's nickname on tap | Second tap enters; small parent-gate button in corner |
| Home | Mascot greeting by time of day; "Continue" hero card; "Explore world" card; sticker book card | Suggested next lesson chosen by learning engine |
| Explore World | Horizontally pannable island map; islands locked (misty) / unlocked / completed (flag) | Tap island → spoken name + zoom transition |
| Module detail | Path of stepping stones (lessons); stars under each | Tap stone → start session |
| Learning session | Progress as footprints/stones along top; guide row; stage; answers | Auto-play prompt; 2 tries then demonstrate; next auto-advances after feedback |
| Question types | tap-choice, listen-and-choose, count-and-tap, drag-to-match, sort/order, odd-one-out | Each renderer has idle, selected, correct, try-again, demonstrate states |
| Rewards | Stars count up, sticker reveal, badge when earned, "Back home" | Sticker goes into sticker book |

### 5.2 Parent

Clean, calm, trustworthy: same palette at lower saturation, fewer illustrations, more whitespace. Screens: auth, onboarding wizard (family → consent → first child → handoff to assessment), children list, child overview (progress), skills (mastery bands with plain-language descriptions and home activity ideas), assessment flow (parent instructions screen → kid-mode activity → parent summary), settings.

Language rules for parent copy: describe observations ("Bé đếm chắc chắn đến 10"), avoid grades, rankings, percentiles, or comparisons with other children; no school-admission claims.

### 5.3 Admin

Sidebar: Dashboard · Modules · Skills · Question Bank · Lessons · Assessments · Media · Staff. Every content entity shows status (Draft / In review / Published) and a **"Preview as child"** action rendering the real kid component in a device frame. Publishing is blocked if a question lacks audio or alt text.

## 6. Component inventory (Sprint 01 targets)

`Button3D`, `IconButton3D`, `Card`, `SpeechBubble`, `AudioPromptButton`, `Mascot` (state prop), `BigChoice`, `ProgressPath`, `StarBurst`, `ParentGate`, `KidShell` (zones + safe areas), `ParentShell`, `AdminShell`, form controls (`TextField`, `Select`, `Switch`) for parent/admin.

## 7. Accessibility checklist

- All kid images have Vietnamese alt text (used by screen readers and as caption source).
- Captions toggle for voiceover (parent setting).
- Focus-visible rings (4 px) on all controls; full keyboard path on parent/admin.
- No information conveyed by colour alone (correct = mint glow **and** check-mark + sound).
- Seizure-safe: no flashing > 3 times/second.
