/**
 * Backfill：排程器在大 job 等資源的空檔裡，插進一個不會延後它的小 job。
 *
 * 這是比較複雜的一個範例，重點在五個寫法：
 *
 * 1. 版面由訊號算出來：job 方塊的位置與寬度來自開始時間、長度與佔用的 node，
 *    動畫就是改這些訊號的值，不是改 px。
 * 2. 反應式文字：利用率的百分比直接綁在訊號上，訊號一動文字就跟著變。
 * 3. 一個 beginSlide 裡只有一個 all()：所有東西用 delay() 錯開起點，
 *    而不是一個 yield* 接一個，中間才不會有停頓。
 * 4. 移動一律走 components/motion 的 travel()：卡片沿路徑走、後面留 trail，
 *    到站讓目標 flash() 一下。
 * 5. 時間游標：一條線的 x 綁在訊號上，用 linear 掃過整段時間。
 */
import {Line, Node, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {
  PlopSpring,
  all,
  createRef,
  createSignal,
  delay,
  easeInOutCubic,
  easeOutCubic,
  linear,
  spring,
  waitFor,
} from '@motion-canvas/core';
import {COLOR, FONT, STROKE, SHOW_CAPTIONS} from '../theme';
import {FONT_FAMILY, Label} from '../components/parts';
import {
  addToken,
  flash,
  popIn,
  travel,
  vanish,
  type Point,
  step,
} from '../components/motion';
import {
  CHART,
  JobBar,
  NodeRows,
  TimeAxis,
  chartHeight,
  createJobBar,
  hourToX,
  rowY,
} from '../components/schedule';

/** 要觀察的時間窗：0 h 到 3 h，也就是 Job A 執行的那一段。 */
const WINDOW_HOURS = 3;
const TOTAL_NODE_HOURS = CHART.rows * WINDOW_HOURS;

/** 兩張 queue 卡片的位置，以及卡片下緣（卡片高 64，所以是中心 + 32）。 */
const CARD_Y = -320;
const CARD_EXIT_Y = CARD_Y + 32;
const CARD_B_X = hourToX(0) + 270;
const CARD_C_X = hourToX(0) + 730;

/** 卡片離開 queue 之後先走到這條水平通道，再往下落進圖裡。 */
const LANE_Y = CHART.top - 70;

/** 一列 job 的垂直中心：第 row 列開始、佔 rows 列。 */
const barCenterY = (row: number, rows: number) =>
  rowY(row) + ((rows - 1) * (CHART.rowHeight + CHART.rowGap)) / 2;

export default makeScene2D(function* (view) {
  view.fill(COLOR.page);

  // 四個 job 的狀態。數字是「幾小時」與「第幾台 node」，不是座標。
  const jobA = createJobBar({start: 0, duration: 0, row: 0, rows: 2});
  const jobB = createJobBar({start: 3, duration: 3, row: 0, rows: 4});
  const jobC = createJobBar({start: 0, duration: 2, row: 2, rows: 2});

  const idle = createRef<Rect>();
  const idleLabel = createRef<Rect>();
  const cursor = createRef<Line>();
  const caption = createRef<Txt>();
  const queueCardB = createRef<Rect>();
  const queueCardC = createRef<Rect>();

  // 移動中的卡片要畫在 trail 之上，所以分兩層，後加的那層在上面。
  const trailLayer = createRef<Node>();
  const tokenLayer = createRef<Node>();

  /** 已經用掉的 node-hours。利用率的文字綁在這個訊號上。 */
  const usedNodeHours = createSignal(0);
  /** 時間游標的位置，單位是小時。 */
  const cursorHour = createSignal(0);

  const axisY = CHART.top + chartHeight + 28;

  view.add(
    <>
      <Label
        text="Backfill Scheduling"
        fontSize={FONT.title}
        x={hourToX(0) - 150}
        y={-430}
        offset={[-1, 0]}
      />

      {/* 利用率。text 是函式，usedNodeHours 一變，畫面上的數字就跟著變。 */}
      <Txt
        text={() =>
          `Utilization 0 h to ${WINDOW_HOURS} h: ` +
          `${Math.round((usedNodeHours() / TOTAL_NODE_HOURS) * 100)} %`
        }
        fontFamily={FONT_FAMILY}
        fontSize={FONT.label}
        fill={COLOR.dim}
        x={hourToX(CHART.hours)}
        y={-430}
        offset={[1, 0]}
      />

      {/* 等待中的 job，先放在圖上方的 queue。scale 0 表示還沒彈出來。 */}
      <Label
        text="Queue"
        fontSize={FONT.caption}
        fill={COLOR.dim}
        x={hourToX(0) - 150}
        y={CARD_Y}
        offset={[-1, 0]}
      />
      <Rect
        ref={queueCardB}
        x={CARD_B_X}
        y={CARD_Y}
        width={420}
        height={64}
        fill={COLOR.node}
        stroke={COLOR.ink}
        lineWidth={STROKE}
        radius={0}
        justifyContent="center"
        alignItems="center"
        scale={0}
      >
        <Label text="Job B  4 nodes  3 h" fontSize={FONT.service} />
      </Rect>
      <Rect
        ref={queueCardC}
        x={CARD_C_X}
        y={CARD_Y}
        width={420}
        height={64}
        fill={COLOR.node}
        stroke={COLOR.ink}
        lineWidth={STROKE}
        radius={0}
        justifyContent="center"
        alignItems="center"
        scale={0}
      >
        <Label text="Job C  2 nodes  2 h" fontSize={FONT.service} />
      </Rect>

      <NodeRows names={['node01', 'node02', 'node03', 'node04']} />
      <TimeAxis y={axisY} />

      {/* 空檔：node03 與 node04 在 0 h 到 3 h 之間沒事做。 */}
      <Rect
        ref={idle}
        x={hourToX(WINDOW_HOURS / 2)}
        y={barCenterY(2, 2)}
        width={WINDOW_HOURS * CHART.pxPerHour}
        height={CHART.rowHeight * 2 + CHART.rowGap}
        fill={null}
        stroke={COLOR.line}
        lineWidth={STROKE}
        lineDash={[12, 10]}
        radius={0}
        opacity={0}
      />
      {/* 標籤加一層白底，列的框線就不會從文字後面穿過去。
          layout 會讓底框自動縮到文字的大小。 */}
      <Rect
        ref={idleLabel}
        x={hourToX(WINDOW_HOURS / 2)}
        y={barCenterY(2, 2)}
        fill={COLOR.page}
        layout
        padding={[6, 16]}
        radius={0}
        opacity={0}
      >
        <Label text="idle  2 nodes x 3 h" fontSize={FONT.caption} fill={COLOR.dim} />
      </Rect>

      {/* 三個 job。Job B 先用虛線表示「已預約、還沒開始」。 */}
      <JobBar handle={jobA} label="Job A" />
      <JobBar handle={jobB} label="Job B" fill={COLOR.service} opacity={0} lineDash={[12, 10]} />
      <JobBar handle={jobC} label="Job C" fill={COLOR.service} opacity={0} />

      {/* 時間游標：x 綁在 cursorHour 上。 */}
      <Line
        ref={cursor}
        points={() => [
          [hourToX(cursorHour()), CHART.top - 20],
          [hourToX(cursorHour()), CHART.top + chartHeight + 20],
        ]}
        stroke={COLOR.ink}
        lineWidth={3}
        opacity={0}
      />

      {/* 兩個空的圖層，移動中的卡片與它的 trail 都加在這裡。 */}
      <Node ref={trailLayer} />
      <Node ref={tokenLayer} />

      <Txt
        ref={caption}
        text=""
        fontFamily={FONT_FAMILY}
        fontSize={FONT.label}
        fill={COLOR.dim}
        x={hourToX(0) - 150}
        y={420}
        offset={[-1, 0]}
        opacity={0}
      />
    </>,
  );

  /**
   * 換一行字幕。
   *
   * 先淡出再淡入會留下一段畫面不動的空檔，看起來會頓。
   * 這裡改成淡出的同時往下移 10 px，換字之後再往回淡入，
   * 而且每次都放進 all() 裡和畫面上的動作一起跑，中間就不會有空檔。
   */
  function* say(text: string) {
    if (!SHOW_CAPTIONS) return;
    if (caption().opacity() > 0) {
      yield* all(caption().opacity(0, 0.15), caption().y(432, 0.15));
    }
    caption().text(text);
    caption().y(408);
    yield* all(caption().opacity(1, 0.21), caption().y(420, 0.21, easeOutCubic));
  }

  /** 從 queue 卡片走到圖上某一格的路徑：往下、橫移、再往下。 */
  const routeFrom = (cardX: number, toX: number, toY: number): Point[] => [
    [cardX, CARD_EXIT_Y],
    [cardX, LANE_Y],
    [toX, LANE_Y],
    [toX, toY],
  ];

  // 開場：Job A 已經在跑，佔用 node01 與 node02 三個小時。
  // duration 從 0 拉到 3，方塊就會從左邊長出來。
  yield* all(
    jobA.duration(WINDOW_HOURS, 0.6, easeInOutCubic),
    usedNodeHours(6, 0.6),
    delay(0.2, say('Job A 佔用 node01 與 node02，從 0 h 跑到 3 h。')),
  );

  // 第 1 段：Job B 進 queue，但它要 4 台 node，只能等 Job A 結束。
  yield* step('queue');
  yield* all(
    popIn({rect: queueCardB}),
    say('Job B 要 4 台 node，現在湊不齊，只能排隊。'),
  );

  // 預約：一張卡片從 queue 走到 3 h–6 h 的格子，落下之後保留區才出現。
  // travel() 整段只有一個補間，所以卡片不會在轉角停。
  const slotBX = hourToX(4.5);
  const slotBY = barCenterY(0, 4);
  const tokenB = addToken(tokenLayer(), 'Job B', [CARD_B_X, CARD_EXIT_Y], 200);
  yield* all(
    travel(tokenB, routeFrom(CARD_B_X, slotBX, slotBY), 0.87, {
      layer: trailLayer(),
    }),
    delay(0.3, say('排程器先替它保留 3 h 到 6 h 的位置。')),
  );
  yield* all(
    vanish(tokenB),
    jobB.rect().opacity(0.55, 0.27, easeOutCubic),
    flash(jobB.rect()),
  );

  // 第 2 段：點出空檔。
  yield* step('idle');
  yield* all(
    idle().opacity(1, 0.27, easeOutCubic),
    delay(0.1, idleLabel().opacity(1, 0.27, easeOutCubic)),
    delay(0.07, say('node03 與 node04 在這 3 小時裡完全空著，等於浪費 6 node-hours。')),
  );

  // 第 3 段：Job C 送出，檢查它會不會延後 Job B。
  yield* step('check');
  yield* all(
    popIn({rect: queueCardC}),
    delay(0.07, say('Job C 只要 2 台 node、跑 2 小時，2 h 小於 3 h，不會延後 Job B。')),
  );

  // 第 4 段：把 Job C 插進空檔。
  // 卡片先走進空檔（queue 卡片同時收掉），落地之後方塊才長出來。
  yield* step('backfill');
  const gapX = hourToX(1);
  const gapY = barCenterY(2, 2);
  const tokenC = addToken(tokenLayer(), 'Job C', [CARD_C_X, CARD_EXIT_Y], 200);
  yield* all(
    travel(tokenC, routeFrom(CARD_C_X, gapX, gapY), 0.93, {layer: trailLayer()}),
    delay(0.13, queueCardC().scale(0, 0.2)),
    delay(0.37, say('Job C 被 backfill 進空檔，利用率從 50 % 提高到 83 %。')),
  );
  yield* all(
    vanish(tokenC),
    jobC.rect().opacity(1, 0.17, easeOutCubic),
    // spring 比固定時間的 easing 多一點彈性，方塊像是「落進」空檔。
    // 參數依序是：彈簧設定、起點、終點、每一幀要做的事。
    // spring 沒有「秒數」可以調，要快一點就換一組硬一點的彈簧。
    spring(PlopSpring, 0, 2, value => jobC.duration(value)),
    delay(0.07, idle().opacity(0, 0.2)),
    delay(0.07, idleLabel().opacity(0, 0.2)),
    // 利用率跟著上升：多用了 2 台 x 2 小時。
    delay(0.1, usedNodeHours(10, 0.53, easeInOutCubic)),
    delay(0.17, flash(jobC.rect())),
  );

  // 第 5 段：時間往前走，看實際執行的順序。
  yield* step('run');
  yield* all(
    say('時間往前走：Job C 先結束，Job A 結束後 Job B 準時開始。'),
    cursor().opacity(1, 0.2),
  );
  // 游標一口氣從 0 h 掃到 6 h，中間不停。
  // 每個 job 的狀態變化用 delay() 掛在同一個 all() 裡，時間點對準游標經過的那一刻：
  // 2.13 秒走 6 小時，所以 2 h 是 0.71 秒、3 h 是 1.07 秒。
  // 結束不是直接變灰，而是 flash() 亮一下再落到灰色，才看得出「這一刻跑完了」。
  yield* all(
    cursorHour(6, 2.13, linear),
    delay(0.71, flash(jobC.rect(), COLOR.node)),
    delay(1.07, flash(jobA.rect(), COLOR.node)),
    delay(1.07, jobB.rect().opacity(1, 0.27)),
    delay(1.07, jobB.rect().lineDash([0, 0], 0.27)),
    // Job B 開跑，queue 裡那張卡片就該收掉。
    delay(1.07, queueCardB().scale(0, 0.23)),
    delay(1.13, flash(jobB.rect())),
    delay(2.07, flash(jobB.rect(), COLOR.node)),
  );

  // 第 6 段：結論。
  yield* step('summary');
  yield* all(
    cursor().opacity(0, 0.2),
    say('backfill 的條件是：小 job 必須在大 job 的預定開始時間之前結束。'),
  );
  yield* waitFor(0.27);
});
