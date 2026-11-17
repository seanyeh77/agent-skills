/**
 * 建置版的播放頁：把專案包成一頁可以逐段播放的網頁。
 *
 * 同一頁有兩種模式，由網址參數決定：
 *
 *   index.html                       獨立頁：下方有按鈕列，鍵盤可以操作
 *   index.html?embed=1&scene=jobFlow 嵌入模式：給 Slidev 的 iframe 用，
 *                                    沒有按鈕列，由外層用 postMessage 控制
 *
 * scene 參數兩種模式都能用，只播放指定的場景；不給就依序播放全部場景。
 */
import {Presenter, Vector2} from '@motion-canvas/core';
// `?project` 由 Motion Canvas 的 vite 外掛處理：它會用 bootstrap() 把 project.ts
// 的設定包成完整的專案（補上 logger、plugins、settings）。
// 直接 import './project' 會少掉這一步，播放時一出錯就會整個停住。
import fullProject from './project?project';
import {audit} from './audit';

const params = new URLSearchParams(location.search);
const embedded = params.has('embed');
const sceneName = params.get('scene');

// 只保留指定的場景。project 是一般物件，複製一份再換掉 scenes 即可。
const project = sceneName
  ? {...fullProject, scenes: fullProject.scenes.filter(s => s.name === sceneName)}
  : fullProject;
if (project.scenes.length === 0) {
  throw new Error(`No scene named "${sceneName}"`);
}

const presenter = new Presenter(project);

// Motion Canvas 的錯誤預設只送到它自己的 logger，編輯器才看得到。
// 這一行把它接到 console，場景出錯時在瀏覽器就看得到原因。
project.logger.onLogged.subscribe(payload => {
  if (payload.level !== 'error' && payload.level !== 'warn') return; // 略過 info、debug
  const write = payload.level === 'error' ? console.error : console.warn;
  write(`[${payload.level}] ${payload.message}`, payload.stack ?? '');
});

document.body.classList.toggle('embed', embedded);
const stage = document.getElementById('stage') as HTMLDivElement;
stage.appendChild(presenter.stage.finalBuffer);

const prev = document.getElementById('prev') as HTMLButtonElement;
const next = document.getElementById('next') as HTMLButtonElement;
const replay = document.getElementById('replay') as HTMLButtonElement;
const stepText = document.getElementById('step') as HTMLSpanElement;

interface Info {
  currentSlideId: string | null;
  isWaiting: boolean;
  index: number | null;
  count: number;
}
let info: Info = {currentSlideId: null, isWaiting: false, index: 0, count: 0};
let slideIds: string[] = [];

presenter.onSlidesChanged.subscribe(slides => {
  slideIds = slides.map(s => s.id);
});

/**
 * 目前播到第幾段，0 到 count。
 *
 * 0 是開場畫完、停在第一個 beginSlide 的狀態；第 k 段是第 k 個 beginSlide
 * 之後那段動畫播完的狀態，所以最後一段（count）是整個場景播完。
 * Presenter 的 index 停在 beginSlide 上，播放中或播完時要加一。
 */
let introDone = false;
const stageOf = (i: Info) => (introDone ? (i.index ?? 0) + (i.isWaiting ? 0 : 1) : 0);

/** 跳到第 k 個 beginSlide 之後，等它停好再播放那一段（重播用）。 */
let pendingPlay: number | null = null;
function playSegment(k: number) {
  pendingPlay = k;
  presenter.requestSlide(slideIds[k]);
}

presenter.onInfoChanged.subscribe(value => {
  info = value as Info;
  // 開場動畫播放中也算第 0 段
  if (info.isWaiting || (info.index ?? 0) > 0) introDone = true;
  if (pendingPlay !== null && info.isWaiting && info.index === pendingPlay) {
    pendingPlay = null;
    presenter.resume();
  }
  const stage = stageOf(info);
  prev.disabled = stage === 0;
  next.disabled = stage >= info.count;
  stepText.textContent = `${stage} / ${info.count}`;
  if (embedded) {
    window.parent.postMessage({type: 'motion:info', stage, count: info.count}, '*');
  }
});

/**
 * 到第 stage 段。下一段照常播放動畫；往回或跳好幾段則直接顯示那一段的結果，
 * 不重播（Slidev 往回翻頁時就是這樣）。
 */
function goTo(target: number) {
  const count = slideIds.length;
  const stage = Math.max(0, Math.min(target, count));
  const current = stageOf(info);
  if (stage === current) return;
  if (stage === current + 1) {
    // 停在 beginSlide 上就繼續播；還在播就直接跳到這一段的結尾
    if (info.isWaiting) presenter.resume();
    else presenter.requestNextSlide();
  } else if (stage < count) {
    presenter.requestSlide(slideIds[stage]);
  } else {
    playSegment(count - 1); // 最後一段後面沒有 beginSlide，只能播到結尾
  }
}

const goNext = () => goTo(stageOf(info) + 1);
const goPrev = () => goTo(stageOf(info) - 1);
/** 重播把畫面帶到現在這個狀態的那一段動畫。 */
const replayCurrent = () => {
  const stage = stageOf(info);
  if (stage > 0) playSegment(stage - 1);
};

// 給檢查腳本與外層頁面用的介面。
(window as any).__motion = {
  get info() {
    return info;
  },
  get stage() {
    return stageOf(info);
  },
  get slides() {
    return slideIds;
  },
  next: goNext,
  prev: goPrev,
  goTo,
  /** 目前場景的根節點，除錯時可以在 console 裡查節點。 */
  view: () => (presenter as any).playback.currentScene.getView(),
  /** 目前畫面的版面問題，見 audit.ts。 */
  audit: () => audit((presenter as any).playback.currentScene.getView()),
};

if (embedded) {
  // 外層（Slidev 的 MotionCanvas 元件）送 {type: 'motion:goto', index: 段數} 過來。
  window.addEventListener('message', event => {
    const data = event.data;
    if (data?.type === 'motion:goto' && typeof data.index === 'number') goTo(data.index);
  });
} else {
  next.onclick = goNext;
  prev.onclick = goPrev;
  replay.onclick = replayCurrent;
  stage.onclick = goNext;

  window.addEventListener('keydown', event => {
    if (['ArrowRight', ' ', 'PageDown', 'Enter'].includes(event.key)) {
      event.preventDefault();
      goNext();
    }
    if (['ArrowLeft', 'PageUp', 'Backspace'].includes(event.key)) {
      event.preventDefault();
      goPrev();
    }
    if (event.key === 'r') replayCurrent();
    if (event.key === 'f') document.documentElement.requestFullscreen?.();
  });
}

(async () => {
  // 等字體表單與 Inter 載入，否則第一格會用到備用字體。但最多等 2.5 秒：
  // 手機網路慢或連不到 Google Fonts 時可能很久都不結束，畫面會一直是白的。
  // 字體表單在 index.html 以 media="print" 非同步載入，所以要先等它的 load。
  const fontsReady = (async () => {
    const sheet = document.querySelector<HTMLLinkElement>(
      'link[rel="stylesheet"][href*="fonts.googleapis.com"]',
    );
    // data-done 由 index.html 的 onload / onerror 設定：表單已載入或已失敗。
    if (sheet && !sheet.dataset.done) {
      await new Promise(resolve => {
        sheet.addEventListener('load', resolve, {once: true});
        sheet.addEventListener('error', resolve, {once: true});
      });
    }
    await document.fonts.load('32px Inter');
  })();
  try {
    await Promise.race([fontsReady, new Promise(resolve => setTimeout(resolve, 2500))]);
  } catch {}
  await presenter.present({
    name: project.scenes[0].name,
    fps: 60,
    slide: null,
    size: new Vector2(1920, 1080),
    resolutionScale: 1,
    colorSpace: 'srgb',
    background: '#ffffff',
  });
})();
