/**
 * Slurm Job Flow：一個 job 從 Login Node 送出、被排程、在 Compute Node 執行，
 * 最後把輸出寫到共用儲存的過程。
 *
 * 這份檔案同時當作 Motion Canvas 的範例，三個重點：
 *
 * 1. 畫面用 JSX 組出來，view.add() 之後就在畫布上。
 * 2. 動畫用 yield* 一步一步播；all() 同時播，chain() 接著播。
 * 3. step()（包著 beginSlide()）會在簡報模式停下來等按鍵，一個 step 就是一個段落。
 */
import {Line, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {
  all,
  chain,
  createRef,
  delay,
  easeInOutCubic,
  easeOutCubic,
  waitFor,
} from '@motion-canvas/core';
import {COLOR, FONT, NODE, STROKE, jobSlotY, SHOW_CAPTIONS} from '../theme';
import {Box, FONT_FAMILY, Label, NodeBox} from '../components/parts';
import {step} from '../components/motion';

// ---------------------------------------------------------------------------
// 版面
// ---------------------------------------------------------------------------

/**
 * 四台機器的 x 座標。原點在畫布正中央，所以左負右正。
 * 間距 500、機器寬 300，中間留下 200 px 給箭頭與它的標籤，
 * 標籤才不會壓到機器，線也不會從文字後面穿過去。
 */
const COLUMN_X = [-750, -250, 250, 750];

/** 機器上緣的 y 座標。 */
const TOP_Y = -170;

/**
 * job 通道：四台機器最下面那一排的高度。
 * 箭頭與 job 卡片都走這一條，上面的服務方塊就不會被蓋住。
 */
const LANE_Y = TOP_Y + NODE.height / 2 + jobSlotY;

/** 箭頭從上一台機器的右緣畫到下一台機器的左緣。 */
const arrowFrom = (i: number) => COLUMN_X[i] + NODE.width / 2;
const arrowTo = (i: number) => COLUMN_X[i + 1] - NODE.width / 2;

export default makeScene2D(function* (view) {
  view.fill(COLOR.page);

  // -------------------------------------------------------------------------
  // 建立 ref：要播動畫的節點都要先有 ref
  // -------------------------------------------------------------------------
  const login = createRef<Rect>();
  const head = createRef<Rect>();
  const compute = createRef<Rect>();
  const storage = createRef<Rect>();

  const sbatch = createRef<Rect>();
  const slurmctld = createRef<Rect>();
  const slurmd = createRef<Rect>();

  const arrows = [createRef<Line>(), createRef<Line>(), createRef<Line>()];
  const arrowLabels = [createRef<Txt>(), createRef<Txt>(), createRef<Txt>()];

  const job = createRef<Rect>();
  const outputFile = createRef<Rect>();
  const caption = createRef<Txt>();

  // -------------------------------------------------------------------------
  // 畫面：先把所有東西加進畫布，但透明度設成 0，之後再一個個淡入
  // -------------------------------------------------------------------------
  view.add(
    <>
      <Label
        text="Slurm Job Flow"
        fontSize={FONT.title}
        y={-440}
        x={COLUMN_X[0] - NODE.width / 2}
        offset={[-1, 0]}
      />

      <NodeBox
        ref={login}
        title="Login Node"
        services={['sbatch', 'munged']}
        boxes={[sbatch]}
        x={COLUMN_X[0]}
        y={TOP_Y}
        opacity={0}
      />
      <NodeBox
        ref={head}
        title="Head Node"
        services={['slurmctld', 'munged']}
        boxes={[slurmctld]}
        x={COLUMN_X[1]}
        y={TOP_Y}
        opacity={0}
      />
      <NodeBox
        ref={compute}
        title="Compute Node"
        services={['slurmd', 'munged']}
        boxes={[slurmd]}
        x={COLUMN_X[2]}
        y={TOP_Y}
        opacity={0}
      />
      <NodeBox
        ref={storage}
        title="Shared Storage"
        services={[]}
        x={COLUMN_X[3]}
        y={TOP_Y}
        opacity={0}
      />

      {/* 三條箭頭。end 設成 0 表示還沒畫出來，動畫時再拉到 1。 */}
      {arrows.map((ref, i) => (
        <Line
          ref={ref}
          points={[
            [arrowFrom(i), LANE_Y],
            [arrowTo(i), LANE_Y],
          ]}
          stroke={COLOR.line}
          lineWidth={STROKE}
          endArrow
          arrowSize={12}
          end={0}
        />
      ))}

      {['1 Submit', '2 Dispatch', '3 Write output'].map((text, i) => (
        <Label
          ref={arrowLabels[i]}
          text={text}
          fontSize={FONT.caption}
          x={(arrowFrom(i) + arrowTo(i)) / 2}
          y={LANE_Y - NODE.serviceHeight / 2 - 26}
          opacity={0}
        />
      ))}

      {/* 代表 job 的小卡片，之後會沿著箭頭移動。 */}
      <Box
        ref={job}
        text="job 42"
        fill={COLOR.storage}
        width={180}
        height={56}
        x={COLUMN_X[0]}
        y={LANE_Y}
        opacity={0}
      />

      {/* job 結束後留在 Shared Storage 的輸出檔。 */}
      <Box
        ref={outputFile}
        text="slurm-42.out"
        fill={COLOR.storage}
        width={NODE.width - NODE.padding * 2}
        x={COLUMN_X[3]}
        y={LANE_Y}
        opacity={0}
      />

      <Txt
        ref={caption}
        text=""
        fontFamily={FONT_FAMILY}
        fontSize={FONT.label}
        fill={COLOR.dim}
        y={380}
        x={COLUMN_X[0] - NODE.width / 2}
        offset={[-1, 0]}
        opacity={0}
      />
    </>,
  );

  /**
   * 換一行說明文字。
   *
   * 淡出的同時往下移一點，換字之後再往回淡入，中間不會有畫面全靜止的空檔。
   * 和 backfill 場景用的是同一種寫法。
   */
  function* say(text: string) {
    if (!SHOW_CAPTIONS) return;
    const y0 = 420;
    if (caption().opacity() > 0) {
      yield* all(caption().opacity(0, 0.15), caption().y(y0 + 12, 0.15));
    }
    caption().text(text);
    caption().y(y0 - 12);
    yield* all(caption().opacity(1, 0.21), caption().y(y0, 0.21, easeOutCubic));
  }

  /** 讓一個服務方塊閃一下，用來表示「這個服務正在做事」。 */
  function* flash(box: Rect) {
    yield* chain(
      box.fill(COLOR.storage, 0.2),
      waitFor(0.13),
      box.fill(COLOR.service, 0.2),
    );
  }

  // -------------------------------------------------------------------------
  // 動畫
  // -------------------------------------------------------------------------

  // 開場：四台機器依序出現。
  // 這一段放在第一個 beginSlide() 之前，打開頁面就會先看到完整的圖，
  // 而不是一片空白。
  yield* chain(
    ...[login, head, compute, storage].map(node =>
      chain(node().opacity(1, 0.27, easeInOutCubic), waitFor(0.07)),
    ),
  );
  yield* say('一座 cluster 至少有這四個角色。');

  // 第 1 段：使用者在 Login Node 送出 job。
  yield* step('submit');
  // 一個段落只用一個 all()：字幕、服務閃動、卡片出現、箭頭畫出來
  // 全部疊在一起，再用 delay() 錯開起點。
  // 若寫成一個 yield* 接一個，每句之間都會停半秒，看起來就是一格一格的。
  yield* all(
    say('使用者在 Login Node 用 sbatch 送出 job。'),
    delay(0.13, flash(sbatch())),
    delay(0.33, job().opacity(1, 0.2)),
    delay(0.47, arrows[0]().end(1, 0.4, easeInOutCubic)),
    delay(0.47, arrowLabels[0]().opacity(1, 0.27)),
    delay(0.47, job().position.x(COLUMN_X[1], 0.6, easeInOutCubic)),
  );

  // 第 2 段：slurmctld 排程。
  yield* step('schedule');
  yield* all(
    say('slurmctld 排程，決定這個 job 要在哪一台執行。'),
    delay(0.17, flash(slurmctld())),
  );

  // 第 3 段：派送到 Compute Node 執行。
  yield* step('dispatch');
  yield* all(
    say('slurmd 收到指令，在 Compute Node 上啟動程式。'),
    delay(0.2, arrows[1]().end(1, 0.4, easeInOutCubic)),
    delay(0.2, arrowLabels[1]().opacity(1, 0.27)),
    delay(0.2, job().position.x(COLUMN_X[2], 0.6, easeInOutCubic)),
    // 卡片快到站時服務才閃，順序才對得上。
    delay(0.67, flash(slurmd())),
  );

  // 第 4 段：輸出寫到共用儲存。
  yield* step('output');
  yield* all(
    say('程式的輸出寫到共用儲存，兩台機器都看得到這個檔案。'),
    delay(0.2, arrows[2]().end(1, 0.4, easeInOutCubic)),
    delay(0.2, arrowLabels[2]().opacity(1, 0.27)),
    delay(0.2, job().position.x(COLUMN_X[3], 0.6, easeInOutCubic)),
    // job 卡片換成輸出檔：接在移動的尾巴，一個淡出、一個淡入。
    delay(0.73, job().opacity(0, 0.2)),
    delay(0.77, outputFile().opacity(1, 0.27)),
  );

  // 第 5 段：結尾。
  yield* step('summary');
  yield* say('job 的資源由 slurmctld 決定，程式在 Compute Node 執行。');
  yield* waitFor(0.33);
});
