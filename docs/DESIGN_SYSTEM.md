# little — Design System

> **Status:** Implemented in Sprint 02 (design system & visual foundation). Live showcase: `/design-system` (dev builds, or production with `ENABLE_DESIGN_SYSTEM=true` at build time).
> Source of truth for values: `src/styles/tokens.css` (CSS) mirrored by `src/design-system/tokens/` (TypeScript). `tokens.test.ts` keeps them in sync and checks contrast.
> Mascot, illustrations and audio are **placeholders**; see §12 and §15.

---

## 1. Design principles

1. **Hear it, see it, tap it.** Every child instruction is spoken and pictured. Text in the student experience is a caption for adults.
2. **One thing at a time.** One question, one primary action per screen.
3. **Never shame.** Try-again is soft coral and encouraging, never red, never "sai", never a buzzer. The answer is shown after the last try.
4. **Soft, tactile, calm.** Clay-like 3D objects with a short extruded edge; motion only in response to something the child did.
5. **Trustworthy for parents.** Spacious, plain-language, observations instead of scores.
6. **Accessible by construction.** Contrast is tested, focus is always visible, nothing depends on colour, hover or dragging alone.

## 2. Brand visual direction — Premium 3D Playful Learning

- **Look:** soft clay/vinyl-toy objects, rounded geometry, gentle top-left light, warm restrained shadows, pastel world on Warm Cream.
- **Student world:** sky-to-cream backdrop with static clouds and hills; content floats on rounded surfaces.
- **Parent & admin:** the same palette at lower intensity — more white surface, fewer illustrations, denser in admin.
- **Avoid:** kindergarten templates, rainbow saturation, heavy gradients, neumorphism, dense dashboards, emoji as primary art, constant background motion.

## 3. Color tokens

### 3.1 Brand palette (decorative fills)

| Token | Base | Tint (`-50`) | Edge (`-edge`) | Strong (`-strong`) | Role |
|---|---|---|---|---|---|
| `blue` | `#72A9EC` | `#EAF2FC` | `#5A92D8` | `#2B6AB8` | Primary Blue — main actions, navigation |
| `yellow` | `#FFD16A` | `#FFF4D6` | `#E8B44A` | `#93620F` | Sunshine Yellow — rewards, highlights |
| `coral` | `#FF927C` | `#FFEDE9` | `#E87862` | `#A84D3A` | Soft Coral — attention, encouragement |
| `mint` | `#8BD5B0` | `#E8F6EF` | `#6DBB94` | `#357552` | Mint Green — success, progress |
| `lavender` | `#B9A7EA` | `#F1EDFB` | `#9C88D6` | `#6B52C7` | Lavender — logic, creativity |

- **Base** = fills (buttons, tiles). Text on a base fill is always `ink`.
- **Tint** = light backgrounds (selection, feedback, badges).
- **Edge** = the extruded 3D edge under a filled control.
- **Strong** = functional colour for text, icons, links and focus (≥ 4.5:1 on canvas, surface and its own tint).

### 3.2 Semantic tokens

| Token | Value | Use |
|---|---|---|
| `canvas` | `#FFF8EC` | Warm Cream — main background |
| `surface` | `#FFFFFF` | Cards, panels |
| `surface-muted` | `#FAF6EE` | Secondary surfaces |
| `surface-edge` | `#E4DCCB` | 3D edge for white controls |
| `ink` | `#293447` | Text Primary (11.9:1 on canvas) |
| `ink-muted` | `#5F6A7D` | Text Secondary (5.2:1) — **adjusted** |
| `border` | `#E9E8E3` | Decorative dividers only |
| `border-strong` | `#868E9C` | Input/control boundaries (3.1:1) |
| `focus` | `#2B6AB8` | Focus ring |
| `success` / `-50` / `-strong` | `#64B98D` / `#E8F6EF` / `#357552` | Success |
| `warning` / `-50` / `-strong` | `#F1B85B` / `#FFF4D6` / `#93620F` | Warning, demo labels |
| `error` / `-50` / `-strong` | `#E77979` / `#FDEEEE` / `#B34848` | Parent/admin errors only — **never shown to children** |
| `disabled` / `disabled-ink` | `#F1EFEA` / `#868E9C` | Inactive controls |
| `sky-top` | `#DCEBFB` | Student backdrop (decorative) |

### 3.3 Accessibility adjustments to the brief's palette

| Adjustment | Why |
|---|---|
| Text Secondary `#748094` → `#5F6A7D` | Was 3.8:1 on cream; small text needs 4.5:1. |
| Added `-strong` variant per brand colour | Brand colours are 1.7–2.7:1 on cream — fine as fills, unusable as text, icons, links or focus rings. Strong variants were tuned to ≥ 4.5:1 **including on their own tint** (badges); the first pass for blue/coral/mint failed that check (4.3–4.5:1) and was darkened. |
| Added `border-strong` | Control boundaries need 3:1 (WCAG 1.4.11); Border `#E9E8E3` is 1.2:1 and stays decorative. |
| No white text on fills | White is 1.4–2.8:1 on every brand fill; Ink is 4.4–8.7:1. |
| Error messages use tint + strong text | Ink on the Error fill is 4.4:1; `error-strong` on `error-50` is 4.7:1. |
| Disabled text 3.0:1 | Intentional: inactive controls are exempt (WCAG 1.4.3); disabled state is also signalled by the `disabled` attribute and cursor. |

All pairs are listed in `CONTRAST_REQUIREMENTS` and verified in CI.

### 3.4 Decorative vs functional

| Decorative (no contrast duty) | Functional (contrast tested) |
|---|---|
| Brand base & tint fills, edges, sky, scenery, illustration colours | Text (`ink`, `ink-muted`, `*-strong`), icons, focus ring, control borders, status text |

Tailwind's default palette is removed (`--color-*: initial`), so only these tokens exist as classes (`bg-blue`, `text-coral-strong`, `bg-mint-50`…).

## 4. Typography tokens

Nunito Sans, self-hosted by `next/font/google` (latin + **vietnamese** subsets, `display: swap`). Weights limited to 500 / 600 / 700 / 800.

| Token | Class | Size | Weight | Line height |
|---|---|---|---|---|
| Display | `text-display` | 36 px (28 px on small screens) | 800 | 1.15 |
| H1 | `text-h1` | 30 px (24 px) | 800 | 1.2 |
| H2 | `text-h2` | 24 px (20 px) | 800 | 1.25 |
| H3 | `text-h3` | 20 px | 700 | 1.3 |
| Body Large | `text-body-lg` | 18 px | 600 | 1.5 |
| Body | `text-body` | 16 px | 500 | 1.5 |
| Body Small | `text-body-sm` | 14 px | 500 | 1.45 |
| Caption | `text-caption` | 12 px | 600 | 1.4 |

Rules: headings use `text-wrap: balance`, paragraphs `pretty`; never set line-height below 1.15 on Vietnamese; captions never carry information a child needs. Default Tailwind sizes are removed.

## 5. Spacing tokens

4 px base, using Tailwind's spacing scale (`n × 4px`): **4, 8, 12, 16, 24, 32, 40, 48, 64** → `1, 2, 3, 4, 6, 8, 10, 12, 16`. Page gutters: 16 px mobile (safe-area aware) → 24 px tablet → 32 px desktop (`LittleContainer`).

## 6. Radius and elevation

| Radius | Value | Use |
|---|---|---|
| `rounded-sm` | 12 px | Inputs, small controls, table cells |
| `rounded-md` | 16 px | Buttons (md/lg), list items |
| `rounded-lg` | 24 px | Cards, child buttons (xl), slots |
| `rounded-xl` | 32 px | Answer tiles, modals, question card |
| `rounded-pill` | 999 px | Badges, icon buttons, chips |

| Shadow | Use |
|---|---|
| `shadow-xs` | Border-like lift: chips, inputs, current nav item |
| `shadow-sm` | Cards, small controls |
| `shadow-md` | Floating panels, toasts, card hover |
| `shadow-lg` | Modals |
| `edge-3d` utility | Soft 3D: `--edge-depth` (2–4 px) edge in `--edge` colour + `shadow-sm`; `edge-3d-pressed` halves it |

## 7. Responsive rules

| Range | Name | Tailwind prefix |
|---|---|---|
| < 640 px | Mobile | (none) |
| 640–1023 px | Tablet | `tablet:` |
| ≥ 1024 px | Desktop | `desktop:` |
| ≥ 1440 px | Wide | `wide:` |

- **iPad landscape (1180×820) is the reference**; portrait (820×1180) must stay fully usable.
- Child targets: primary ≥ 64 px (`LittleButton size="xl"`), secondary ≥ 56 px; answer tiles scale with viewport (92–216 px); never below 64 px.
- Parent/admin targets ≥ 40–48 px; key actions ≥ 44 px.
- No hover-only behaviour (Tailwind v4 applies `hover:` only on hover-capable pointers). No double-tap; long-press only in the parent gate.
- Safe areas: `safe-px` utility, shells, bottom navigation and toasts use `env(safe-area-inset-*)`.
- Max widths: parent 1120 px, student 1200 px, showcase 1280 px.
- Admin: sidebar from 1024 px, stacked above content below; tables hide secondary columns below 1024 px and scroll horizontally.

## 8. Component inventory

Status: ✅ implemented & tested (unit and/or browser) · 🟡 implemented, partly tested · 📄 documented only.

| Group | Component | Path | Status |
|---|---|---|---|
| Foundation | LittleButton | `components/ui/LittleButton.tsx` | ✅ |
| | LittleIconButton | `ui/LittleIconButton.tsx` | ✅ |
| | LittleCard / LittleSelectableCard | `ui/LittleCard.tsx` | ✅ |
| | LittleContainer | `ui/LittleContainer.tsx` | 🟡 |
| | LittleBadge | `ui/LittleBadge.tsx` | 🟡 |
| | LittleProgress | `ui/LittleProgress.tsx` | ✅ |
| | LittleDivider | `ui/LittleDivider.tsx` | 🟡 |
| | LittleModal | `ui/LittleModal.tsx` | ✅ |
| | LittleTooltip | `ui/LittleTooltip.tsx` | 🟡 |
| | LittleToast + ToastProvider/useToast | `ui/LittleToast.tsx` | 🟡 |
| | LittleAvatar | `ui/LittleAvatar.tsx` | 🟡 |
| | LittleIllustration | `ui/LittleIllustration.tsx` | ✅ |
| | LittleInput / LittleSelect / LittleSwitch | `ui/LittleInput.tsx`, `ui/LittleSwitch.tsx` | ✅ |
| | LittleSpinner, LittleStatePanel, SpeechBubble | `ui/` | 🟡 |
| Navigation | StudentNavigation (+ ParentGate) | `components/navigation/` | ✅ |
| | ParentNavigation, BottomNavigation | `navigation/` | 🟡 |
| | SidebarNavigation, AdminNavigation, Breadcrumb | `navigation/` | 🟡 |
| Layout | StudentShell, ParentShell, AdminShell, Logo | `components/layout/` | 🟡 |
| Learning | LittleMascot (placeholder art) | `components/learning/` | ✅ |
| | AudioPlayer, AudioInstruction | `learning/` | 🟡 (no recorded audio yet) |
| | AnswerOption, ImageChoice, QuestionCard | `learning/` | ✅ |
| | FeedbackPanel, RewardPanel, LearningProgress | `learning/` | ✅ |
| | SequenceBuilder, PatternBuilder, MatchingGame, MemoryGame | `learning/` | ✅ |
| | DragDropContainer | — | 📄 (see §9.4) |
| Parent | ParentStatCard, ChildProfileCard, SkillProgressCard, LearningActivityCard, AssessmentSummaryCard | `components/parent/` | 🟡 |
| Admin | AdminDataTable, AdminFormField, AdminStatusBadge, AdminFilterBar, AdminPageHeader | `components/admin/` | 🟡 (AdminFormField ✅) |

"Partly tested" = rendered and inspected in the showcase at four viewports, without dedicated unit tests.

## 9. Interaction states

### 9.1 Buttons (LittleButton / LittleIconButton)

| State | Treatment |
|---|---|
| Default | Fill + extruded edge (`edge-3d`) |
| Hover | Slight brighten (pointer devices only) |
| Pressed | Moves down 2 px, edge shrinks, `buttonPress` scale 0.97 (120 ms) |
| Focus | 3 px `focus` outline, 3 px offset |
| Disabled | `disabled` bg + `disabled-ink`, no edge colour, `not-allowed` cursor |
| Loading | Spinner replaces leading icon, `aria-busy`, clicks ignored, focus kept, width stable |

### 9.2 Cards (LittleSelectableCard)

Default (surface + `shadow-sm`) · Hover (lift 2 px + `shadow-md`) · Selected (`blue-50` + 3 px `blue-strong` outline + `aria-pressed`) · Active (pressed) · Disabled.

### 9.3 Answers & feedback (student)

| State | AnswerOption | FeedbackPanel |
|---|---|---|
| Success | `mint-50` + mint outline + check badge + one soft grow (350 ms) | `success-50`, cheering mascot, "Đúng rồi!" |
| Try again | `coral-50` + coral outline + one gentle nudge on that tile only; **still selectable** | `coral-50`, encouraging mascot, lightbulb, "Gần đúng rồi! Thử lại nhé" |
| Reveal (after last try) | `yellow-50` + sparkle badge on the right answer; others dimmed | `yellow-50`, "Cùng xem nhé…" + Continue |
| Selected / Dimmed | blue outline / 50 % opacity, not interactive | — |

Each state combines colour + shape/icon + motion + audio + text caption, so none relies on colour alone.

### 9.4 Activities

All activities are **tap-based**: tap an item to place it, tap a placed item to take it back, tap one item on each side to match. This works with touch, mouse, keyboard and switch access, and satisfies WCAG 2.5.7 (dragging alternative). `DragDropContainer` is **documented, not implemented**: dragging will be added later as an optional enhancement on the same components.

Activities never receive answer keys. They report the child's response (`onSubmit`) and render the `status` the caller passes back (`editing | correct | tryAgain | reveal`), plus `revealOrder` / `revealFills` / `revealPairs` after the last try (DECISIONS D-004). Exception: `MemoryGame` needs pair keys on the client by design.

### 9.5 Loading, empty, error (LittleStatePanel)

- **Loading:** spinner + plain text, `role="status"`; never a blank screen.
- **Empty:** friendly illustration + what will appear + a next step.
- **Error:** simple explanation + **required** recovery action (enforced by the component's types). Children never see error screens; activities degrade to "try again later" flows (Sprint 03+).

## 10. Motion principles

Library: **Motion** (`motion/react`, the successor of Framer Motion — already installed; no second library). Presets in `src/design-system/motion/presets.ts`.

| Preset | Duration | Use |
|---|---|---|
| `buttonPress` | 120 ms | Every pressable control |
| `cardHover` | 200 ms | Interactive card hover (pointer devices) |
| `scaleIn` | 280 ms | Modal entrance |
| `fadeIn` / `fadeUp` | 300 ms | Content / section entrance |
| `successFeedback` | 350 ms | Correct answer (single grow, no bounce) |
| `gentleNudge` | 350 ms | Try-again on the chosen item only |
| `rewardReveal` + `rewardItem` | ≈ 700 ms | Stars and sticker reveal |

- Natural easing (`[0.16, 1, 0.3, 1]` out), small distances (≤ 12 px), soft scale (0.96–1.04).
- **No constant motion:** the mascot is still when idle; "cheer" hops once, "encourage" nods once; the mouth moves only while talking. The only loops are state indicators (audio playing ring, loading spinner).
- `prefers-reduced-motion`: `MotionConfig reducedMotion="user"` disables transforms globally; components also branch on `useReducedMotion()`; opacity changes remain so feedback is still visible; the spinner slows instead of stopping.

## 11. Accessibility requirements

- Contrast: all functional pairs ≥ 4.5:1 (text) / 3:1 (UI boundaries, focus) — tested in CI.
- Focus: 3 px `focus` outline on every control. Components that use outlines for state add `focus-visible:outline-focus` so the utility layer can't hide the focus ring (bug found and fixed in Sprint 02 QA).
- Names: icon-only buttons require `label`; answer tiles require `label` (Vietnamese); illustrations require `alt` or explicit `decorative` (enforced by types).
- Semantics: `role="switch"`, `role="progressbar"` with values and text, `role="dialog"` + `aria-modal`, `aria-pressed` for selections, `aria-current` for navigation, live regions for feedback and toasts.
- Modal: focus moves in, is trapped, Escape closes, focus returns, scroll locked.
- Tooltip: hover **and** focus, Escape hides, supplementary only.
- No colour-only meaning (matching pairs use colour + shape markers; status badges have text + icon).
- Touch targets per §7; WCAG 2.5.7 satisfied by tap-based activities.
- Parent gate: text instruction never read aloud; keyboard hold supported.

## 12. Illustration guidelines

### 12.1 Icons vs illustrations

- **Lucide** (`lucide-react`) for functional UI icons only (navigation, actions, status).
- **Learning art** (worlds, objects, shapes, rewards, avatars, mascot) comes from the illustration registry — never from Lucide or emoji.

### 12.2 Visual treatment for final 3D art

Soft clay/vinyl material, rounded forms, top-left key light, gentle ambient occlusion, a soft contact shadow under each object, pastel palette from §3 (base for the body, edge for shadow side, tint for highlights). Transparent background. No outlines, no text baked into art, no faces on objects that are answers (avoid ambiguity), consistent 3/4 camera for objects, front view for shapes.

### 12.3 Learning worlds

| World | Vietnamese (draft) | Tone | Visual direction |
|---|---|---|---|
| Alphabet Forest | Rừng Chữ Cái | mint | Rounded trees, letter-shaped leaves and signposts |
| Number Kingdom | Vương Quốc Số | yellow | Towers built from counting blocks |
| IQ Castle | Lâu Đài Tư Duy | lavender | Puzzle-piece walls, pattern windows; mysterious but never dark |
| Memory Garden | Khu Vườn Trí Nhớ | coral | Paired flowers, hidden-card flower beds |
| English Island | Đảo Tiếng Anh | blue | Beach, palms, picture-word signs |
| School Town | Thị Trấn Trường Học | yellow | Small classrooms, school bags, routines |
| Challenge Arena | Đấu Trường Thử Thách | coral | Mixed review with trophies; celebratory, never competitive between children |

Defined in `src/design-system/worlds.ts`. The Vietnamese names are drafts, and "IQ Castle" is flagged for naming review (DECISIONS P-8).

### 12.4 Naming convention

- Registry key: `{category}.{kebab-name}` — categories `world, object, shape, reward, avatar, mascot, state`.
- File: `public/illustrations/{category}/{kebab-name}@2x.webp` (static) — animations `…/{kebab-name}.webm` / `.json` (Lottie) when introduced.
- Register a delivered file in `src/illustrations/registry.ts` (`ASSETS`) — it takes precedence over the placeholder. Components don't change.

### 12.5 Placeholders

Every current illustration and the mascot are simple SVG placeholders, marked `data-placeholder="true"` and labelled in the showcase. **They are not final assets.**

## 13. Do and Don't

| Do | Don't |
|---|---|
| Use `ink` text on brand fills | Put white text on blue/coral/mint buttons |
| Use `*-strong` for coloured text and icons | Use brand base colours for text |
| Show try-again in soft coral with a nudge and encouragement | Use red, ✕, "Sai rồi", buzzers or shaking screens |
| Use `LittleIllustration` with a registry name | Use emoji or Lucide icons as learning pictures |
| Keep the mascot still unless reacting | Loop bouncing/rotating decorations |
| Give every answer tile and icon button a Vietnamese `label` | Rely on the picture alone for screen readers |
| Report responses and render the status you are given | Put correct answers in client components |
| Show mastery as a band with its label | Show percentages, grades, rankings or comparisons |
| Mark placeholder art, audio and data as such | Present placeholders as finished work |
| Use `LittleStatePanel kind="error"` with a recovery action | Leave blank screens or dead ends |

## 14. Component usage guide

```tsx
// Primary child action (64 px)
<LittleButton size="xl" iconEnd={<ArrowRight />} onClick={next}>Tiếp tục</LittleButton>

// Loading parent action
<LittleButton loading={saving} onClick={save}>Lưu thay đổi</LittleButton>

// Icon-only control (label is required)
<LittleIconButton label="Nghe lại" icon={<Volume2 />} variant="primary" size="xl" />

// A picture question (the caller grades on the server and passes states back)
<QuestionCard
  layout="split"
  instruction={<AudioInstruction text="Quả bóng có hình gì?" source={{ src: "/audio/q12.mp3", text: "Quả bóng có hình gì?" }} />}
  stimulus={<LittleIllustration name="object.ball" alt="Quả bóng" priority />}
  feedback={feedback && <FeedbackPanel kind={feedback.kind} message={feedback.message} />}
>
  {options.map((o) => (
    <ImageChoice key={o.id} illustration={o.illustration} label={o.label}
      state={stateOf(o.id)} feedbackKey={attempt} onSelect={() => submit(o.id)} />
  ))}
</QuestionCard>

// Ordering activity
<SequenceBuilder items={items} status={status} attempt={attempt}
  revealOrder={revealOrder} onSubmit={(ids) => submitAttempt(ids)} />

// Parent observation (no scores)
<SkillProgressCard domain="Số và đếm" skill="Đếm đến 10" band="developing"
  observation="Bé đếm tốt đến 5." homeActivity="Cùng bé đếm bát đũa khi dọn bàn." />

// Form field wiring
<AdminFormField label="Tên gọi của bé" hint="Chỉ cần tên ở nhà." error={error} required>
  {(f) => <LittleInput id={f.id} aria-describedby={f["aria-describedby"]} invalid={f.invalid} />}
</AdminFormField>

// Toasts
const toast = useToast();
toast({ tone: "success", title: "Đã lưu cài đặt" });

// Student frame with gated exit
<StudentShell navigation={<StudentNavigation onBack={back} center={<LearningProgress total={5} current={i} />} onParentAccess={goParent} />}>
  …
</StudentShell>
```

## 15. Known limitations

- Mascot, world art, objects, avatars and stickers are SVG placeholders.
- Audio in the showcase uses browser speech synthesis (labelled "Âm thanh demo"); no recorded voice-over exists yet. Vietnamese voices are missing on many devices.
- `DragDropContainer` is not implemented (tap interactions cover all activities).
- Visual QA was done in Chromium with iPad-sized viewports and touch emulation, **not on a physical iPad / Safari**.
- No dark theme (not required for v1).
- Parent/admin components are presentational; their data and routes arrive in later sprints.
