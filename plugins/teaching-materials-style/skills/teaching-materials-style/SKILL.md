---
name: teaching-materials-style
description: SeanYeh's house style for any slide deck, document, note or diagram (talks, reports, proposals, technical docs, teaching). Use for Slidev decks, Notion or other docs, and diagrams in any tool.
---

# Presentation and document style

One style guide for every deck, document and diagram SeanYeh makes, whatever the purpose: teaching, talks, project reports, proposals, competition write-ups, technical notes. Read the section that matches the output; diagrams inside docs or slides also follow the Diagrams section.

- Documents and notes (Notion or similar) → section 1
- Slide decks → section 2
- Diagrams, in any tool → section 3

Throughout, "audience" means whoever reads or watches: students, reviewers, teammates, judges.

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
- To publish a deck as a Claude artifact: build with `--base ./` and routerMode hash, delete `_redirects` and `404.html` from the build, publish every file of `dist/`, and check it once inside the viewer with a forced dark host theme.
- A host page (for example the artifact viewer) may set a dark theme on `<html>`, which overrides tokens defined at `:root`. Pin the deck's tokens and the `--tb-*` mapping on `body, #app`, imported after the theme CSS, and check the deck once with a forced dark host theme.
- Page transitions stay off unless asked for. When a deck uses them: chrome (progress bar, chapter label, footer) stays still, the screen never goes blank and the two pages are never both half transparent (the new page fades in over the opaque old one), text snapshots keep their natural size instead of being stretched, and `prefers-reduced-motion` turns every transition off.
- Viewers choose the accent color in every deck: a color dot at the right end of the Slidev nav bar opens a popover with the design system's 8 preset swatches and a hex field (accepts the code with or without #, explains a wrong format), plus the page-transition choice when the deck has transitions. The default is teal #0f766e for the teaching theme and blue #2457d6 for the UI variant. The choice is stored under the design system's `ui-accent` key, and every derived color (hover, pressed, soft, focus, readable accent text) follows the design system's accent derivation, so a light accent never makes text unreadable. The popover works by keyboard (Tab to the dot, Enter opens, arrow keys move within each radio group, Esc closes and returns focus) without breaking arrow-key navigation, stays inside the window at 390 px wide, and is hidden in print and export.

### Palette and fonts (hybrid preset of the design system)
- Decks use the "teaching" preset of seanyeh77/ui-design-system, chosen as the hybrid option: neutrals and fonts come from the design system, while the accent (teal by default), sharp corners and thin borders stay from the slide style. Deck CSS reads the design-system token names (--bg, --surface, --surface-sub, --ink, --ink-muted, --line, --line-strong, --accent, --accent-soft, --radius-sm, --radius-md, --font-sans, --font-mono) and never hard-codes these values; the preset supplies them.
- Values: bg #fcfbfb, surface #ffffff, code and terminal-bar background (surface-sub) #f6f5f4, ink #171512, muted (ink-muted) #6d645a, rules (line) #e2dfdc, heavy rules and dividers #171512, accent #0f766e teal by default (chapter labels, progress bar, list markers, note border, correct answers), accent-soft #e3f2ef by default (highlighted code lines, soft fills), inactive focus-index items in ink-muted.
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
- Outer container #aeacac, inner node container #e7e7e7, service boxes #adf0c7, bars and storage #6eea9e. In slides the deck's accent color (teal #0f766e by default) may highlight one element per step.
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