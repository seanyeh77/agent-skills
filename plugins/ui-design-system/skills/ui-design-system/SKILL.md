---
name: ui-design-system
description: SeanYeh's web UI design system (seanyeh77/ui-design-system). Use for any web page, frontend, dashboard, admin panel, tool UI or HTML artifact he asks for, and when changing that repo.
---

# SeanYeh's UI design system

The source of truth is the repo `seanyeh77/ui-design-system` and its docs site. Do not invent a new palette, font set or component style. This skill gives the core rules and tells you where the full rules live. When this file and the repo disagree, the repo wins. The master copy of this skill is `plugins/ui-design-system/skills/ui-design-system/SKILL.md` in `seanyeh77/agent-skills`.

- Docs site with live previews: https://seanyeh77.github.io/ui-design-system/
- Index of every published file (read this first): https://seanyeh77.github.io/ui-design-system/llms.txt
- Agent instructions: https://seanyeh77.github.io/ui-design-system/AGENTS.md

## When it applies

- Any web UI: pages, dashboards, settings pages, login pages, internal tools, React or plain HTML, HTML artifacts and page mockups. Use it unless SeanYeh asks for a different look.
- Not for Notion docs or teaching diagrams: those follow the `teaching-materials-style` skill.
- Slidev decks use the "teaching" theme preset, defined as the hybrid option SeanYeh chose: the design system's warm-gray neutrals (bg #fcfbfb, surface #ffffff, surface-sub #f6f5f4, ink #171512, ink-muted #6d645a, line #e2dfdc) and fonts (Inter + Noto Sans TC for titles and body, Geist Mono for code), combined with the slide style's teal accent `#0f766e` (accent-soft #e3f2ef), radius 0 px, no shadows, 1.5 px borders, light only. Deck CSS reads the token names; the preset supplies the values. Layout, sizes and slide rules still come from `teaching-materials-style`. The preset is built: `data-theme="teaching"` in `tokens.css`, defined under `presets` in `tokens/tokens.json`; never hard-code its values in a deck.

## How to use it

1. Fetch `llms.txt`, then `AGENTS.md` and `md/guidelines.md`. Before using a component, fetch its `md/<Name>.md`. Fetch `md/layout.md` for page structure and `md/motion.md` for animation.
2. Load the published CSS and JS instead of re-creating values:

```html
<link rel="stylesheet" href="https://seanyeh77.github.io/ui-design-system/dist/fonts.css">
<link rel="stylesheet" href="https://seanyeh77.github.io/ui-design-system/dist/tokens.css">
<link rel="stylesheet" href="https://seanyeh77.github.io/ui-design-system/dist/bundle.css">
<script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
<script src="https://seanyeh77.github.io/ui-design-system/dist/bundle.js"></script>
```

   Projects with a build step (Vite and similar): install the ES module package, `npm i react react-dom github:seanyeh77/ui-design-system#<commit or tag>` (name `@seanyeh77/ui`, React 18 or 19 as peer dependencies; on npm once published). Import `@seanyeh77/ui/fonts.css`, `tokens.css` and `bundle.css`, then the components by name: `import { Button } from '@seanyeh77/ui'`. Fonts are self-hosted, so pages work offline.
3. Use components from `window.UI` (props in `dist/index.d.ts`) instead of hand-building them. Call `UI.initTheme()` once; `UI.setTheme('light' | 'dark' | 'auto')`, `UI.setAccent(hex)`. Icons: `h(UI.Icon, { name: 'house' })` with Phosphor names.
4. Your own CSS uses token variables (`var(--surface)`, `var(--space-4)`, `var(--radius-md)`), never raw values that have a token.
5. If the docs site cannot be reached (sandboxed session, no network), say so, build from the fallback below, and write the same token names as CSS variables so the page can switch to `tokens.css` later.

## Core rules

- Look: warm-gray neutrals, one blue accent `#2457d6` (user-adjustable), compact density, soft shadows instead of borders for cards, medium radii. Light and dark themes, auto follows `prefers-color-scheme`; root gets `data-theme="light"` or `"dark"`.
- Type: Inter + Noto Sans TC for text, Geist Mono only for numbers, codes and small labels. Body 16 px, line height 1.65, scale 1.25, headings weight 700. Tabular numbers in tables.
- Controls: height 40 px, touch target 48 px (inputs are 48 px tall under 600 px wide). Primary button solid accent, at most one per section; secondary outlined; danger solid red and always confirmed in a Dialog. Button labels are verbs only. Never a native `<select>`: custom menu, with search above 8 options. Labels above fields, required fields get a red asterisk, forms are two columns from 960 px.
- Layout: dashboards use a collapsible sidebar (240 px, 72 px collapsed) plus top bar; showcase pages use top navigation only. 12-column grid, 32 px section gaps, bottom tab bar on phones. Breakpoints 600, 960, 1280 px. The sidebar collapse button sits bottom-left and shows an icon only.
- Headings and table headers never wrap.
- Icons: Phosphor, 2 px stroke, 20 px; the selected state switches to the filled icon.
- Tables: gray bold sticky header, 48 px rows, zebra plus grid lines, numbers right-aligned with the unit after each number, sort arrows and row checkboxes appear on hover, page numbers for paging, rows become cards on phones.
- Feedback: skeletons shown immediately while loading; toasts bottom-right, 3 s, with Undo; dialogs centered, 400 px, blurred backdrop, secondary button left and primary right.
- Formats: dates `2026/11/04（三）`, relative time within a week, 24-hour clock; amounts `NT$ 1,280`; file sizes `186 KB`, `54.9 MB`; large numbers are abbreviated (萬, 億) only in KPI cards. Use `UI.format` and `UI.t()`.
- Copy: Traditional Chinese UI text; error messages state the cause and the fix. Only the point, in formal written wording: explanations at most 2 short sentences, nothing the screen already shows is said again, the same thing is said once, no question-style titles or links (「重看導覽」, not 「第一次使用？重看導覽」; confirm dialog titles may ask), common English terms kept and explained with `UI.Term`, long explanations moved to a linked doc.
- Motion: hover 150 ms, tabs and switches 300 ms, theme change 350 ms, entrance 700 ms staggered 90 ms; tab and sidebar indicators move with a stretching "droplet" effect.
- Source code with line numbers: `UI.CodeView`. Component architecture: `UI.LayerGraph` (layers, shared components listed below, line width by calls, inferred relations dashed). Other box-and-arrow diagrams: the `ui-graph-*` classes with `UI.GraphDefs` and `UI.GraphLegend`. In trees, label only the exceptional relations and explain the default once.
- Tables, filters, overlays, forms, data viz, tree lists and page templates have fixed choices: follow the component README instead of re-deciding them.
- Items marked 看情況 in the docs are situational, not rules: pick the option the README's condition calls for (for example `TreeList expand: 'single'` when folders are many and messy) and say which you picked.

## Before you finish

Check the page against this list, at 390 px and 1280 px wide, in light and dark. Take a screenshot if you can.

In a clone of the repo, `python3 scripts/check_page.py <file or URL> --shots shots/` does the automatic part (console errors, overflow at 390 px, touch targets under 48 px) and exits with 1 when something fails; look at the screenshots for the rest.

- Components: wherever `window.UI` has a component for the job, it is used and its README was read. Nothing is hand-built that a component already covers.
- Fonts: Geist Mono only on numbers, code, file paths and IDs, never on a Chinese sentence or a whole meta line.
- Sizes: body text is one size; secondary text is one step smaller. No ad-hoc sizes for a single row.
- Wrapping: no label, heading, table header, tab or button text wraps. Widen it, shorten it, or truncate with an ellipsis and a tooltip.
- Markdown: rendered, never shown raw. No visible backticks, asterisks or `#`; code inside a sentence uses the inline code style.
- Text: only the point, in formal written Chinese. Explanations are at most 2 short sentences; nothing the screen already shows is said again; no question-style titles or links. See 文字語氣 in `docs/guidelines.md`.
- Cards: no card inside a card (one shadow per block). Blocks use `UI.Card`; TreeList, KpiCard, Alert and SettingsSection are already cards and lose their shadow inside `UI.Card`.
- Titles: the page title appears once, in the top bar or as the page heading, not both.
- Links: file paths, line references, IDs and anything else that points somewhere are links.
- Status: shown with `UI.Badge` or the component's own status style, never by color alone.
- Long lists of results: items that need attention (errors, to confirm) come first or can be filtered from the summary.
- Phones: nothing overflows the screen; long text is left-aligned; touch targets are at least 48 px (components get this automatically on touch screens; text links inside a sentence are exempt).

## Fallback tokens

Use only when the published files cannot be loaded. Values are light / dark.

| Token | Light | Dark |
|---|---|---|
| bg | #fcfbfb | #2f2a25 |
| surface | #ffffff | #393530 |
| surface-sub | #f6f5f4 | #443f3b |
| ink | #171512 | #f6f5f4 |
| ink-muted | #6d645a | #b3aba2 |
| line | #e2dfdc | #4c4844 |
| line-strong | #8c8073 | #8c8073 |
| accent | #2457d6 | #2457d6 |
| accent-hover | #204dbc | #204dbc |
| accent-text | #2457d6 | #819ee7 |
| accent-soft | #e5ebfa | #2d344c |
| success / -text | #1ca655 / #14743b | #1ca655 / #82cea2 |
| warning / -text | #d68710 / #965f0b | #d68710 / #e8bd7c |
| danger / -text | #cd2823 / #901c19 | #cd2823 / #e48986 |
| chart-1, 2, 3 | #2457d6, #0f9d8a, #cf6a12 | #819ee7, #3cc4ae, #f0a35e |

Spacing (px): space-1 4, space-2 8, space-3 12, space-4 16, space-5 20, space-6 24, space-8 32, space-12 48. Radius (px): sm 6, chip 8, md 10, lg 14. Type (px, size / line height): h1 39/48, h2 31/40, h3 25/32, h4 20/28, body 16/1.65, small 13/20.

## Changing the design system

Work in a clone of `seanyeh77/ui-design-system` and follow its `AGENTS.md`: edit `tokens/tokens.json` then run `python3 scripts/build_tokens.py`; components live in `dist/bundle.js` and `dist/bundle.css` with docs in `components/<Name>/README.md`; after changing them run `python3 scripts/ui_keys.py --write` and `python3 scripts/build_esm.py` (CI checks both); record only choices SeanYeh confirmed in `docs/guidelines.md` and `docs/decisions.md`.

New design decisions are SeanYeh's: he picks them from option labs with a live demo for every choice. Propose options instead of changing tokens, rules or component behavior on your own, and flag any default you pick as yours. Commits never carry Claude co-author or Claude-Session trailers.