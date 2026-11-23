/**
 * 版面檢查：給 scripts/check_motion.py 呼叫（window.__motion.audit()）。
 *
 * 畫布上的東西不在 DOM 裡，瀏覽器量不到，所以直接走 Motion Canvas 的場景樹，
 * 把每個看得到的文字換算成畫布座標（1920 x 1080，左上角是 0, 0）再比對：
 *
 *   outside  文字跑出畫布
 *   overflow 文字超出它所在的方塊
 *   overlap  兩段文字互相重疊
 *   small    字級小於 MIN_FONT
 */
import {Rect, Txt, type Node, type View2D} from '@motion-canvas/2d';

const CANVAS = {width: 1920, height: 1080};
const MIN_FONT = 24;
const TOLERANCE = 1;

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface Issue {
  kind: 'outside' | 'overflow' | 'overlap' | 'small';
  text: string;
  other?: string;
  detail: string;
}

/** 節點在畫布上的外框。只取四個角換算，旋轉過的節點會得到外接矩形。 */
function worldBox(node: Node, inset = 0): Box {
  const local = (node as any).getCacheBBox();
  const m = node.localToWorld();
  const xs: number[] = [];
  const ys: number[] = [];
  for (const [x, y] of [
    [local.x + inset, local.y + inset],
    [local.x + local.width - inset, local.y + inset],
    [local.x + inset, local.y + local.height - inset],
    [local.x + local.width - inset, local.y + local.height - inset],
  ]) {
    const p = new DOMPoint(x, y).matrixTransform(m);
    xs.push(p.x);
    ys.push(p.y);
  }
  return {
    left: Math.min(...xs),
    top: Math.min(...ys),
    right: Math.max(...xs),
    bottom: Math.max(...ys),
  };
}

const inside = (a: Box, b: Box) =>
  a.left >= b.left - TOLERANCE &&
  a.top >= b.top - TOLERANCE &&
  a.right <= b.right + TOLERANCE &&
  a.bottom <= b.bottom + TOLERANCE;

const overlaps = (a: Box, b: Box) =>
  a.left < b.right - TOLERANCE &&
  b.left < a.right - TOLERANCE &&
  a.top < b.bottom - TOLERANCE &&
  b.top < a.bottom - TOLERANCE;

const fmt = (b: Box) =>
  `[${Math.round(b.left)}, ${Math.round(b.top)}, ${Math.round(b.right)}, ${Math.round(b.bottom)}]`;

/** 最近一層有底色的方塊，文字應該待在它裡面。 */
function containerOf(node: Node): Rect | null {
  for (let p = node.parent(); p; p = p.parent()) {
    if (p instanceof Rect && p.fill() !== null) return p;
  }
  return null;
}

export function audit(view: View2D): Issue[] {
  const canvasScale = Math.abs(view.localToWorld().a) || 1;
  const issues: Issue[] = [];
  const texts = view
    .findAll<Txt>(n => n instanceof Txt)
    .filter(t => t.absoluteOpacity() > 0.05 && t.text().trim() !== '');

  const canvas: Box = {left: 0, top: 0, right: CANVAS.width, bottom: CANVAS.height};
  const boxes = texts.map(t => worldBox(t));

  texts.forEach((t, i) => {
    const b = boxes[i];
    const label = t.text();
    if (!inside(b, canvas)) {
      issues.push({kind: 'outside', text: label, detail: `text ${fmt(b)} vs canvas`});
    }
    const parent = containerOf(t);
    if (parent && parent.absoluteOpacity() > 0.05) {
      const pb = worldBox(parent, parent.lineWidth());
      if (!inside(b, pb)) {
        issues.push({kind: 'overflow', text: label, detail: `text ${fmt(b)} vs box ${fmt(pb)}`});
      }
    }
    // 字級換算成畫布上的大小：乘上所有祖先的縮放
    const scale = Math.abs(t.localToWorld().a) / canvasScale;
    const size = t.fontSize() * scale;
    if (size < 0.05 * t.fontSize()) return; // 縮成 0 的節點（還沒彈出）看不到，略過
    if (size < MIN_FONT - 0.5) {
      issues.push({kind: 'small', text: label, detail: `${size.toFixed(1)} px < ${MIN_FONT} px`});
    }
  });

  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      if (overlaps(boxes[i], boxes[j])) {
        issues.push({
          kind: 'overlap',
          text: texts[i].text(),
          other: texts[j].text(),
          detail: `${fmt(boxes[i])} and ${fmt(boxes[j])}`,
        });
      }
    }
  }
  return issues;
}
