#!/usr/bin/env python3
"""Check a built Motion Canvas animation step by step.

Opens the player page (templates/motion-canvas, built with `npm run build`),
plays every step to its end, and for each step:

  - saves a screenshot of the canvas at 1920 x 1080 (with --shots)
  - runs the layout audit from src/audit.ts: text outside the canvas, text
    overflowing its box, overlapping text, text under 24 px
  - collects console errors and uncaught exceptions

Usage:
  npm run build && npx vite preview --outDir dist --port 4174 &
  python3 check_motion.py http://localhost:4174/ [--scene jobFlow] [--shots shots/]

Exits with 1 when anything is reported, 0 when every step is clean.
Needs Playwright for Python and a Chromium.
"""
import argparse
import base64
import hashlib
import re
import sys
import time
from pathlib import Path
from urllib.parse import urlencode, urlparse, urlunparse, parse_qsl

from playwright.sync_api import sync_playwright

FONT_HOSTS = re.compile(r"https://fonts\.(googleapis|gstatic)\.com/")
STABLE_MS = 400      # the canvas must stay unchanged this long to count as settled
STEP_TIMEOUT = 30.0  # seconds to wait for one step to finish


def with_query(url: str, **extra) -> str:
    parts = urlparse(url)
    query = dict(parse_qsl(parts.query))
    query.update({k: v for k, v in extra.items() if v is not None})
    return urlunparse(parts._replace(query=urlencode(query)))


def canvas_hash(page) -> str:
    data = page.evaluate(
        "() => document.querySelector('#stage canvas').toDataURL('image/png')"
    )
    return hashlib.md5(data.encode()).hexdigest()


def wait_settled(page, stage: int, count: int, label: str) -> None:
    """Wait until the animation reaches `stage` and the canvas stops changing.

    Stage 0 is the opening, paused at the first beginSlide; stage k is the end of
    the segment after the k-th beginSlide, so stage `count` is the end of the scene.
    """
    stable_ms = STABLE_MS if stage < count else 1000
    deadline = time.time() + STEP_TIMEOUT
    last, since = None, time.time()
    while time.time() < deadline:
        info = page.evaluate("() => window.__motion.info")
        current = page.evaluate("() => window.__motion.stage")
        h = canvas_hash(page)
        if h != last:
            last, since = h, time.time()
        arrived = current == stage and (info["isWaiting"] or stage == count)
        if arrived and (time.time() - since) * 1000 >= stable_ms:
            return
        page.wait_for_timeout(100)
    raise TimeoutError(f"{label}: did not settle within {STEP_TIMEOUT:.0f} s")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("url", help="player page, for example http://localhost:4174/")
    ap.add_argument("--scene", help="check only this scene")
    ap.add_argument("--shots", type=Path, help="folder for one screenshot per step")
    args = ap.parse_args()

    problems: list[str] = []
    errors: list[str] = []

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1920, "height": 1200})
        warnings: list[str] = []
        # A web font that cannot be fetched (offline, blocked network) is only a
        # warning: the page falls back to a locally installed copy if there is one.
        page.on("requestfailed", lambda r: FONT_HOSTS.search(r.url) and warnings.append(f"font not loaded: {r.url}"))
        page.on("console", lambda m: m.type == "error" and not m.text.startswith("Failed to load resource") and errors.append(m.text))
        page.on("requestfailed", lambda r: not FONT_HOSTS.search(r.url) and errors.append(f"request failed: {r.url}"))
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(with_query(args.url, scene=args.scene), wait_until="networkidle")
        page.wait_for_function("() => window.__motion && window.__motion.slides.length > 0", timeout=20000)

        slides = page.evaluate("() => window.__motion.slides")
        count = len(slides)
        print(f"{count} steps after the opening: {', '.join(slides)}")
        if args.shots:
            args.shots.mkdir(parents=True, exist_ok=True)

        for stage in range(count + 1):
            name = "start" if stage == 0 else slides[stage - 1].split(":")[-1]
            label = f"step {stage} of {count} ({name})"
            if stage > 0:
                page.evaluate("() => window.__motion.next()")
            try:
                wait_settled(page, stage, count, label)
            except TimeoutError as e:
                problems.append(str(e))
                continue
            for issue in page.evaluate("() => window.__motion.audit()"):
                other = f" / {issue['other']}" if issue.get("other") else ""
                problems.append(f"{label}: {issue['kind']}: {issue['text']!r}{other} {issue['detail']}")
            if args.shots:
                data = page.evaluate(
                    "() => document.querySelector('#stage canvas').toDataURL('image/png')"
                )
                out = args.shots / f"{stage:02d}-{name}.png"
                out.write_bytes(base64.b64decode(data.split(",", 1)[1]))
            print(f"ok   {label}")
        fonts_ok = page.evaluate("() => document.fonts.check('32px Inter')")
        browser.close()

    for w in warnings:
        print(f"warning: {w}")
    if not fonts_ok:
        problems.append("Inter is not available: text was measured with a fallback font")

    for e in errors:
        problems.append(f"console: {e}")
    if problems:
        print(f"\n{len(problems)} problem(s):")
        for line in problems:
            print(f"  {line}")
        return 1
    print("\nall steps clean")
    return 0


if __name__ == "__main__":
    sys.exit(main())
