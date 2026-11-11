#!/usr/bin/env python3
"""Render a built Motion Canvas animation to an MP4 file.

Opens render.html of the build (templates/motion-canvas, `npm run build`) in a
headless Chromium. The page runs Motion Canvas's Renderer frame by frame and
hands every frame to this script, which pipes it into ffmpeg (H.264, yuv420p,
so it plays everywhere, including PowerPoint and QuickTime).

In a video the animation does not stop at beginSlide; step() in
src/components/motion.tsx holds each step for a moment instead, and the last
frame is held for --tail seconds.

Usage:
  npm run build && npx vite preview --outDir dist --port 4174 &
  python3 render_motion.py http://localhost:4174/render.html out.mp4 [--scene jobFlow] [--fps 60]

Needs Playwright for Python, a Chromium and ffmpeg.
"""
import argparse
import base64
import subprocess
import sys
import time
from urllib.parse import urlencode, urlparse, urlunparse, parse_qsl

from playwright.sync_api import sync_playwright


def with_query(url: str, **extra) -> str:
    parts = urlparse(url)
    query = dict(parse_qsl(parts.query))
    query.update({k: str(v) for k, v in extra.items() if v is not None})
    return urlunparse(parts._replace(query=urlencode(query)))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("url", help="render page, for example http://localhost:4174/render.html")
    ap.add_argument("output", help="MP4 file to write")
    ap.add_argument("--scene", help="render only this scene")
    ap.add_argument("--fps", type=int, default=60)
    ap.add_argument("--tail", type=float, default=2.0, help="seconds to hold the last frame (default 2)")
    ap.add_argument("--crf", type=int, default=18, help="H.264 quality, lower is better (default 18)")
    args = ap.parse_args()

    ffmpeg = subprocess.Popen(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-f", "image2pipe", "-framerate", str(args.fps), "-c:v", "png", "-i", "-",
            "-vf", f"tpad=stop_mode=clone:stop_duration={args.tail}",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", str(args.crf),
            "-preset", "medium", "-movflags", "+faststart",
            args.output,
        ],
        stdin=subprocess.PIPE,
    )

    errors: list[str] = []
    frames = 0
    expected = 0

    def save_frame(frame: int, data_url: str) -> None:
        nonlocal frames, expected
        if frame != expected:
            errors.append(f"frame {frame} arrived, expected {expected}")
        expected = frame + 1
        ffmpeg.stdin.write(base64.b64decode(data_url.split(",", 1)[1]))
        frames += 1
        if frames % args.fps == 0:
            print(f"\r{frames} frames ({frames / args.fps:.0f} s)", end="", flush=True)

    started = time.time()
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.on("console", lambda m: m.type == "error" and not m.text.startswith("Failed to load resource") and errors.append(m.text))
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.expose_function("saveFrame", save_frame)
        page.goto(with_query(args.url, scene=args.scene, fps=args.fps))
        page.wait_for_function("() => window.__render && window.__render.done", timeout=0, polling=500)
        result = page.evaluate("() => window.__render.result")
        browser.close()

    ffmpeg.stdin.close()
    ffmpeg.wait()
    print(f"\r{frames} frames + {args.tail:g} s hold at the end, {frames / args.fps + args.tail:.1f} s of video, rendered in {time.time() - started:.0f} s")

    if result != 0:
        errors.append(f"renderer finished with result {result} (0 success, 1 error, 2 aborted)")
    if ffmpeg.returncode != 0:
        errors.append(f"ffmpeg exited with {ffmpeg.returncode}")
    if errors:
        print("problems:")
        for e in errors:
            print(f"  {e}")
        return 1
    print(f"wrote {args.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
