// Viewer-chosen accent color for a Slidev deck, following setAccent() in
// seanyeh77/ui-design-system (packages/ui/src/theme.ts): same storage key, presets and
// derivation, so a light accent never makes text unreadable.
//
// Copy to the deck's utils/accent.ts. setup/main.ts calls applyAccent(storedAccent(), true)
// once; custom-nav-controls.vue is the picker. applyAccent() also fires a
// 'ui-accent-change' event on window so other parts of the deck (MotionCanvas.vue)
// can follow the new color.

export const ACCENT_KEY = 'ui-accent'
/** The deck's default: 青 #027874 for the teaching theme, 藍 #2457d6 for the UI variant.
 *  It must be one of PRESETS, so a viewer can always pick it again. */
export const DEFAULT_ACCENT = '#027874'

// The design system's 8 recommended swatches (AccentPicker). In the light theme each one
// reads as text by itself (4.5:1 on bg, surface, surface-sub and its own accent-soft) and
// white text reads on it (4.5:1).
export const PRESETS: [string, string][] = [
  ['藍', '#2457d6'],
  ['靛', '#5b4fd6'],
  ['紫', '#864ad1'],
  ['桃紅', '#ba3873'],
  ['紅', '#c53228'],
  ['橘', '#ab5101'],
  ['綠', '#077b42'],
  ['青', '#027874'],
]

const hexRgb = (x: string) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16))

function mixHex(a: string, b: string, t: number) {
  const p = hexRgb(a)
  const q = hexRgb(b)
  return '#' + p.map((v, i) => Math.round(v + (q[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

function lum(x: string) {
  const w = [0.2126, 0.7152, 0.0722]
  return hexRgb(x)
    .map((v) => {
      v /= 255
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    })
    .reduce((s, v, i) => s + v * w[i], 0)
}

function contrast(a: string, b: string) {
  const x = lum(a)
  const y = lum(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

// Swatches whose color changed so they read as text on every ground: a stored old value
// moves to the new one.
const RENAMED: Record<string, string> = {
  '#8a4fd6': '#864ad1',
  '#c2407a': '#ba3873',
  '#cd3a2f': '#c53228',
  '#b85a0e': '#ab5101',
  '#1a844a': '#077b42',
  '#0e827d': '#027874',
}

const INK = '#171512'
const onFill = (fill: string) => (contrast('#ffffff', fill) >= contrast(INK, fill) ? '#ffffff' : INK)

// Light theme only: darken 4 % at a time until the text reads 4.5:1 on every ground.
function accentText(hex: string, grounds: string[]) {
  const reads = (c: string) => grounds.every((g) => contrast(c, g) >= 4.5)
  let text = hex
  for (let k = 1; k * 0.04 <= 1 && !reads(text); k++) text = mixHex(hex, '#000000', k * 0.04)
  return text
}

// Light theme only: darken 4 % at a time until the fill reaches 3:1 on every ground and its
// text (white or ink) 4.5:1 on it.
function accentFill(hex: string, grounds: string[]) {
  const ok = (c: string) => grounds.every((g) => contrast(c, g) >= 3) && contrast(onFill(c), c) >= 4.5
  let fill = hex
  for (let k = 1; k * 0.04 <= 1 && !ok(fill); k++) fill = mixHex(hex, '#000000', k * 0.04)
  return fill
}

/** Accepts rrggbb with or without #; returns #rrggbb or null. */
export function normalize(v: string): string | null {
  const s = v.trim().replace(/^#/, '')
  return /^[0-9a-fA-F]{6}$/.test(s) ? '#' + s.toLowerCase() : null
}

export function storedAccent(): string {
  try {
    const v = normalize(localStorage.getItem(ACCENT_KEY) || '')
    if (!v) return DEFAULT_ACCENT
    const now = RENAMED[v]
    if (now) localStorage.setItem(ACCENT_KEY, now)
    return now ?? v
  } catch {
    return DEFAULT_ACCENT
  }
}

/** Derives every accent token from one color and applies it. The deck pins its tokens
 *  on body and #app (so a dark host page cannot override them), so the derived values
 *  are set inline on html, body and #app. quiet: apply without storing. */
export function applyAccent(hex: string, quiet = false) {
  const h = normalize(hex)
  if (!h || typeof document === 'undefined') return
  // Light-theme grounds of the teaching preset (bg, surface, surface-sub) and the accent's
  // own soft fill (a highlighted code line).
  const soft = mixHex('#ffffff', h, 0.12)
  const grounds = ['#fcfbfb', '#ffffff', '#f6f5f4', soft]
  const text = accentText(h, grounds)
  const fill = accentFill(h, grounds)
  const vars: Record<string, string> = {
    '--accent': fill,
    '--accent-hover': mixHex(fill, '#000000', 0.12),
    '--accent-press': mixHex(fill, '#000000', 0.22),
    '--accent-soft': soft,
    '--accent-text': text,
    '--on-accent': onFill(fill),
    // The focus outline: 2 px in the accent's text color, 3:1 or more on every ground.
    '--focus': text,
    '--focus-ring': text,
  }
  const targets = [document.documentElement, document.body, document.getElementById('app')]
  for (const el of targets) {
    if (!el) continue
    for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v)
  }
  if (!quiet) {
    try {
      localStorage.setItem(ACCENT_KEY, h)
    } catch {}
    window.dispatchEvent(new CustomEvent('ui-accent-change', { detail: h }))
  }
}
