/**
 * 共用的樣式與版面常數。
 *
 * 顏色沿用教材圖表的配色。之後要做別的動畫，改這個檔案就好，
 * 場景裡不應該再出現任何寫死的色碼或座標。
 */
export const COLOR = {
  ink: '#1a1a1a',     // 文字與外框
  line: '#333333',    // 連線
  cluster: '#aeacac', // 外層容器，例如一群 compute node
  node: '#e7e7e7',    // 一台機器
  service: '#adf0c7', // 機器上跑的服務
  storage: '#6eea9e', // 儲存、匯流排、移動中的 job
  page: '#ffffff',    // 背景
  dim: '#66707c',     // 次要文字
  trail: '#1f9d57',   // 移動留下的軌跡，比 storage 深一階才看得出來
  flash: '#94f2b8',   // 閃一下用的亮色，介於 service 與 storage 之間
};

/** 線條與邊框統一 2 px，圓角一律 0，維持圖表的直角風格。 */
export const STROKE = 2;

/**
 * 字級，單位是畫布上的 px。
 * 畫布是 1920 x 1080，投影到 16:9 的螢幕上，32 px 大約等於投影片的 24 px。
 */
export const FONT = {
  title: 44,
  nodeTitle: 32,
  service: 30,
  label: 28,
  caption: 26,
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
 * 獨立頁與影片沒有別的地方放說明，所以畫在圖下方；嵌進 Slidev（?embed=1）時
 * 說明放在投影片右側的 note 欄，圖上就不再重複。
 */
export const SHOW_CAPTIONS =
  typeof location === 'undefined' || !new URLSearchParams(location.search).has('embed');
