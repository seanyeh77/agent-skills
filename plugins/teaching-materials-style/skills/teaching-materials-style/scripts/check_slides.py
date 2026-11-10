#!/usr/bin/env python3
"""Check a built Slidev deck against the teaching-materials-style slide rules.

Walks every slide and every click step with the arrow key and reports:
  outside      element runs past the slide edge
  clipped      content cut off inside a box with hidden overflow
  wrap         heading, quiz question, table header, row label, focus item or tile label on more than one line
  dim          visible text with opacity below 0.95
  small        visible text under 22 px (footer and chapter label excepted)
  table        table header smaller than its body, colored or thick-ruled table header
  size         title, code block or terminal text off the size spec (54, 31, 29 px)
  diagram      diagram or picture smaller than 70 % of the content width and height
  statement    statement sentence wrapped in a card, shadow, box or colored bar
  quiz-icon    icon or check mark on a quiz option
  symbol       special symbols (circled numbers, full-width brackets or slash, arrows, check marks)
  event-word   wording tied to one class or event

Usage:
  npx slidev build --base ./ && npx vite preview --outDir dist --port 4173 &
  python3 check_slides.py http://localhost:4173/ [--shots shots/] [--json]

Needs Playwright for Python (uv tool install playwright, or uv pip install playwright)
and a Chromium (playwright install chromium, or --chrome /path/to/chrome).
Exit code 0: no problems. 1: problems found. 2: the deck could not be checked.
"""
import argparse
import asyncio
import json
import os
import sys

from playwright.async_api import async_playwright

CHECK_JS = r"""
(n) => {
  const page = document.querySelector('.slidev-page-' + n);
  if (!page) return null;
  const S = page.getBoundingClientRect();
  const sc = S.width / 1920;
  const out = [];
  const short = (el) => (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  const cls = (el) => String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || el.tagName);
  const visible = (el) => {
    for (let e = el; e && e !== page.parentElement; e = e.parentElement) {
      const c = getComputedStyle(e);
      if (c.display === 'none' || c.visibility === 'hidden') return false;
    }
    return true;
  };
  const opacityOf = (el) => { let o = 1; for (let e = el; e && e !== page; e = e.parentElement) o *= +getComputedStyle(e).opacity; return o; };

  for (const el of page.querySelectorAll('*')) {
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || !visible(el)) continue;
    const cs = getComputedStyle(el);
    const op = opacityOf(el);
    if (op < 0.05) continue;
    if (r.right > S.right + 2 || r.bottom > S.bottom + 2 || r.left < S.left - 2) out.push(['outside', cls(el), short(el)]);
    if (['hidden', 'clip'].includes(cs.overflowX) && el.scrollWidth > el.clientWidth + 2 && !el.closest('.slidev-code')) out.push(['clipped', cls(el), short(el)]);
    const ownText = [...el.childNodes].some(c => c.nodeType === 3 && c.textContent.trim());
    if (ownText && cs.color !== 'rgba(0, 0, 0, 0)' && !cs.color.endsWith(', 0)')) {
      // dimmed code lines are the line-highlight convention, not text dimming
      if (op < 0.95 && !el.closest('.slidev-code, .shiki-magic-move-container')) out.push(['dim', 'opacity ' + op.toFixed(2), short(el)]);
      const fs = parseFloat(cs.fontSize) / sc;
      if (fs < 21.5 && !el.closest('.tb-foot, .tb-chap, .slidev-page-footer')) out.push(['small', Math.round(fs) + ' px', short(el)]);
    }
  }

  const one = 'h1, .qz-q, th, .cmp-h, .cmp-k, .fc-index li, .tile-label, .tile-value, .def-word';
  for (const el of page.querySelectorAll(one)) {
    if (!visible(el) || !el.textContent.trim()) continue;
    // count rendered text lines, not box height (grid rows stretch cells)
    const range = document.createRange();
    range.selectNodeContents(el);
    const fsPx = parseFloat(getComputedStyle(el).fontSize);
    const bottoms = [...range.getClientRects()].filter(r => r.width > 1).map(r => r.bottom).sort((a, b) => a - b);
    let lines = bottoms.length ? 1 : 0;
    for (let i = 1; i < bottoms.length; i++) if (bottoms[i] - bottoms[i - 1] > fsPx * 0.8) lines++;
    if (lines > 1) out.push(['wrap', cls(el), short(el)]);
  }

  for (const t of page.querySelectorAll('table, .cmp')) {
    const head = t.querySelector('th, .cmp-h');
    const body = t.querySelector('td, .cmp-v');
    if (!head || !body) continue;
    const hs = getComputedStyle(head), bs = getComputedStyle(body);
    if (parseFloat(hs.fontSize) < parseFloat(bs.fontSize) - 6) out.push(['table', 'header ' + Math.round(parseFloat(hs.fontSize) / sc) + ' px < body ' + Math.round(parseFloat(bs.fontSize) / sc) + ' px', short(head)]);
    for (const h of t.querySelectorAll('th, .cmp-h')) {
      const c = getComputedStyle(h);
      const m = c.backgroundColor.match(/\d+/g);
      if (m && m.length >= 3 && (m.length < 4 || +m[3] > 0)) {
        const [r, g, b] = m.map(Number);
        if (Math.max(r, g, b) - Math.min(r, g, b) > 24) out.push(['table', 'colored header ' + c.backgroundColor, short(h)]);
      }
      for (const side of ['Top', 'Bottom']) if (parseFloat(c['border' + side + 'Width']) > 1.5 / sc + 0.5) out.push(['table', 'thick header rule ' + c['border' + side + 'Width'], short(h)]);
    }
  }

  if (page.querySelector('.slidev-layout.tb-statement, .slidev-layout.statement')) {
    const b = page.querySelector('.st-body') || page.querySelector('.slidev-layout');
    const c = getComputedStyle(b);
    if (c.boxShadow !== 'none' || parseFloat(c.borderLeftWidth) > 0 || (c.backgroundColor !== 'rgba(0, 0, 0, 0)' && b.classList.contains('st-body')))
      out.push(['statement', 'card, shadow or bar around the sentence', short(b)]);
  }
  // sizes from the spec (px on the 1920 canvas): title 54, code 31, terminal 29
  const lay = page.querySelector('.slidev-layout');
  const content = lay && !/tb-(cover|section|statement|end|bento|obj)\b/.test(lay.className);
  const spec = [[content ? '.slidev-layout > h1, .tb-head > h1, .tb-title > h1' : null, 54, 'title'], ['.slidev-code', 31, 'code'], ['.term-body', 29, 'terminal']];
  for (const [sel, want, name] of spec) {
    if (!sel) continue;
    const el = [...page.querySelectorAll(sel)].find(e => e.getBoundingClientRect().width && visible(e));
    if (!el) continue;
    const got = parseFloat(getComputedStyle(el).fontSize) / sc;
    if (Math.abs(got - want) > 2.5 && !(name !== 'title' && got < want && el.dataset.fit)) out.push(['size', name + ' ' + Math.round(got) + ' px, spec ' + want + ' px', short(el)]);
  }
  // diagrams fill the content area: at least 70 % of its width (1760 px) or of its height (720 px)
  for (const d of page.querySelectorAll('svg, img')) {
    if (d.closest('.acp-wrap, .slidev-nav, button') || (d.parentElement && d.parentElement.closest('svg'))) continue;
    const r = d.getBoundingClientRect();
    const w = r.width / sc, h = r.height / sc;
    if (w < 300 || !visible(d)) continue;
    if (w < 1760 * 0.7 && h < 720 * 0.7) out.push(['diagram', Math.round(w) + ' x ' + Math.round(h) + ' px, under 70 % of the content area', d.getAttribute('src') || 'svg']);
  }
  if (page.querySelector('.qz-opt svg, .qz-check')) out.push(['quiz-icon', '', '']);
  const txt = page.innerText || '';
  const sym = txt.match(/[①-⑳❶-❿（）／→←✓✔✅]/g);
  if (sym) out.push(['symbol', [...new Set(sym)].join(' '), '']);
  const ev = txt.match(/本課程|學員|講師|助教|休息 ?\d+ ?分鐘|今天 ?\d+ ?小時/);
  if (ev) out.push(['event-word', ev[0], '']);
  return out;
}
"""


async def run(base, shots, chrome, settle):
    problems = {}
    async with async_playwright() as p:
        kw = {'executable_path': chrome} if chrome else {}
        browser = await p.chromium.launch(**kw)
        pg = await browser.new_page(viewport={'width': 1920, 'height': 1080})
        await pg.goto(base.rstrip('/') + '/#/1', wait_until='networkidle')
        await pg.evaluate("try { localStorage.setItem('deck-transition', 'none') } catch (e) {}")
        await pg.reload(wait_until='networkidle')
        await pg.wait_for_timeout(settle)
        n, guard = 1, 0
        while guard < 3000:
            guard += 1
            res = await pg.evaluate(CHECK_JS, n)
            if res is None:
                print(f'slide {n}: not found', file=sys.stderr)
                return None
            url = pg.url
            click = url.split('clicks=')[1] if 'clicks=' in url else '0'
            for item in res:
                key = (n, item[0], item[1], item[2])
                problems.setdefault(key, click)
            if shots:
                await pg.screenshot(path=os.path.join(shots, f's{n:03d}_{click}.png'))
            await pg.keyboard.press('ArrowRight')
            await pg.wait_for_timeout(settle)
            new = pg.url
            if new == url:
                break
            m = new.split('#/')[1].split('?')[0]
            n = int(m) if m.isdigit() else n
        await browser.close()
    return problems


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('url', help='address of the built deck, for example http://localhost:4173/')
    ap.add_argument('--shots', help='folder for a screenshot of every slide and click')
    ap.add_argument('--chrome', help='path to a Chrome or Chromium binary')
    ap.add_argument('--settle', type=int, default=900, help='wait after each step in ms (default 900)')
    ap.add_argument('--json', action='store_true', help='print the problems as JSON')
    a = ap.parse_args()
    if a.shots:
        os.makedirs(a.shots, exist_ok=True)
    try:
        problems = asyncio.run(run(a.url, a.shots, a.chrome, a.settle))
    except Exception as e:  # noqa: BLE001
        print(f'could not check the deck: {e}', file=sys.stderr)
        sys.exit(2)
    if problems is None:
        sys.exit(2)
    rows = [{'slide': k[0], 'click': v, 'kind': k[1], 'detail': k[2], 'text': k[3]} for k, v in sorted(problems.items())]
    if a.json:
        print(json.dumps(rows, ensure_ascii=False, indent=1))
    else:
        for r in rows:
            print(f"slide {r['slide']:>3} click {r['click']:>2}  {r['kind']:<10} {r['detail']}  {r['text']}")
        print(f'{len(rows)} problem(s)')
    sys.exit(1 if rows else 0)


if __name__ == '__main__':
    main()
