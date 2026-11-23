/**
 * 可重複使用的零件：文字、方塊、一台機器。
 *
 * Motion Canvas 的元件就是回傳 JSX 的函式。需要播動畫的零件，
 * 由呼叫端建立 ref 傳進來，之後用 ref() 取得節點就能下動畫指令。
 */
import {Rect, Txt, type RectProps, type TxtProps} from '@motion-canvas/2d';
import {createRef, type Reference, type SignalValue} from '@motion-canvas/core';
import {COLOR, FONT, NODE, STROKE, serviceY} from '../theme';

/** 圖上所有文字共用的字體。 */
export const FONT_FAMILY = 'Inter, "Noto Sans", Helvetica, Arial, sans-serif';

/** 一般文字。字體與顏色集中在這裡，場景裡就不用每次重寫。 */
export function Label({
  text,
  fontSize = FONT.label,
  ...rest
}: {text: SignalValue<string>; fontSize?: number} & TxtProps) {
  return (
    <Txt
      text={text}
      fontFamily={FONT_FAMILY}
      fontSize={fontSize}
      fill={COLOR.ink}
      {...rest}
    />
  );
}

/** 有外框的方塊，用來表示一個服務或一個檔案。 */
export function Box({
  ref,
  text,
  fill = COLOR.service,
  width = NODE.width - NODE.padding * 2,
  height = NODE.serviceHeight,
  fontSize = FONT.service,
  ...rest
}: {
  ref?: Reference<Rect>;
  text: string;
  fontSize?: number;
} & RectProps) {
  return (
    <Rect
      ref={ref}
      width={width}
      height={height}
      fill={fill}
      stroke={COLOR.ink}
      lineWidth={STROKE}
      radius={0}
      justifyContent="center"
      alignItems="center"
      {...rest}
    >
      <Label text={text} fontSize={fontSize} />
    </Rect>
  );
}

/**
 * 一台機器：灰底容器，上面是機器名稱，中間是它跑的服務，
 * 最下面空一排，留給移動中的 job 卡片停靠。
 *
 * y 給的是機器的「上緣」（offset 設成 [0, -1]），四台的上緣因此會對齊。
 * 裡面的子元件座標則相對於機器的中心，所以用 theme 裡的 serviceY() 計算。
 */
export function NodeBox({
  ref,
  title,
  services,
  boxes = [],
  ...rest
}: {
  ref?: Reference<Rect>;
  title: string;
  services: string[];
  boxes?: Reference<Rect>[];
} & RectProps) {
  return (
    <Rect
      ref={ref}
      width={NODE.width}
      height={NODE.height}
      fill={COLOR.node}
      stroke={COLOR.ink}
      lineWidth={STROKE}
      radius={0}
      offset={[0, -1]}
      {...rest}
    >
      <Label
        text={title}
        fontSize={FONT.nodeTitle}
        x={-NODE.width / 2 + NODE.padding}
        y={-NODE.height / 2 + NODE.padding + FONT.nodeTitle / 2}
        offset={[-1, 0]}
      />
      {services.map((name, i) => (
        <Box ref={boxes[i] ?? createRef<Rect>()} text={name} y={serviceY(i)} />
      ))}
    </Rect>
  );
}
