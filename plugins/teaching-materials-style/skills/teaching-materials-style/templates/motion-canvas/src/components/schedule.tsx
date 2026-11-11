/**
 * 排程圖用的零件：時間軸、node 列、job 方塊。
 *
 * 這一組的重點是「用訊號驅動版面」：job 方塊的位置與寬度不是寫死的座標，
 * 而是從開始時間、長度、佔用的 node 這幾個訊號算出來的。
 * 之後要讓一個 job 變長、移到別的時間或換到別的 node，
 * 只要改訊號的值，方塊自己會跟著動，不用再去算 px。
 */
import {Line, Node, Rect, type RectProps} from '@motion-canvas/2d';
import {
  createRef,
  createSignal,
  type Reference,
  type SignalValue,
  type SimpleSignal,
} from '@motion-canvas/core';
import {COLOR, FONT, STROKE} from '../theme';
import {Label} from './parts';

/** 排程圖的版面。所有座標都從這幾個數字算出來。 */
export const CHART = {
  x0: -700,          // 時間 0 的 x 座標
  pxPerHour: 148,    // 一小時有多寬
  hours: 10,         // 時間軸畫到幾小時
  top: -150,         // 第一列 node 的上緣
  rowHeight: 84,
  rowGap: 12,
  rows: 4,           // 有幾台 node
};

/** 時間換算成 x 座標。 */
export const hourToX = (hour: number) => CHART.x0 + hour * CHART.pxPerHour;

/** 第 i 台 node 的列中心 y。 */
export const rowY = (row: number) =>
  CHART.top + row * (CHART.rowHeight + CHART.rowGap) + CHART.rowHeight / 2;

/** 整張圖的高度，畫外框與時間軸時會用到。 */
export const chartHeight =
  CHART.rows * CHART.rowHeight + (CHART.rows - 1) * CHART.rowGap;

/** 時間軸：一條橫線加上每小時一個刻度與標籤。 */
export function TimeAxis({y}: {y: number}) {
  const ticks = Array.from({length: CHART.hours + 1}, (_, h) => h);
  return (
    <>
      <Line
        points={[
          [hourToX(0), y],
          [hourToX(CHART.hours), y],
        ]}
        stroke={COLOR.ink}
        lineWidth={STROKE}
      />
      {/* map 的每一項用 <Node> 包起來，不要用 <> fragment：
          fragment 在陣列裡會變成巢狀陣列，有時候不會被加進畫面。 */}
      {ticks.map(h => (
        <Node>
          <Line
            points={[
              [hourToX(h), y],
              [hourToX(h), y + 10],
            ]}
            stroke={COLOR.ink}
            lineWidth={STROKE}
          />
          <Label
            text={`${h} h`}
            fontSize={FONT.caption}
            fill={COLOR.dim}
            x={hourToX(h)}
            y={y + 34}
          />
        </Node>
      ))}
    </>
  );
}

/** 四台 node 的底圖：每一台一列灰底，左邊是機器名稱。 */
export function NodeRows({names}: {names: string[]}) {
  return (
    <>
      {names.map((name, i) => (
        <Node>
          <Rect
            x={hourToX(CHART.hours / 2)}
            y={rowY(i)}
            width={CHART.hours * CHART.pxPerHour}
            height={CHART.rowHeight}
            fill={COLOR.node}
            stroke={COLOR.ink}
            lineWidth={STROKE}
            radius={0}
          />
          <Label
            text={name}
            fontSize={FONT.service}
            x={hourToX(0) - 24}
            y={rowY(i)}
            offset={[1, 0]}
          />
        </Node>
      ))}
    </>
  );
}

/**
 * 一個 job 的方塊。
 *
 * start、duration、row、rows 都是訊號，位置與大小由它們算出來：
 *   x      = 開始時間換算的位置 + 一半寬度
 *   width  = 長度 x 每小時的寬度
 *   y      = 第一列的中心 + 跨越列數的一半
 *   height = 跨越的列數高度相加
 *
 * 所以 `yield* bar.duration(3, 1)` 是「用 1 秒把這個 job 拉長到 3 小時」，
 * `yield* bar.start(0, 0.8)` 是「把它移到 0 小時開始」。
 */
export interface JobBarHandle {
  start: SimpleSignal<number>;
  duration: SimpleSignal<number>;
  row: SimpleSignal<number>;
  rows: SimpleSignal<number>;
  rect: Reference<Rect>;
}

export function createJobBar(initial: {
  start: number;
  duration: number;
  row: number;
  rows: number;
}): JobBarHandle {
  return {
    start: createSignal(initial.start),
    duration: createSignal(initial.duration),
    row: createSignal(initial.row),
    rows: createSignal(initial.rows),
    rect: createRef<Rect>(),
  };
}

export function JobBar({
  handle,
  label,
  fill = COLOR.storage,
  ...rest
}: {
  handle: JobBarHandle;
  label: SignalValue<string>;
  fill?: string;
} & RectProps) {
  const {start, duration, row, rows} = handle;
  return (
    <Rect
      // {...rest} 一定要寫在 ref 前面。
      // Motion Canvas 的 JSX 會把 ref 一起放進 function component 的 props，
      // 所以 rest 裡本來就有一個值為 undefined 的 ref，
      // 寫在後面會把下一行的 ref 蓋掉，之後 handle.rect() 就會是 undefined。
      {...rest}
      ref={handle.rect}
      // 這四個都是函式：訊號一變，畫面就跟著重算。
      x={() => hourToX(start()) + (duration() * CHART.pxPerHour) / 2}
      y={() => rowY(row()) + ((rows() - 1) * (CHART.rowHeight + CHART.rowGap)) / 2}
      width={() => duration() * CHART.pxPerHour}
      height={() => rows() * CHART.rowHeight + (rows() - 1) * CHART.rowGap}
      fill={fill}
      stroke={COLOR.ink}
      lineWidth={STROKE}
      radius={0}
      justifyContent="center"
      alignItems="center"
    >
      <Label text={label} fontSize={FONT.service} />
    </Rect>
  );
}
