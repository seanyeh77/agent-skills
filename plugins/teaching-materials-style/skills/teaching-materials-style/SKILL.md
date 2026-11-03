---
name: "teaching-materials-style"
description: "Use for any teaching or technical material for SeanYeh: Notion notes and docs, Slidev slide decks, and diagrams drawn in any tool (Miro, Python, SVG, Mermaid, Figma)."
---

# Teaching materials style

One style guide for three kinds of output. Read the section that matches the task; diagrams inside docs or slides also follow the Diagrams section.

- Notion docs and notes → section 1
- Slide decks → section 2
- Diagrams, in any tool → section 3

---

## 1. Notion docs and notes

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
- Write for a zero-background reader.

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

---

## 2. Slide decks (Slidev, Textbook theme)

Applies to any teaching deck, whatever the topic. Reference implementation: github.com/seanyeh77/docker-workshop (slides/: layouts, components, styles); reuse its layouts and components for a new deck.

### Setup
- Slidev, custom "Textbook" theme, light backgrounds only (dark styles such as terminal or blueprint were rejected).
- Canvas 1920 x 1080, routerMode hash, transition none, drawings disabled, `titleTemplate: '%s'`.
- Deploy with GitHub Pages via GitHub Actions (`slidev build --base /<repo>/`).

### Palette and fonts
- Ink #20262e, muted #66707c, accent teal #0f766e (chapter labels, progress bar, list markers, note border, correct answers), rules #e2e5e9, code background #f5f8f8.
- Titles: Literata + Noto Sans TC, weight 600. Body: Source Sans 3 + Iansui. Code: IBM Plex Mono + Iansui.
- Sizes (px): title 54, body and lists 40, definitions 40, quiz options 35, cards 33, compare tables 34, step text 30, right-side note 30, code blocks 31, terminal 29, footer 18, chapter label 19.

### Fixed elements on every slide
- 7 px teal progress bar at the top.
- Uppercase teal chapter label top-left, with a gap below it.
- Footer rule: deck title on the left, page / total on the right.
- Optional small tag top-right naming the file or language (Dockerfile, Terminal).

### Titles and wording
- Titles never centered. Default top-left, content centered in the remaining space; on some slides the title sits right above the content. Section dividers centered horizontally: large teal chapter number, subsections on the right.
- Titles concise and formal, never colloquial, never questions. Jokes and analogies go in the body, dialogue boxes or speaker notes.
- All on-slide text (item titles, body, note column, takeaways, tables) uses formal written wording, not vivid colloquial phrases ("版本衝突", not "版本會打架").

### Layout
- One concept per slide: title plus one component. Per-click explanations in the right-side note column (330 px, teal left border, NOTE label); full talk script in speaker notes.
- Layouts: cover; section divider; objectives (01/02/03); focus slide for a set of items; statement; definition (term left, meaning and example right); two-column compare table; quiz; figure with a one-line teal takeaway; reference table; Bento grid for section and final summaries; end slide naming the next topic.
- Never lay several cards, pain points or steps side by side in a horizontal row. Use the focus method: a vertical index on the left with the current item highlighted, one item shown large on the right, advancing on click.
- Boxes and code frames sharp-cornered with 1.5 to 2 px borders.

### Animation
- Magic Move, line highlight, terminal typing, code-to-diagram sync, before/after diff, annotated commands; step-by-step diagrams carry "Step x of y" and a caption.
- Terminal typing is fast: about 15 ms per character, long commands done within about 0.8 s.
- Never animate the same content twice: if one slide reveals a file line by line with explanations, later slides show it all at once.
- No countdown timers on break slides.

### Questions
- No Slido. Questions sit on the slide as a quiz (A/B/C/D) and the audience votes by show of hands.
- The next click reveals the answer: correct option turns teal and a short explanation fades in.
- Each question sets up content that comes later (a later demo or chapter verifies it); never a throwaway or joke question.

### Flow
- Avoid abrupt jumps between consecutive slides; add or reorder a bridging slide.

### Checks before publishing
- Code and text never run past the slide, a box edge or into the note column; long terminal lines shrink to fit.
- Check every slide at every click step with the real fonts loaded (headless browser: scrollWidth vs clientWidth, element bounds vs the slide), and look at screenshots of changed slides.
- Commands shown on slides must actually run; verify them when possible and keep example output faithful to current versions.

---

## 3. Diagrams (any tool)

Applies whether the diagram is drawn in Miro, generated with Python (matplotlib, graphviz, diagrams), written as SVG or Mermaid, or made in Figma. Pick the tool that fits the destination; the look stays the same.

### Boxes and colors
- Sharp-cornered boxes, border #1a1a1a width 2, text #1a1a1a (24 px at a 1920 px wide canvas, scale proportionally elsewhere).
- Outer container #aeacac, inner node container #e7e7e7, service boxes #adf0c7, bars and storage #6eea9e. In slides the accent teal #0f766e may highlight one element per step.
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