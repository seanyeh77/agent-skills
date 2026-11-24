/**
 * 共用的樣式與版面常數。
 *
 * 顏色沿用教材圖表的配色。之後要做別的動畫，改這個檔案就好，
 * 場景裡不應該再出現任何寫死的色碼或座標。
 */
/**
 * 強調色：觀眾在簡報選色器選的顏色（存在 localStorage 的 ui-accent；播放頁與簡報同網域，
 * 讀得到），沒有選過就用教材主題預設的青 #027874。只給反例裡唯一改變的那個元素用。
 * 文字要用 COLOR.accentText：顏色太淺時加深到在白底達 4.5:1，換算方式同設計系統。
 * 簡報換色時 MotionCanvas.vue 會重新載入動畫，所以這裡在載入時讀一次就夠了。
 */
const DEFAULT_ACCENT = '#027874';

function readAccent(): string {
  try {
    const v = (localStorage.getItem('ui-accent') ?? '').trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{6}$/.test(v)) return '#' + v.toLowerCase();
  } catch {}
  return DEFAULT_ACCENT;
}

function readableOnWhite(hex: string): string {
  const rgb = (x: string) => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16));
  const lum = (c: number[]) =>
    c
      .map(v => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  const base = rgb(hex);
  let c = base;
  for (let k = 1; k * 0.04 <= 1 && 1.05 / (lum(c) + 0.05) < 4.5; k++) {
    c = base.map(v => v * (1 - k * 0.04));
  }
  return '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}

const ACCENT = readAccent();

export const COLOR = {
  ink: '#1a1a1a',     // 文字與外框
  line: '#333333',    // 連線
  cluster: '#aeacac', // 外層容器，例如一群 compute node
  node: '#e7e7e7',    // 一台機器
  service: '#adf0c7', // 機器上跑的服務
  storage: '#6eea9e', // 儲存、匯流排、移動中的 job
  page: '#fcfbfb',    // 背景，與簡報底色 (--bg) 相同
  dim: '#66707c',     // 次要文字
  trail: '#1f9d57',   // 移動留下的軌跡，比 storage 深一階才看得出來
  flash: '#94f2b8',   // 閃一下用的亮色，介於 service 與 storage 之間
  accent: ACCENT,     // 反例裡唯一改變的元素（外框、填色）
  accentText: readableOnWhite(ACCENT), // 強調色的文字
};

/** 線條與邊框統一 2 px，圓角一律 0，維持圖表的直角風格。 */
export const STROKE = 2;

/**
 * 字級，單位是畫布上的 px。
 * 畫布是 1920 x 1080，投影到 16:9 的螢幕上，32 px 大約等於投影片的 24 px。
 */
export const FONT = {
  title: 48,
  nodeTitle: 32,
  service: 30,
  label: 40,
  caption: 32,
};

/**
 * 一台機器的尺寸。四台共用同一組數字，排起來才會整齊；
 * 高度固定，讓每一台的「job 通道」都落在同一條水平線上。
 */
export const NODE = {
  width: 300,
  height: 310,
  padding: 14,
  titleHeight: 54,
  serviceHeight: 64,
  gap: 12,
};

/** 第 i 個服務方塊的 y，相對於機器的中心。 */
export const serviceY = (i: number) =>
  -NODE.height / 2 +
  NODE.padding +
  NODE.titleHeight +
  NODE.gap +
  i * (NODE.serviceHeight + NODE.gap) +
  NODE.serviceHeight / 2;

/** 機器最下面那一排的 y，相對於機器的中心。job 卡片會停在這裡。 */
export const jobSlotY = NODE.height / 2 - NODE.padding - NODE.serviceHeight / 2;

/**
 * 圖下方的說明字幕要不要畫。
 *
 * 獨立頁沒有別的地方放說明，所以畫在圖下方；嵌進 Slidev（?embed=1）時
 * 說明放在投影片右側的 note 欄，圖上就不再重複。
 */
export const SHOW_CAPTIONS =
  typeof location === 'undefined' || !new URLSearchParams(location.search).has('embed');
