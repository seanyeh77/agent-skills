---
name: teaching-materials-style
description: SeanYeh's house style for any slide deck, document, note, diagram or animation (talks, reports, proposals, technical docs, teaching). Use for Slidev decks, PowerPoint (.pptx) decks built from screenshots, Notion or other docs, diagrams in any tool, and Motion Canvas animations (web page or Slidev embed).
---

# Presentation and document style

One style guide for every deck, document, diagram and animation SeanYeh makes, whatever the purpose: teaching, talks, project reports, proposals, competition write-ups, technical notes. Read the section that matches the output; diagrams inside docs or slides also follow the Diagrams section.

- Documents and notes (Notion or similar) → section 1
- Slide decks → section 2
- Diagrams, in any tool → section 3
- Animations of a moving mechanism (Motion Canvas: web page or Slidev embed) → section 4
- PowerPoint (.pptx) decks, especially product or system briefings built from screenshots → section 5

Throughout, "audience" means whoever reads or watches: students, reviewers, teammates, judges.

Rules for every output:
- Chinese wording follows https://github.com/LCY000/zh-tw-writing. Read its `SKILL.md` before writing, and run its `scripts/check_zh.py` on the finished text, fixing what it reports.
- Every figure (accuracy, counts, sizes) has a recorded source: where it came from, when, and under what conditions (test set version, sample count, per-class or overall). Do not state a condition the source does not show (for example "all measured on unseen data"); ask instead.

---

## 1. Documents and notes

### Structure
- Gray table of contents at the top.
- H1 headings: English, bold, with a divider below each one.
- Start with an Overview section, end with a Reference section.
- H2 headings: green background. H3 headings: orange text, throughout the whole doc.
- Near the top, a Background section of term definitions, grouped by theme, one H3 per term, with a line saying readers who already know it can skip ahead. Define every term before the section that relies on it.

### Body text
- Never bold body text; only H1 headings are bold.
- Chinese prose, technical terms kept in English. Prefer the common English term over an invented or obscure Chinese coinage; define it once at first use (for example keep "burst").
- Before each command, one sentence saying what it does, then the code block, then its Output.
- Long output goes in a toggle labelled "Example:".
- Config changes are shown as Before / After columns.
- Every number carries its unit, in prose, code blocks and tables; in tables the unit goes in the column header (分, req/s, ms, 個, 筆).
- Write for a reader with no background in the topic.

### Callouts
- Notion icons, never emoji. Label text is not bold.
- NOTE: blue background, report icon. TIP: green background, light-bulb icon. EXAMPLE: gray background, arrow icon. WARNING: yellow background, warning icon.
- Add a callout explaining any harder technical term (for example daemon).

### Links and scope
- Link related notes as further reading with blue-background page mentions.
- Split a topic into a separate doc only when it is long enough to pull the material away from its main focus (for example NIS), then link to it.
- The doc reads standalone: no references that only make sense from the conversation it came from ("this round", the date of the work session), and no citations the reader cannot see (section numbers of another report); state the content instead ("the earlier conclusion was…").

### Diagrams in docs
- For hard-to-understand or framework-type topics, first list the recommended diagrams and ask whether to include them. The user reviews each one; then place it at the matching spot with an image description.

### Reporting results
- Report results in full: individual sample values as well as the average, the control condition stated explicitly, and the side checks that were run (whether output changed, resource usage, startup time).
- Use real measured output, never invented figures; keep the same object's IDs, sizes and names consistent everywhere it appears.

---

## 2. Slide decks (Slidev, Textbook theme)

Applies to any deck: lectures and workshops, conference or club talks, project and competition reports, proposals. Reference implementation: github.com/seanyeh77/docker-workshop (slides/: layouts, components, styles); reuse its layouts and components for a new deck. docker-workshop predates the hybrid palette below: when reusing its styles, replace its hard-coded colors and fonts (--tb-* variables) with the design-system tokens listed under Palette and fonts. Its tables, labels, statement and quiz styles also predate the rules below: where its CSS and these rules disagree, the rules win.

### Setup
- Slidev, custom "Textbook" theme, light backgrounds only (dark styles such as terminal or blueprint were rejected).
- Canvas 1920 x 1080, routerMode hash, transition none, drawings disabled, `titleTemplate: '%s'`.
- Deploy with GitHub Pages via GitHub Actions (`slidev build --base /<repo>/`).
- Related decks on the same example (for example using a cluster, then building it) live in one repo and share layouts, components and styles: one entry file per deck (`intro.md`, `build.md`), pages in `pages/<deck>/`, each built to `dist/<deck>/` with `--base /<repo>/<deck>/`, a landing page at the repo root linking every deck, `slides.json` at the root listing each deck with its path, and one script file per deck (`SCRIPT-<deck>.md`). Each deck numbers its chapters from Ch 1 and refers to the other deck by its title, never by a chapter number; the second deck opens with a short bridge slide naming what it builds on.
- To publish a deck as a Claude artifact: build with `--base ./` and routerMode hash, delete `_redirects` and `404.html` from the build, publish every file of `dist/`, and check it once inside the viewer with a forced dark host theme.
- A host page (for example the artifact viewer) may set a dark theme on `<html>`, which overrides tokens defined at `:root`. Pin the deck's tokens and the `--tb-*` mapping on `body, #app`, imported after the theme CSS, and check the deck once with a forced dark host theme.
- Page transitions stay off unless asked for. When a deck uses them: chrome (progress bar, chapter label, footer) stays still, the screen never goes blank and the two pages are never both half transparent (the new page fades in over the opaque old one), text snapshots keep their natural size instead of being stretched, and `prefers-reduced-motion` turns every transition off.
- Viewers choose the accent color in every deck: a color dot at the right end of the Slidev nav bar opens a popover with the design system's 8 preset swatches and a hex field (accepts the code with or without #, explains a wrong format), plus the page-transition choice when the deck has transitions. The default is one of the 8 swatches, so a viewer can always pick it again: 青 #027874 for the teaching theme and 藍 #2457d6 for the UI variant. In the light theme every swatch, and so every default, reads as text by itself (4.5:1 on the background, surface, surface-sub and its own accent-soft) and with white text on it (4.5:1); fills reach 3:1 on every ground. The choice is stored under the design system's `ui-accent` key, and every derived color (hover, pressed, soft, focus, readable accent text, focus outline) follows the design system's accent derivation, so a light accent never makes text unreadable. The popover works by keyboard (Tab to the dot, Enter opens, arrow keys move within each radio group, Esc closes and returns focus) without breaking arrow-key navigation, stays inside the window at 390 px wide, and is hidden in print and export.
- Build the picker from `templates/slidev/`: `custom-nav-controls.vue` goes in the deck root (Slidev renders it at the right end of the nav bar), `accent.ts` in `utils/`, and `setup/main.ts` calls `applyAccent(storedAccent(), true)` once so the stored or default color applies on load. Three details matter: the dot is a focusable `div role="button"`, not a `<button>`, because Slidev turns arrow-key navigation off while a button has focus; the derived colors are set inline on `html`, `body` and `#app`, because the deck pins its tokens on `body, #app`; and the popover follows the deck's theme (in the teaching theme square swatches, no shadow, 1.5 px borders). The choice is shared through `ui-accent` with every page on the same site, the design system's docs included.

### Palette and fonts (hybrid preset of the design system)
- Decks use the "teaching" preset of seanyeh77/ui-design-system, chosen as the hybrid option: neutrals and fonts come from the design system, while the accent (teal by default), sharp corners and thin borders stay from the slide style. Deck CSS reads the design-system token names (--bg, --surface, --surface-sub, --ink, --ink-muted, --line, --line-strong, --accent, --accent-soft, --radius-sm, --radius-md, --font-sans, --font-mono) and never hard-codes these values; the preset supplies them.
- Values: bg #fcfbfb, surface #ffffff, code and terminal-bar background (surface-sub) #f6f5f4, ink #171512, muted (ink-muted) #6d645a, rules (line) #e2dfdc, heavy rules and dividers #171512, accent 青 #027874 by default (chapter labels, progress bar, list markers, note border, correct answers), accent-soft #e1efee by default (highlighted code lines, soft fills); accent-colored text reads `--accent-text` (the accent itself for every swatch, darkened only for a custom color below 4.5:1), inactive focus-index items in the muted ink #6d645a (lighter grays such as #aca49a fall below 4.5:1).
- The theme color is adjustable: teal is only the default, and each viewer can change it with the accent picker (see Setup). Every accent use reads `--accent`, `--accent-soft` or `--accent-text`, never a hard-coded teal or other color, so one choice recolors the whole deck: progress bar, chapter label, section numbers, note border, list markers, highlighted code, quiz answer, takeaway lines and the one highlighted diagram element. Neutrals, fonts and the diagram palette stay fixed.
- Radius 0 everywhere (radius-sm and radius-md are 0 px in this preset); no shadows; frames keep 1.5 px borders in the line color.
- Fonts: titles Inter + Noto Sans TC, weight 700. Body Inter + Noto Sans TC. Code, terminal and mono labels Geist Mono + Noto Sans TC.
- Diagram fills keep the diagram palette (#aeacac, #e7e7e7, #adf0c7, #6eea9e) and do not follow the theme.
- Sizes (px): title 54, body and lists 40, definitions 40, quiz options 35, cards 33, compare tables 34, step text 30, right-side note 30, code blocks 31, terminal 29, footer 18, chapter label 19.

### Fixed elements on every slide
- 7 px progress bar in the accent color at the top.
- Uppercase section label in the accent color top-left, with a gap below it.
- Footer rule: deck title on the left, page / total on the right.
- Optional small tag top-right naming the file or language (Dockerfile, Terminal).

### Titles and wording
- Titles never centered. Default top-left, content centered in the remaining space; on some slides the title sits right above the content. Section dividers centered horizontally: large section number in the accent color, subsections on the right.
- Titles concise and formal, never colloquial, never questions. Jokes and analogies go in the body, dialogue boxes or the script file.
- Every symbol and legend entry on a slide is explained on that same slide, in one short line (note column, caption, or beside the figure): ▲ ▼ =, arrows, colours, units, icons, code letters. A reader who lands on the slide must be able to read its symbols alone; the script, an earlier slide or the presenter's voice do not count. Terms and abbreviations are defined once, at first use (a note on the first slide that uses them, or a definition slide), not repeated on every slide, and not at all when the audience already knows them (their own product, or standard words of their field such as EMS or PUE for a data-centre audience). Prefer a self-explanatory name over a code letter or label: show "Suggest only" and "Original control", not "B" and "A" that the audience has to look up; if a letter is kept, the same slide says what it stands for. English labels in a diagram get a Chinese gloss where they first appear.
- All on-slide text (item titles, body, note column, takeaways, tables) uses formal written wording, not vivid colloquial phrases ("版本衝突", not "版本會打架").

### Layout
- One concept per slide: title plus one component. Per-click explanations in the right-side note column (330 px, left border in the accent color, NOTE label).
- No Slidev speaker notes (no `<!-- -->` comments in slides). Every deck comes with a separate Markdown file (for example `SCRIPT.md`) holding the notes and talk script, ordered by slide number and title: for each slide, the note-column points by click step, then the script. Edit the script there, not in the slides.
- After inserting, deleting or moving slides, renumber every slide heading in the script file and fix every reference to a slide number in it ("第 N 張").
- Keep notes short: only the key point of that step, usually "command or option: what it does". Leave a step's note empty when the point is obvious from the screen ("進入 Container", "刪除 Container"); an empty step hides the whole note column, label included. Longer explanations go in the script file.
- Anything the audience must do ("add 3 items in the browser") appears on the slide itself, for example as the takeaway line, not only in the script file.
- Layouts: cover; section divider; objectives or agenda (01/02/03); focus slide for a set of items; statement; definition (term left, meaning and example right); two-column compare table; quiz; figure with a one-line takeaway in the accent color; reference table; Bento grid for section and final summaries; end slide naming the next topic or next steps.
- Never lay several cards, pain points or steps side by side in a horizontal row. Use the focus method: a vertical index on the left with the current item highlighted, one item shown large on the right, advancing on click.
- Headings, quiz questions, table headers, row labels, focus-index items and tile labels never wrap: shorten the wording or widen the column (size label columns to their content).
- Compare tables: name the first column's header (項目, 情況); when both sides have the same value, merge the two cells into one left-aligned cell spanning both columns. No 「同左」 and no badge or chip announcing it (such as 「兩者相同」): the merged cell says it.
- Rows revealed per click keep their row label, cell background and grid lines visible from the start; only the values appear on click.
- Tables (compare and reference) look the same in every deck:
  - Header row: background neutral-100 #eeecea, ink text, weight 700, 30 px, one line. Never a colored or accent header cell, never a thick or dark rule under the header.
  - Body: ink text at the slide size (compare 34 px, reference 32 px), line height 1.45, cell padding 22 px 32 px, text top-aligned and left-aligned; numbers right-aligned with the unit in the column header.
  - First column: row labels in ink, weight 600, the same size as the body (never smaller or muted), column sized to its longest label so labels never wrap.
  - Lines: 1 px line color between all rows and columns; zebra rows in surface-sub #f6f5f4.
  - Code names (commands, options, errno, signals, file paths) in code style: mono, surface-sub background, 2 px smaller than the body.
  - Frame: teaching theme 1.5 px line-color outer border, square corners, no shadow; UI variant no outer border, radius-lg and the card shadow.
- Never dim text with opacity to mean "not yet" or "not chosen"; use the muted ink color, so every visible text keeps at least 4.5:1 contrast.
- Avoid patterns that read as generic AI-generated design, in every theme: a lone sentence in a centered white card with a shadow; badges, chips or labels announcing a conclusion (「兩者相同」, 「正解」, 「重點」); check marks or icons on answers; gradients, glows and emoji as decoration; decorative icons next to headings. Emphasis comes from layout, size and the one accent color.
- Smallest on-slide labels (file tags, tile labels, keyword chips, NEXT label) are at least 22 px.
- A rule or explanation that would otherwise be a paragraph becomes something the audience can see, tried in this order: a step-by-step diagram (the mechanism, with "Step x of y"); a real example or output shown first with the rule as a one-line takeaway; short sentences revealed one per click (focus layout, cause and effect as two steps); a condition-and-result table revealed row by row; before/after diff or magic move; a quiz whose explanation is the rule. Diagram colors stay the fixed diagram palette in every theme; only the one highlighted element per step follows the accent.
- Only when none of these fits, use the statement layout: the heading is the complete conclusion in one line, with at most one short supporting sentence in muted text below it. The sentence sits directly on the page, left-aligned at the content edge and vertically centered: no card, shadow, box or colored bar around it. Definitions, exceptions and background go in the script file.
- Boxes and code frames sharp-cornered with 1.5 to 2 px borders.

### Animation
- When the point is something moving (a job travelling between machines, a schedule filling up over time), build a Motion Canvas animation (section 4) and embed it, instead of a step-by-step SVG.
- Magic Move, line highlight, terminal typing, code-to-diagram sync, before/after diff, annotated commands; step-by-step diagrams carry "Step x of y" and a caption.
- A step-by-step diagram of a mechanism ends with the contrast case when there is one: after the normal flow, a last step shows what goes wrong without the key action (for example the missing close that keeps a connection in CLOSE_WAIT), with the one changed element in the accent color. This is the natural place right before a quiz on that point.
- Diagrams and figures fill the content area: at least 70 % of its width (1760 px) or of its height (about 720 px below the title), with box text still 24 px. Enlarge the drawing or tighten its spacing rather than leaving a small picture in a large empty slide.
- Step-by-step SVG diagrams are never scaled below 1x (box text stays 24 px): when a diagram has many rows, tighten the row pitch (down to 56 px, boxes 44 px) instead of shrinking the whole picture.
- Highlighted code lines form one continuous band across the block width, with no gaps between lines or per-token patches.
- Terminal typing is fast: about 15 ms per character, long commands done within about 0.8 s.
- Never animate the same content twice: if one slide reveals a file line by line with explanations, later slides show it all at once.
- Show a complete file in full only once. If a later slide would repeat it, keep the earlier slide and drop the later one, moving any useful explanation into the script file.
- No countdown timers.

### Terminal and code output
- The prompt is a plain `$`. Inside a container or remote shell, use that shell's own prompt (for example `/ # `) so the audience can tell where the command runs.
- When the working directory matters (clone, build, a file created on the slide, compose), show it in the terminal title bar, never inside the prompt, and update it after each `cd`. Other terminal slides leave the bar empty.
- Keep lines short so the terminal font does not shrink: trim output to the columns and lines that make the point, mark skipped lines with `...`, and say in the note what was omitted. Don't add display-only flags (such as `--format`) the audience would then have to understand.
- When output is filtered with grep, also match the header line (for example `netstat -tan | grep -E 'Proto|9877'`) so the column names stay on screen, and say in the note what each output snapshot corresponds to (before connect, connected, after close).
- Use real output from an actual run; keep IDs, sizes and names consistent across every slide that shows the same object.
- The final click state shows every command typed on that slide (set how many finished commands stay visible accordingly).
- Output matches what the audience will see in their environment (for example no download messages when images are pre-pulled).
- Examples that stand for different data look different (a new set of todo items after the old ones were deleted), so the audience does not read them as the same data.

### Demos and reproducible steps
- Any command on a slide must run in order from the state earlier slides leave behind: create any file a slide reads on that slide or earlier (with a command, not only "use an editor"), cover the states a repeat run causes (for example a name already in use), and show how to leave interactive sessions (`exit`).
- Prefer small, fast-to-download images and packages so every demo finishes in seconds.
- Turn errors people actually hit into "常見錯誤" slides: the real error first, then the fix.
- When comparing two approaches, use the same command or metric and the same columns for both, ideally the same subject done both ways.
- Don't expose the infrastructure behind the audience's environment (virtualization platform, internal tools, hosts): describe it in neutral terms such as "提供的 Linux 主機". Presenter-only details stay in the spec or the script file.

### Copying commands
- Every finished command line in a terminal shows a small copy icon (no text button) only while the pointer is over that line; it copies the command without the prompt and briefly turns into a check mark. Never show it in presenter or print/export mode.
- Clicking the icon must not take keyboard focus (tabindex -1, prevent focus on mousedown, blur afterwards), so arrow keys and space keep navigating the deck.
- Publish a command list page next to the deck (for example `commands.html`), generated from the slides' terminal commands at build time so it never drifts: grouped by section and slide title, each command with the same copy icon, commands run inside a container marked as such, demo-only and error slides left out, full files (Dockerfile, compose.yaml) at the end. It reads well at phone width with long commands wrapping. Give its address on the first hands-on slide.

### Audience questions (when the deck has them)
- No Slido. Questions sit on the slide as a quiz (A/B/C/D) and the audience answers by show of hands.
- The next click reveals the answer: the correct option gets an accent border, a soft accent fill and a filled letter key, the other options switch to the muted text color, and a short explanation fades in. No check mark, icon or label on the answer.
- The question fits on one line; shorten it (quiz questions may drop to 46 px) rather than wrap.
- Each question sets up content that comes later (a later demo or section verifies it); never a throwaway or joke question.
- Ask only after every concept the question depends on has been presented, including the rule the answer hinges on (for example "count 歸 0 才送出 FIN" before a question about a missing close) and every term in the options (CLOSE_WAIT, signal, disposition). Add a statement or definition slide right before the question when needed.

### Flow
- Write every deck to be reusable for other audiences and occasions: no wording tied to one event or class (本課程, 學員, TA, 講師示範, 休息 10 分鐘, 分組作業, 今天 3 小時), on slides or in the script file. Use neutral words (接下來, 重點整理, 專案), and put environment-specific steps in the script file with the alternative (for example "on your own laptop, skip the ssh line").
- Avoid abrupt jumps between consecutive slides; add or reorder a bridging slide.
- Recap and checkpoint slides must add something (for example a map of what has been built or covered so far); never repeat the slide before them.
- Discuss with the user before restructuring a section or making other large changes.

### Checks before publishing
- Run the slide checker on the built deck and fix everything it reports before publishing; a deck is not finished while it exits with 1. It walks every slide and click and reports text past the slide or clipped, wrapped headings and labels, dimmed text, text under 22 px, table headers that are smaller, colored or thick-ruled, statement sentences inside a card or bar, quiz icons, special symbols, event-bound wording, titles, code blocks and terminals off the size spec (54, 31, 29 px), and diagrams smaller than 70 % of the content area. It ships with this skill as `scripts/check_slides.py` (also at https://raw.githubusercontent.com/seanyeh77/agent-skills/main/plugins/teaching-materials-style/skills/teaching-materials-style/scripts/check_slides.py):
  `npx slidev build --base ./ && npx vite preview --outDir dist --port 4173 &` then `python3 check_slides.py http://localhost:4173/ --shots shots/` (needs Playwright for Python and a Chromium). The checker does not judge content or diagrams; the checks below still apply.
- Code and text never run past the slide, a box edge or into the note column; long terminal lines shrink to fit.
- Check every slide at every click step with the real fonts loaded (headless browser: scrollWidth vs clientWidth, element bounds vs the slide), including the final state after typing animations finish, and confirm nothing overlaps the title or footer. Look at screenshots of changed slides.
- Check every SVG diagram at every click step with a geometry script (reference: scripts/check-diagrams.py in seanyeh77/cluster-slurm-slides), in SVG user units: a line running inside a box instead of ending at its edge, a line crossing a label, overlapping labels, a label sticking out of its box, and anything outside the viewBox. The slide-level overflow check does not look inside SVGs.
- Review every diagram step from a full-resolution screenshot of the diagram alone, never from a scaled-down contact sheet: offsets of a few pixels (an axis cutting through boxes) disappear when shrunk.
- Commands shown on slides must actually run; verify them when possible and keep example output faithful to current versions.
- In Vue template attribute props, write `&amp;lt;` to show a literal `<` (for example `<untagged>`).
- After scripted edits, review the diff to confirm only the intended slide changed.
- Test every interactive feature in a real browser, including that slide navigation (arrow keys, space) still works after using it.
- When asked for a review, run several cheap reviewers in parallel, each in one role: a learner without background, a design-system reviewer, an accessibility reviewer (WCAG 2.2 AA), a presenter on a projector, and an interaction tester. Verify every finding against screenshots and source before reporting, then list the confirmed ones by severity and the rejected ones with the reason.

### UI variant (ui-design-system look)
When SeanYeh asks for a deck in the ui-design-system look (for example to compare with the teaching style), keep the content and animations and change only the look:
- The design system's default light tokens instead of the teaching preset: warm-gray neutrals, cards with soft shadows instead of borders, radii 6 to 14 px, headings weight 700. Remove every leftover teaching style: thick dark or colored left bars, sharp bordered chips, hard-coded teal or orange, mono font on non-code headings.
- Cards only for blocks that hold several items (tables, quiz options, tiles, terminals). A single sentence is never wrapped in a centered white card with a shadow: that reads as generic AI-generated design.
- The accent picker works as described under Setup, with blue #2457d6 as the default.
- Tables use the Tables rules under Layout, with the UI frame (radius-lg and card shadow, no outer border).

---

## 3. Diagrams (any tool)

Applies whether the diagram is drawn in Miro, generated with Python (matplotlib, graphviz, diagrams), written as SVG or Mermaid, or made in Figma, and whether it goes in a deck, a doc or a report. Pick the tool that fits the destination; the look stays the same.

### Boxes and colors
- Sharp-cornered boxes, border #1a1a1a width 2, text #1a1a1a (24 px at a 1920 px wide canvas, scale proportionally elsewhere).
- Outer container #aeacac, inner node container #e7e7e7, service boxes #adf0c7, bars and storage #6eea9e. In slides the deck's accent color (青 #027874 by default) may highlight one element per step.
- Nest containers to show what runs inside what.
- Size boxes so text fits on one line without crowding.

### Lines
- #333333, width 2, elbowed (orthogonal routing; in graphviz use splines=ortho).
- Mostly one-way arrows flowing top to bottom; network links may be two-way.
- Line labels horizontal, never vertical; same size as other line labels.
- No line passes behind any text. No crooked small jogs: align ends or make forks symmetric.

### Text
- English only, no Chinese.
- No special symbols (circled numbers, full-width parentheses, slashes).
- No side descriptions next to the diagram; short English line labels only.

### Layout
- Compact and symmetric. Minimize whitespace without losing content, leaving enough room for lines to route smoothly. Goal: diagrams that look bigger, cleaner and punchier.
- Export at a resolution that stays sharp on a 1920 x 1080 slide (SVG preferred; PNG at 2x).
- When drawing with code, derive every coordinate that must line up (an axis under a row of boxes, an arrow ending on a box edge, a label beside a line) from the same named constants as the shapes it touches, never from a second hand-typed number.
- Edges are never clipped: leave a margin around the canvas at least as wide as the thickest border (pad the SVG viewBox), so strokes on all four sides stay fully visible. Check by screenshotting the diagram alone at 2x.

---

## 4. Motion Canvas animations

For mechanisms where something moves and the motion is the point: a job travelling from login node to scheduler to compute nodes, a packet crossing hops, a schedule filling up over time. A diagram whose steps only add or highlight boxes stays a step-by-step SVG in the deck (section 2).

The same animation becomes two outputs: a standalone web page (published as an artifact) and an embed in a Slidev deck that advances with the deck's clicks.

### Template and scripts
Shipped with this skill (also at https://github.com/seanyeh77/agent-skills/tree/main/plugins/teaching-materials-style/skills/teaching-materials-style):
- `templates/motion-canvas/`: Vite project with Motion Canvas 3.17.2 (versions pinned, package-lock included). Start every new animation by copying it, keep `theme.ts` and `components/`, and write new scenes in `src/scenes/` (add them to `src/project.ts`). Its README covers the files, URL parameters and pitfalls. The three Slurm scenes are examples: `jobFlow` (basic), `clusterFlow` (full flow, tokens travelling along paths), `backfill` (signal-driven layout, reactive text).
- `templates/slidev/MotionCanvas.vue`: the deck component.
- `scripts/check_motion.py`: plays every step and audits it.

Commands: `npm install`, `npm start` (editor at localhost:9000 for building scenes), `npm run build` (player page in `dist/`), `npm run preview` (serves `dist/` at localhost:4174).

### Look
- The Diagrams rules (section 3) apply: the diagram palette, sharp corners, 2 px #1a1a1a borders, #333333 elbowed lines, English only on the drawing, no line behind text, compact and symmetric layout.
- Canvas 1920 x 1080, 60 fps, background the deck's page color #fcfbfb (`COLOR.page`, the same as `--bg`), never white: the animation sits on the slide with no visible frame. Text in Inter: title 48 px, labels 40 px, captions 32 px, never under 24 px.
- The drawing fills the canvas: lay out boxes, rows and the timeline across the full 1920 x 1080 (margins about 60 px) instead of a small diagram in the middle. In a deck the frame takes the full width of the content area, so canvas pixels map almost 1 to 1 onto the slide.
- Motion colors: moving tokens #94f2b8 with the usual border, the trail behind a moving token #1f9d57 at 6 px, secondary text #66707c. The one changed element of a contrast case uses `COLOR.accent` (text `COLOR.accentText`), which `theme.ts` reads from the viewer's `ui-accent` (青 #027874 when none is stored); when the viewer picks another color in the deck, `MotionCanvas.vue` reloads the animation at the current step.
- Every color, font size and machine dimension lives in `src/theme.ts`; scenes never hard-code a color or a size. Positions that must line up are computed from the same constants as the shapes they touch.
- A "Step x of y  Name" label in the bottom-right corner, updated each step.
- An explanatory caption line under the diagram may be Chinese, because the standalone page has nowhere else to put it. In embed mode (`?embed=1`) captions are not drawn (`SHOW_CAPTIONS` in `theme.ts`); the deck's note column carries the explanation.

### Motion
- The opening, before the first step, draws the whole diagram (nodes fade in one after another, lines draw), so the first frame is never empty.
- Steps: use `step('name')` from `components/motion.tsx`, never `beginSlide()` directly. The player pauses there for a click; the editor preview holds 1.5 s instead (`step(name, hold)` for a longer pause). One idea per step.
- One `all()` per step, with `delay()` staggering the start of each action, never a chain of separate `yield*` lines that stop between actions.
- Movement is driven by one progress signal from 0 to 1 (easeInOutCubic), with the position computed on the path (`travel()`), so a token never stops at a corner; the trail's end is bound to the same signal and fades on arrival.
- An arrival ends with a flash on the target: bright for 0.17 s, back to its color in 0.23 s (`flash()`).
- Tokens pop in and vanish with `popIn()` and `vanish()` (0.17 s each), and removed nodes are deleted from the scene.
- Durations stay short: a travel 0.6 to 1.8 s depending on distance, fades 0.2 to 0.3 s.

### Code pitfalls
- The player imports `./project?project`, never `./project`; without the suffix the project is not bootstrapped and playback stops on the first error.
- In a custom component write `{...rest}` before `ref`, otherwise the undefined `ref` inside rest overwrites the real one.
- Wrap each item of a `map()` in `<Node>`, not a fragment `<>`; fragments inside arrays can silently drop out of the scene.
- A local variable must not shadow an imported helper (a Txt named `step` hides `step()`).
- `npx tsc --noEmit -p .` must pass before building.

### Standalone page
- `npm run build`, then publish every file of `dist/` as the artifact, with `index.html` as the page. `?scene=name` plays one scene.
- Controls: Next, Previous, Replay (replays the segment that led to the current state), arrow keys, space, R, F for full screen; a step counter in the footer.

### In a Slidev deck
- Copy the built `dist/` to the deck's `public/motion/` (again after every rebuild) and `MotionCanvas.vue` to `components/`.
- `<MotionCanvas src="motion/index.html" scene="clusterFlow" :steps="7" />`, where steps is the number of `step()` calls in the scene (check_motion.py prints it). The component takes that many clicks, counted like v-click, so other v-click elements and the note column keep their order; give `at` an absolute click number to share clicks with the note column.
- Clicking forward plays the next segment; going back, or entering the slide from the following one, shows the state at once without replaying. Keys and clicks stay with Slidev (the iframe ignores pointer events).
- Entering the slide must not change the picture: no blank frame, no load, no replayed opening. Slidev keeps the neighbouring slides mounted but hidden (`display: none`), where Motion Canvas would measure every box and text as size 0 and keep it, so the iframe cannot simply sit inside the slide. `MotionCanvas.vue` therefore teleports the iframe to a page-level layer: it loads while its slide is still a hidden neighbour, parked inside the window with opacity 0 behind the deck (an iframe moved off-screen is throttled by Chrome and freezes mid-step), and on arrival is laid over the slide's placeholder box, whose position a requestAnimationFrame loop copies. `embed.ts` answers the first `motion:goto` by jumping straight to that step's end state without playing the opening or earlier steps (the final state is reached by fast-forwarding the last segment), so entering from either side shows the right state at once. Keep both parts when changing the component or the player. If the animation has not reported back after 6 s it reloads the iframe once.
- The player page loads its Google Fonts stylesheet without blocking (`media="print"` swapped on load) and waits at most 2.5 s for Inter: a blocking stylesheet keeps the player script from running, so on a slow phone connection the frame stays white.
- The slide keeps one concept: title, the animation filling the content area, and per-step notes in the note column.
- The slide checker cannot see inside the canvas: run check_motion.py with `?embed=1` as well.
- Works in a deck built with `--base ./` and published as an artifact (the src is resolved against the deck's base).

### Checks before publishing
- `python3 check_motion.py http://localhost:4174/ --scene name --shots shots/` for every scene, and once more with `?embed=1` when the animation goes in a deck. It must exit 0: it reports text outside the canvas, text overflowing its box, overlapping text, text under 24 px, steps that never settle, and console errors (an unreachable web font is only a warning).
- Look at every step screenshot at full resolution, the opening and the final state included.
- For a deck, press through the slide with the arrow keys forward and back, enter it from the previous and from the following slide, and confirm the animation follows.
- Entry check for every animation slide, from the previous slide and from the following one: take a screenshot about 16 ms after arriving and another after 500 ms; the two must be pixel-identical (forward entry shows the opening state, backward entry the final state). Any difference is the entry jump coming back.
- The final step shows the finished result of the mechanism: compare its numbers (end time, completed jobs, safe sequence) with an independent calculation, so a scene never stops one step early.

---

## 5. PowerPoint decks (pptx)

For decks delivered as .pptx, typically a briefing that walks through a product with real screenshots. The look (palette, fonts, sizes, no AI-style decoration) follows section 2 translated to PowerPoint; the rules below cover what PowerPoint and screenshots add. Build with a generator script (for example pptxgenjs plus a post-processing step for animations), never by hand, so every fix is reproducible.

### Content
- An external briefing explains how the system works, not only how to operate it: a data-flow diagram (where requests enter, which services they pass, where data is stored, how results return), the model deployment architecture (training source, inference engine, file format, whether a model change needs a redeploy, resource limits), and the external API (main endpoints, authentication and scopes, event notifications such as webhooks, plus a sequence diagram of one complete call). Check every architectural claim against the code or config, not memory.
- When adding a chapter, update the agenda, chapter numbers, summary slide and total page count with it.
- No speaker notes in the file; the talk script lives in a separate file.

### Layout
- Slides of the same kind use the same sizes: compute every position from shared layout constants (margins, content area, font sizes) instead of tuning slides one by one. Pictures scale to the content area keeping their aspect, centred. Check by viewing all slides as a contact sheet.
- No large empty areas: a picture or zoomed view fills the content area. When a zoom window's aspect differs from the display box, widen the window rather than leaving a void.
- Crops and zooms never cut through text, icons or lines: compute an ink map of the screenshot (small blocks, "ink" when the block's max−min brightness passes a threshold), then move each crop edge to the nearest run of blank blocks within a limit, ignoring border lines that span the whole image. Check all four edges of every crop zoomed in.
- Screenshot text must stay readable on the slide. Measure it, do not judge by eye: effective size in pt = the font size in the product (px at 1x) × displayed inches per source px × 72, with displayed inches per source px = picture width on the slide ÷ source px it shows. The smallest label inside a marked region must come out at 10 pt or more, marked numbers and headings at 12 pt or more. Two full-width panels side by side landed at 4 pt and a whole floor plan at 8 pt in one deck; a full-window overview lands near 5 pt. Fix in this order: (1) one screenshot per slide instead of two side by side; (2) crop to the region the marks point at; (3) recapture at a narrower window or panel (a 760 px drawer, a 1200 px window) so the same text is relatively larger, rather than upscaling a small crop or cutting a card or tab in half at the crop edge; (4) split into one slide per region with Morph. An overview slide may stay small only when every mark on it has its own zoom slide that passes the check. Print the effective sizes for every picture in the generator's checks.
- Screenshots are clean: no focus rings, carets, hover highlights or other capture-time state. Move focus and the pointer away before capturing; retouch the ones already taken and keep the original.
- Code, API paths and parameters use a monospace font that ships on every platform (Courier New). A font missing on the presenting machine is substituted with different widths and symbols such as `{id}` run together. Preview once in a second renderer.

### Marks on screenshots
- A highlight frame fits what it points at: start from a rough box, then shrink it to the content's ink bounds with an even small margin. Use hand-set coordinates only where the automatic fit fails (busy backgrounds), and mark them as such.
- Frame accuracy is measured, not eyeballed: map each frame back to source pixels through the picture's crop and measure the margin to the nearest ink on all four sides. Margins on one frame agree within about 2 px; frames on one slide stay at least 4 px apart (two 2.25 pt lines closer than that merge into one thick bar); a frame edge never sits on a divider hairline (start just below it, or include it with a margin); pale bars and chips (grey on white) are missed by a grey-level threshold, so set those edges by hand and check at 200 dpi. A rough search box that stops inside the target (the "now" marker circle at its edge) makes the frame cut it: widen the search box, not the pad. Repeat the audit after every fix until it finds nothing; each fix can break a neighbour (a moved badge landed on the next frame).
- Number badges never cover content or each other: place them in the gutter beside the picture; when another frame lies between, or the frame is far from the edge, put the badge at the frame's top-left corner; when two badges collide, move one to the top-right corner.
- Whatever the text says the system does must be visible on screen. Every point named in the caption has a mark, and a zoom slide when it is small. When the system shows it subtly (a thin dashed outline), say what it looks like.

### Animation
Animation exists to pace the explanation: one click, one new idea. It is never decoration.

Triggers and steps
- Every step starts On Click. Elements that belong to the same idea (a box and the arrow that enters it, a message and its label) start With Previous on that same click. Never chain steps with After Previous so they play by themselves; the presenter controls the pace.
- Never skip: if the caption or the note names three steps, there are three clicks, in that order, and their numbers match the badges or the labels on screen.
- Entrance effects only. No exit, emphasis, flicker or colour-change effects; nothing that appeared disappears again, so the last click shows the complete slide and the PDF export (which shows the final state) is complete too.
- Going back (previous click or previous slide) must leave the slide in a correct state; check it.

Effects, timing and when to use each

| Situation | Effect | Timing |
|---|---|---|
| Building a diagram step by step: architecture, data flow, model deployment, a pipeline. Each step adds the next box with its incoming arrow, in the direction the data flows (left to right, top to bottom) | Entrance: Fade | 0.15 s, starts immediately on the click |
| A sequence diagram (request and response between two parties) | Entrance: Fade, one message arrow with its label per step; an optional message (for example a webhook) is the last step | 0.15 s |
| A set of results that should read as appearing one after another on a single click, for example coverage circles around each extinguisher | Entrance: Zoom (grow from the centre) plus fade, staggered | 0.3 s each; the first starts at once, each next one 0.2 s later (0, 0.2, 0.4 s ...) |
| Showing that something travels, for example data moving through the pipeline once the diagram is complete | Fade in, then Motion Path along the drawn arrows | fade 0.15 s, path starts 0.15 s after the click and runs 0.85 s, so the whole step ends 1.0 s after the click; always the last step(s), after every box and arrow it travels along is visible |
| Walking through a screenshot: overview, then a close-up of each numbered mark | Slide transition: Morph, between an overview slide and one zoom slide per mark | 0.5 s. Both slides hold the same picture with the same object name and only its crop changes, so the view glides and zooms; title, captions and chrome are identical so they stay still. Fallback for older PowerPoint: Fade transition |
| The agenda | Summary/Section Zoom tiles, one per chapter | 0.5 s; clicking a tile opens that chapter and returns to the agenda at its end |

- No click step runs longer than 1 s, delays included: fades 0.15 s, zooms 0.3 s, transitions 0.5 s, a motion path 0.85 s after its 0.15 s fade. A longer path drags, most visibly on a short arrow (a token crossing 1 in in 1.5 s reads as stuck).
- One idea, one animation. Two animations (or an animation plus a Morph) never explain the same thing: an arrow that fades in and then a token that travels along it again, a Morph that brings in a fallback route and then a token that walks the same route, a note line that restates what the animation just showed ("animation 1: ..."). Choose the one carrier of each idea (the fade, the glide or the movement), draw everything else static, and keep the note column to the ideas themselves. When a step would repeat an earlier one, remove the later step instead of adding a variation.
- The slide is complete when it appears: show the whole diagram or screenshot from the start and animate only what is added or moves. A slide that starts nearly empty (only a title and one loose token) is wrong even if every click is correct, and it is what the audience sees if animations do not play.
- Zoom slides: when any mark on a screenshot needs a close-up, every mark gets its own zoom slide, in badge order, so the walkthrough never jumps from mark 1 to mark 3.

Order of steps
- Context first, then the moving parts: on a diagram, the outer container and fixed parts (the frame, the legend, the two lifelines of a sequence diagram) are visible from the start or come in step 1; boxes then appear in the order the data or the work flows.
- Follow the reading and the causal order: source before destination, request before response, cause before effect, normal flow before the exception or optional path (an optional webhook, an error case) which comes last.
- A box and the arrow that leads into it appear together; an arrow never appears before both its ends are visible.
- Movement (a motion path) is the last step, after everything it moves along is on screen.
- Numbered marks on a screenshot follow the order of use in the product (the order a user would click), or top-left to bottom-right when there is no such order; the badges, the caption list and the zoom slides use that same order.
- Staggered items on one click (coverage circles) go in a fixed spatial order, for example left to right.

How to build it
- In PowerPoint by hand:
  - Animations tab: add the entrance effect, then in the Animation Pane set Start (On Click for the first element of a step, With Previous for the rest of that step), Duration and Delay as in the table above. Check the pane lists the steps in the intended order and numbers them 1, 2, 3 without gaps.
  - Morph: duplicate the overview slide, change only the picture's crop and size on the copy, and set Transitions > Morph (Effect Options: Objects) on the copy, duration 0.50. If PowerPoint does not match the picture across the two slides, give it the same name on both, prefixed with `!!` in the Selection Pane.
  - Agenda: Insert > Zoom > Summary Zoom (or Section Zoom per tile) with sections defined first; tick Return to Zoom so each chapter returns to the agenda.
- From a generator script (pptxgenjs cannot write animations, so a post-processing step adds them to the slide XML):
  - Name each animated shape by its step: `anim-<step>-<n>` for a fade, `anim-<step>-<n>-zoom-<delay ms>` for a staggered zoom, `anim-<step>-<n>-path-<key>` for a fade plus motion path whose points are stored under `<key>`. The post-processor groups shapes by step, makes the first of each step On Click and the rest With Previous, and writes the durations above.
  - Motion paths are computed from the same coordinates the arrows are drawn with, as fractions of the slide width and height relative to the shape's start, so the token follows the arrows exactly.
  - Morph: the generator gives the picture the same object name on the overview and zoom slides and lists the zoom slides; the post-processor adds the Morph transition with a Fade fallback.
  - Agenda (verified in PowerPoint: no repair prompt, zoom-in animation plays, returns to the agenda after each chapter): every chapter starts with a chapter page (big accent number, a vertical rule, the chapter title, and the list of pages it holds); the agenda zooms into these. Write one Section Zoom per chapter, as in the user's template deck, not PowerPoint's Summary Zoom: each tile is its own `mc:AlternateContent` with `Requires="psez"` (namespace `http://schemas.microsoft.com/office/powerpoint/2016/sectionzoom`) holding a `p:graphicFrame` (`graphicFrameLocks noGrp noChangeAspect`) whose `psez:sectionZm` has one `psez:sectionZmObj sectionId="{section GUID}"` with `psez:zmPr returnToParent="1" transitionDur="500"` (ms), a `p166:blipFill` (namespace `.../powerpoint/2016/6/main`, the thumbnail) and a `p166:spPr` repeating the frame's absolute box with a 1.5 pt `#e2dfdc` line; the fallback is a `p:pic` with the same id, box and image and an `a:hlinkClick action="ppaction://hlinksldjump"` to the chapter page. The thumbnail is the rendered chapter page (render the deck once, cut those pages, rebuild). The chapter name sits in a normal text box under each tile (number in the accent colour, name bold, 22 pt). Sections go in `p:presentation/p:extLst` as `p14:sectionLst` (uri `{521415D9-36F7-43E2-AB2F-B90AF26B5E84}`), cover and agenda together in the opening section, each chapter starting with its chapter page, then the appendix; every slide in exactly one section, in order. Do not write a zoom from memory: copy the structure of a file PowerPoint or the template produced. Two attempts that failed: PowerPoint's Summary Zoom (`psuz`, one frame with all tiles, `psuz:gridLayout`) is re-laid out by PowerPoint into a centred cluster with a fixed 0.148 in gap, hiding any text placed beside the tiles; the same structure without `gridLayout` made the file need repair.
  - Takeaway text is created with animation switched off in the helper, so it can never be animated by mistake.
  - Motion path XML that PowerPoint accepts (found by saving a generated deck in PowerPoint and diffing): the fade-in of a shape has `grpId="0"` and its path effect on the same shape `grpId="1"`, with one `<p:bldP spid=".." grpId=".."/>` per (shape, group) for shapes that have a text body. With both effects on `grpId="0"` the path did not run: the token stayed at its start and was visible before the click. `presetID="0" presetClass="path"`, `path="M 0 0 L dx dy E"` (a corner adds `L x y`, and `ptsTypes` has one `A` per point), `<p:rCtr>` is the centre of the path's bounding box as an integer in 1/100000 of the slide (x="5550", never "0.0555"; a decimal is invalid and makes PowerPoint offer a repair). Two tokens on one slide are two path steps, each its own click, both after every fade.
  - Morph: one object keeps one `!!` name on every slide of a sequence (`!!screen`, `!!frame-1`, `!!badge-1`), so frames glide from mark to mark instead of fading out and in. Do not reuse a name for a different picture unless a cross-fade is wanted.

Never animated
- Title, chapter label, progress bar and footer.
- The takeaway line (accent text): it is visible from the start, because it is the slide's conclusion.
- Screenshots themselves, tables, and text-only slides: they are shown whole; the explanation goes in the caption or script.

Checks
- Play the slideshow from the first slide to the last and back: every click changes exactly one idea, in order, with no empty clicks and no skipped steps; Morph slides glide without a jump; zoom tiles return to the agenda.
- Export to PDF and confirm each animated slide shows its complete final state.
- For every picture, list the effective text size (see Layout) and fix anything under the limits before delivery.
- Contrast: compute the ratio of every text colour against the fill it sits on (the slide background, a shape or a table cell), accent text on accent-soft included; all must be 4.5:1 or more. This is why the accent is #027874: #0e827d reaches only about 3.9:1 on accent-soft (#e1efee). Check the generated XML, not the design tokens.
- Time every step from the XML: no step, delays included, ends later than 1 s after its click.
- List the animations of every slide next to the idea each one carries: an idea with two entries is a duplicate.
- List every symbol and legend entry per slide with the line on that slide that explains it; any explained only elsewhere gets a line added. List each term and abbreviation once, with the slide that defines it, and remove definitions the audience does not need.
- LibreOffice opening the file proves little: it accepts XML that PowerPoint rejects and cannot play Morph or motion paths. Validate every slide XML against the ECMA-376 schema (pml-slide.xsd; the Apache POI `ooxml-schemas` jar carries the XSDs). Then open the deck in PowerPoint, play every animated slide, and save a copy from PowerPoint: diffing that copy against the generated file shows what PowerPoint rewrote or dropped. State plainly in the hand-off what was not played.

### Redaction
- Blur or mask only what must be hidden (addresses, customer names), shaped to what is visible at capture time: when a popup covers part of the sensitive text, mask only the part left uncovered, never the popup.
- After changing a redaction, regenerate only the affected screenshots so hand retouches elsewhere are not overwritten, then zoom in on every slide that uses that screenshot.

### Checks before delivering
- Validate the file (schema, relationships) after every build and render it to PDF and images for review.
- Look at full-resolution renders of changed slides, not a scaled-down contact sheet.
- Verify review findings against the source and renders before applying them; list rejected ones with the reason.
