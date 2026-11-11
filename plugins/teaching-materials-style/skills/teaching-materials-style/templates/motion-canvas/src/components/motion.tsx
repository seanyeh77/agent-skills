/**
 * 「絲滑」的四個動作：沿路徑移動、彈出、收掉、閃一下。
 *
 * 這一組是整個專案的動作語彙。場景裡不要自己寫 position/scale 的補間，
 * 一律呼叫這裡的函式，整份動畫的節奏才會一致。
 *
 * 讓動畫看起來連續的三個原則：
 *
 * 1. 移動用「一個訊號從 0 跑到 1」來驅動，位置由訊號算出來，
 *    不是一段一段地改座標。中途不會停。
 * 2. 移動時在後面留一條 trail，視線會被帶著走，到站再淡掉。
 * 3. 抵達的時候讓目標閃一下再回色，動作才有「到了」的收尾。
 */
import {Line, Node, Rect} from '@motion-canvas/2d';
import {
  beginSlide,
  createRef,
  createSignal,
  PlaybackState,
  usePlayback,
  waitFor,
  easeInOutCubic,
  easeOutCubic,
  type Reference,
  type ThreadGenerator,
} from '@motion-canvas/core';
import {COLOR, FONT, STROKE} from '../theme';
import {Label} from './parts';

/** 路徑上的一個點，單位是畫布 px。 */
export type Point = [number, number];

/**
 * 取出折線上「走了 t 成」的位置，t 從 0 到 1。
 *
 * 依線段長度分配進度，所以長的線段花的時間比較長，
 * 速度看起來才是均勻的（如果按點數平均分配，轉角處會忽快忽慢）。
 */
export function pointOnPath(points: Point[], t: number): Point {
  const lengths: number[] = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const d = Math.hypot(
      points[i][0] - points[i - 1][0],
      points[i][1] - points[i - 1][1],
    );
    lengths.push(d);
    total += d;
  }
  let remain = t * total;
  for (let i = 0; i < lengths.length; i++) {
    if (remain <= lengths[i] || i === lengths.length - 1) {
      const k = lengths[i] ? Math.min(1, remain / lengths[i]) : 1;
      return [
        points[i][0] + (points[i + 1][0] - points[i][0]) * k,
        points[i][1] + (points[i + 1][1] - points[i][1]) * k,
      ];
    }
    remain -= lengths[i];
  }
  return points[points.length - 1];
}

/** 一張移動中的卡片。 */
export interface Token {
  rect: Reference<Rect>;
}

/**
 * 在畫面上生一張卡片，scale 先設成 0，所以還看不到；
 * 要等 travel() 或 popIn() 把它彈出來。
 *
 * container 給 <Node> 的實體，通常是場景裡專門放卡片的那一層。
 */
export function addToken(
  container: Node,
  text: string,
  at: Point,
  width = 240,
  opts: {height?: number; fontSize?: number} = {},
): Token {
  const rect = createRef<Rect>();
  container.add(
    <Rect
      ref={rect}
      position={at}
      width={width}
      height={opts.height ?? 56}
      fill={COLOR.flash}
      stroke={COLOR.ink}
      lineWidth={STROKE}
      radius={0}
      scale={0}
      justifyContent="center"
      alignItems="center"
    >
      <Label text={text} fontSize={opts.fontSize ?? FONT.caption} />
    </Rect>,
  );
  return {rect};
}

/** 彈出：0.25 秒、easeOutCubic，先快後慢，像是被放上去的。 */
export function* popIn(token: Token): ThreadGenerator {
  yield* token.rect().scale(1, 0.17, easeOutCubic);
}

/** 收掉並從畫面移除。留著不移除會一直吃效能。 */
export function* vanish(token: Token): ThreadGenerator {
  yield* token.rect().scale(0, 0.17);
  token.rect().remove();
}

/**
 * 讓卡片沿 path 走一趟。
 *
 * 位置綁在 progress 上（position 收的是函式），所以整段只有一個補間，
 * 中間不會有換段落的停頓。trail 給了就會在後面畫一條同路徑的線，
 * 線的 end 也綁在同一個 progress 上，於是線頭永遠跟著卡片。
 */
export function* travel(
  token: Token,
  path: Point[],
  duration: number,
  trail?: {layer: Node; points?: Point[]},
): ThreadGenerator {
  const progress = createSignal(0);
  token.rect().position(() => pointOnPath(path, progress()));

  let line: Line | null = null;
  if (trail) {
    line = (
      <Line
        points={trail.points ?? path}
        stroke={COLOR.trail}
        lineWidth={6}
        end={() => progress()}
        opacity={0.85}
      />
    ) as Line;
    trail.layer.add(line);
  }

  yield* popIn(token);
  yield* progress(1, duration, easeInOutCubic);

  if (line) {
    yield* line.opacity(0, 0.2);
    line.remove();
  }
}

/**
 * 閃一下再回色：表示「這裡剛剛發生了事情」。
 *
 * 用 .to() 把兩段接起來，中間沒有空檔；亮的那段短、回色那段長，
 * 看起來是一個脈衝而不是閃爍。
 */
export function* flash(
  rect: Rect,
  settle: string = COLOR.service,
): ThreadGenerator {
  yield* rect.fill(COLOR.flash, 0.17).to(settle, 0.23);
}

/** 讓一條線「畫出來」。開場把圖長出來時用。 */
export function* draw(line: Line, duration = 0.5): ThreadGenerator {
  yield* line.end(1, duration, easeInOutCubic);
}

/**
 * 段落的分界：取代場景裡的 beginSlide()。
 *
 * 播放頁（Presenter）會在這裡停下來等按鍵，跟 beginSlide() 一樣。
 * 匯出影片時 beginSlide() 不會停，上一段一播完就接下一段，觀眾來不及看，
 * 所以影片模式先停 hold 秒再往下。編輯器裡預覽時也照影片的節奏停。
 */
export function* step(name: string, hold = 1.5): ThreadGenerator {
  if (usePlayback().state !== PlaybackState.Presenting) {
    yield* waitFor(hold);
  }
  yield* beginSlide(name);
}
