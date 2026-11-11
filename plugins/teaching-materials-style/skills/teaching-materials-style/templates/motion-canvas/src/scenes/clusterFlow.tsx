/**
 * Cluster Job Flow：一個 job 從 Login Node 送出，到 slurmdbd 記完帳的六個步驟。
 *
 * 這一份是投影片那版動畫的原樣，重點在三個寫法：
 *
 * 1. 版面用「投影片座標」寫，左上角是原點。整張圖放在一個 <Node> 裡，
 *    用一個 scale 縮到畫布中央，所以下面所有數字都可以照著原圖抄，
 *    不必換算成以畫面中心為原點的座標。
 * 2. 元件用小工廠函式生出來（box / text / link），重複的樣式只寫一次。
 * 3. 所有移動都走 components/motion 的 travel()：卡片沿折線走、後面留 trail，
 *    到站 flash() 一下。節奏的規則見 README。
 */
import {Line, Node, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {
  all,
  createRef,
  easeInOutCubic,
  sequence,
  waitFor,
  type ThreadGenerator,
} from '@motion-canvas/core';
import {COLOR, STROKE} from '../theme';
import {FONT_FAMILY} from '../components/parts';
import {addToken, flash, step, travel, vanish, type Point} from '../components/motion';

/**
 * 原圖的座標範圍：x 80 到 1290、y 150 到 870。
 * 下面用這個範圍算縮放與置中，改圖時只要跟著改這四個數字。
 * 右下角的步驟計數也對齊 ART.right，整張圖才會置中。
 */
const ART = {left: 80, right: 1290, top: 150, bottom: 870};

/** 圖上的字級。整張圖會被縮放，所以這裡寫的是「原圖的 px」。 */
const SIZE = {label: 24, small: 20};

export default makeScene2D(function* (view) {
  view.fill(COLOR.page);

  const root = createRef<Node>();
  const trailLayer = createRef<Node>();
  const tokenLayer = createRef<Node>();

  const artW = ART.right - ART.left;
  const artH = ART.bottom - ART.top;
  const scale = Math.min(view.width() / (artW + 120), view.height() / (artH + 120));
  const cx = (ART.left + ART.right) / 2;
  const cy = (ART.top + ART.bottom) / 2;

  // 容器的位置讓「原圖的中心」正好落在畫面中心：-cx * scale + cx * scale = 0。
  view.add(<Node ref={root} position={[-cx * scale, -cy * scale]} scale={scale} />);

  // ---------------------------------------------------------------------------
  // 小工廠：所有元件都從這三個函式生出來，樣式只寫一次
  // ---------------------------------------------------------------------------

  /** 方塊。給的是左上角與寬高，和原圖的標註方式一致。 */
  const box = (x: number, y: number, w: number, h: number, fill: string) => {
    const rect = (
      <Rect
        position={[x + w / 2, y + h / 2]}
        width={w}
        height={h}
        fill={fill}
        stroke={COLOR.ink}
        lineWidth={STROKE}
        radius={0}
        opacity={0}
      />
    ) as Rect;
    root().add(rect);
    return rect;
  };

  /** 文字。align 'left' 時 x 是文字的左緣，'center' 時 x 是中心。 */
  const text = (
    x: number,
    y: number,
    content: string,
    size = SIZE.label,
    align: 'left' | 'center' | 'right' = 'left',
  ) => {
    const txt = (
      <Txt
        position={[x, y]}
        offset={align === 'center' ? [0, 0] : align === 'left' ? [-1, 0] : [1, 0]}
        text={content}
        fontFamily={FONT_FAMILY}
        fontSize={size}
        fill={COLOR.ink}
        opacity={0}
      />
    ) as Txt;
    root().add(txt);
    return txt;
  };

  /** 連線。end 先設成 0，之後用 end(1, 秒) 把線畫出來。 */
  const link = (points: Point[], twoWay = false) => {
    const line = (
      <Line
        points={points}
        stroke={COLOR.line}
        lineWidth={STROKE}
        endArrow
        startArrow={twoWay}
        arrowSize={12}
        end={0}
      />
    ) as Line;
    root().add(line);
    return line;
  };

  // ---------------------------------------------------------------------------
  // 版面
  // ---------------------------------------------------------------------------

  /** 一台機器：灰底容器 + 名稱 + 兩個服務方塊。回傳服務方塊與它們的文字。 */
  interface Machine {
    parts: (Rect | Txt)[];
    top: {box: Rect; label: Txt};
    bottom: {box: Rect; label: Txt};
  }
  const machine = (
    x: number,
    title: string,
    topText: string,
    bottomText: string,
  ): Machine => {
    const shell = box(x, 150, 300, 210, COLOR.node);
    const name = text(x + 16, 176, title);
    const topBox = box(x + 16, 210, 268, 56, COLOR.service);
    const topLabel = text(x + 150, 238, topText, SIZE.label, 'center');
    const bottomBox = box(x + 16, 282, 268, 56, COLOR.service);
    const bottomLabel = text(x + 150, 310, bottomText, SIZE.label, 'center');
    return {
      parts: [shell, name, topBox, topLabel, bottomBox, bottomLabel],
      top: {box: topBox, label: topLabel},
      bottom: {box: bottomBox, label: bottomLabel},
    };
  };

  const login = machine(80, 'Login Node', 'sbatch job.sh', 'Slurm client');
  const head = machine(560, 'Head Node', 'slurmctld', 'Queue empty');
  const db = machine(1040, 'DB Node', 'slurmdbd', 'MariaDB');

  // Compute Nodes：外層容器裝四台機器。
  const computeShell = box(130, 460, 1160, 250, COLOR.cluster);
  const computeTitle = text(146, 486, 'Compute Nodes');

  /** 一台 compute node：名稱、slurmd、以及最下面那條 job 進度條。 */
  interface ComputeNode {
    cx: number;
    parts: (Rect | Txt)[];
    /** 進度條裡會長出來的綠色方塊，寬度從 0 拉到 211。 */
    fill: Rect;
    /** 進度條上的狀態文字：idle / Job 42 running / done。 */
    state: Txt;
  }
  const computeNodes: ComputeNode[] = [160, 445, 730, 1015].map((x, i) => {
    const shell = box(x, 520, 245, 170, COLOR.node);
    const name = text(x + 16, 546, `node0${i + 1}`);
    const daemon = box(x + 16, 572, 213, 48, COLOR.service);
    const daemonLabel = text(x + 122.5, 596, 'slurmd', SIZE.label, 'center');
    const track = box(x + 16, 630, 213, 44, COLOR.page);
    // 進度條：offset [-1, 0] 把錨點放在左緣，寬度一變就是從左往右長。
    const fill = (
      <Rect
        position={[x + 17, 652]}
        offset={[-1, 0]}
        width={0}
        height={42}
        fill={COLOR.storage}
      />
    ) as Rect;
    root().add(fill);
    const state = text(x + 122.5, 652, 'idle', SIZE.small, 'center');
    return {
      cx: x + 122.5,
      parts: [shell, name, daemon, daemonLabel, track, state],
      fill,
      state,
    };
  });

  const storage = box(130, 780, 1160, 60, COLOR.storage);
  const storageLabel = text(710, 810, 'Shared Storage', SIZE.label, 'center');

  // 連線。
  const toHead = link([[380, 255], [560, 255]]);
  const toDb = link([[860, 255], [1040, 255]], true);
  const toCompute = link([[710, 360], [710, 460]]);
  const toStorage = [282.5, 567.5, 852.5, 1137.5].map(x =>
    link([[x, 690], [x, 780]]),
  );

  // 連線上的文字：底下墊一塊白的，線就不會從字後面穿過去。
  const submitChip = box(425, 222, 90, 26, COLOR.page);
  submitChip.stroke(null);
  const submitLabel = text(470, 235, 'Submit', SIZE.small, 'center');
  const acctChip = box(895, 222, 110, 26, COLOR.page);
  acctChip.stroke(null);
  const acctLabel = text(950, 235, 'Accounting', SIZE.small, 'center');

  // 右下角的步驟計數。
  const stepLabel = text(ART.right, 870, 'Step 0 of 6  Ready', SIZE.small, 'right');
  stepLabel.fill(COLOR.dim);

  root().add(<Node ref={trailLayer} />);
  root().add(<Node ref={tokenLayer} />);

  // ---------------------------------------------------------------------------
  // 動畫
  // ---------------------------------------------------------------------------

  /** 一組元件一起淡入。 */
  const show = (nodes: (Rect | Txt)[], duration = 0.23): ThreadGenerator =>
    all(...nodes.map(node => node.opacity(1, duration)));

  /** 換步驟計數。文字用補間，不會跳字。 */
  const setStep = (n: number, name: string) =>
    stepLabel.text(`Step ${n} of 6  ${name}`, 0.2);

  /** 送一張卡片從 from 走到 to，走完收掉。trail 給的是要畫線的那一段。 */
  function* send(
    label: string,
    path: Point[],
    duration: number,
    trail?: Point[],
    width = 120,
  ): ThreadGenerator {
    const token = addToken(tokenLayer(), label, path[0], width, {
      height: 40,
      fontSize: SIZE.small,
    });
    yield* travel(token, path, duration, {layer: trailLayer(), points: trail});
    yield* vanish(token);
  }

  // 開場：整張圖長出來。sequence() 讓每一組錯開 0.1 秒，是一層一層長，
  // 不是整張一起亮。這一段在第一個 beginSlide() 之前，打開就會看到完整的圖。
  yield* sequence(
    0.1,
    ...[login, head, db].map(m => show(m.parts)),
  );
  yield* all(
    toHead.end(1, 0.33),
    toDb.end(1, 0.33),
    show([submitChip, submitLabel, acctChip, acctLabel]),
  );
  yield* all(toCompute.end(1, 0.27), show([computeShell, computeTitle]));
  yield* sequence(0.07, ...computeNodes.map(n => show(n.parts)));
  yield* all(
    ...toStorage.map(line => line.end(1, 0.27)),
    show([storage, storageLabel]),
  );
  yield* stepLabel.opacity(1, 0.2);

  // 第 1 步：使用者送出 job。卡片從 Login Node 走到 Head Node。
  yield* step('submit');
  yield* setStep(1, 'Submit');
  yield* send('Job 42', [[230, 238], [470, 238], [710, 238]], 0.93, [
    [380, 255],
    [560, 255],
  ]);
  yield* flash(head.top.box);

  // 第 2 步：slurmctld 把 job 放進 queue，排程之後標成 scheduled。
  yield* step('schedule');
  yield* setStep(2, 'Schedule');
  yield* send('Job 42', [[710, 238], [710, 310]], 0.4);
  yield* head.bottom.label.text('Job 42 pending', 0.33);
  yield* waitFor(0.4);
  yield* all(
    head.bottom.label.text('Job 42 scheduled', 0.33),
    flash(head.bottom.box),
  );

  // 第 3 步：派送到兩台 compute node。兩張卡片錯開 0.4 秒出發。
  yield* step('dispatch');
  yield* setStep(3, 'Dispatch');
  yield* head.bottom.label.text('Queue empty', 0.27);
  yield* sequence(
    0.27,
    ...[0, 1].map(i =>
      send(
        'Job 42',
        [
          [710, 310],
          [710, 500],
          [computeNodes[i].cx, 500],
          [computeNodes[i].cx, 652],
        ],
        1.2,
        // 只有第一張畫 trail，兩張都畫會把那條線重疊成一團。
        i === 0 ? [[710, 360], [710, 460]] : undefined,
      ),
    ),
  );
  yield* all(...[0, 1].map(i => computeNodes[i].state.text('Job 42', 0.2)));

  // 第 4 步：程式執行。進度條是兩台一起長，2.4 秒。
  yield* step('run');
  yield* setStep(4, 'Run');
  yield* all(
    ...[0, 1].map(i => computeNodes[i].state.text('Job 42 running', 0.2)),
  );
  yield* all(
    ...[0, 1].map(i => computeNodes[i].fill.width(211, 1.6, easeInOutCubic)),
  );
  yield* all(...[0, 1].map(i => computeNodes[i].state.text('Job 42 done', 0.2)));

  // 第 5 步：輸出寫到共用儲存。
  yield* step('write');
  yield* setStep(5, 'Write output');
  yield* all(
    ...[0, 1].map(i =>
      send(
        'Output',
        [
          [computeNodes[i].cx, 652],
          [computeNodes[i].cx, 810],
        ],
        0.73,
        [
          [computeNodes[i].cx, 690],
          [computeNodes[i].cx, 780],
        ],
      ),
    ),
  );
  yield* all(
    storageLabel.text('Shared Storage  slurm-42.out', 0.4),
    flash(storage, COLOR.storage),
  );

  // 第 6 步：slurmdbd 記帳，compute node 回到 idle。
  yield* step('accounting');
  yield* setStep(6, 'Accounting');
  yield* send(
    'Record',
    [[710, 238], [950, 238], [1190, 238], [1190, 310]],
    1,
    [[860, 255], [1040, 255]],
  );
  yield* all(db.bottom.label.text('Job 42 completed', 0.33), flash(db.bottom.box));
  yield* all(
    ...computeNodes.flatMap(n => [n.state.text('idle', 0.2), n.fill.width(0, 0.33)]),
  );

  yield* step('done');
  yield* waitFor(0.27);
});
