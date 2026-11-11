/**
 * 匯出影片用的頁面（render.html）。
 *
 * scripts/render_motion.py 用無頭瀏覽器打開這頁，並提供 window.saveFrame()。
 * 這裡用 Motion Canvas 的 Renderer 一格一格算出畫面，每一格交給 saveFrame()，
 * 由 Python 那邊接到 ffmpeg 編成 MP4。
 *
 * 影片模式下 beginSlide() 不會停，所以每一段的停頓由 motion.tsx 的 step() 補上。
 * 網址參數：scene（只輸出一個場景）、fps（預設 60）。
 */
import {Renderer, Vector2, type ExporterClass} from '@motion-canvas/core';
import fullProject from './project?project';

const params = new URLSearchParams(location.search);
const sceneName = params.get('scene');
const fps = Number(params.get('fps') ?? 60);

const project = sceneName
  ? {...fullProject, scenes: fullProject.scenes.filter(s => s.name === sceneName)}
  : fullProject;

project.logger.onLogged.subscribe(payload => {
  if (payload.level !== 'error' && payload.level !== 'warn') return; // 略過 info、debug
  const write = payload.level === 'error' ? console.error : console.warn;
  write(`[${payload.level}] ${payload.message}`, payload.stack ?? '');
});

declare global {
  interface Window {
    saveFrame?: (frame: number, dataUrl: string) => Promise<void>;
    __render?: {done: boolean; result: number | null; frames: number};
  }
}
window.__render = {done: false, result: null, frames: 0};

/** 把每一格交給 Playwright 的自訂 exporter。 */
const FrameBridge: ExporterClass = {
  id: 'frame-bridge',
  displayName: 'Frame bridge',
  meta: () => null as any,
  async create() {
    return {
      async handleFrame(canvas: HTMLCanvasElement, frame: number) {
        await window.saveFrame!(frame, canvas.toDataURL('image/png'));
        window.__render!.frames++;
      },
    };
  },
};
project.meta.rendering.exporter.exporters.push(FrameBridge);

const renderer = new Renderer(project);
renderer.onFinished.subscribe(result => {
  window.__render = {...window.__render!, done: true, result};
});

(async () => {
  try {
    await document.fonts.load('32px Inter');
  } catch {}
  await renderer.render({
    name: project.scenes[0].name,
    range: [0, Infinity],
    fps,
    size: new Vector2(1920, 1080),
    resolutionScale: 1,
    colorSpace: 'srgb',
    background: '#ffffff',
    exporter: {name: 'frame-bridge', options: null},
  });
})();
