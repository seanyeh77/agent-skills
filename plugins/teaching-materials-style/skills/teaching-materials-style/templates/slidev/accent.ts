// Viewer-chosen accent color for a Slidev deck, following setAccent() in
// seanyeh77/ui-design-system (packages/ui/src/theme.ts): same storage key, presets and
// derivation, so a light accent never makes text unreadable.
//
// Copy to the deck's utils/accent.ts. setup/main.ts calls applyAccent(storedAccent(), true)
// once; custom-nav-controls.vue is the picker. applyAccent() also fires a
// 'ui-accent-change' event on window so other parts of the deck (MotionCanvas.vue)
// can follow the new color.

export const ACCENT_KEY = 'ui-accent'
/** The deck's default: 青 #0f8a85 for the teaching theme, 藍 #2457d6 for the UI variant.
 *  It must be one of PRESETS, so a viewer can always pick it again. */
export const DEFAULT_ACCENT = '#0f8a85'

// The design system's 8 recommended swatches (AccentPicker).
export const PRESETS: [string, string][] = [
  ['藍', '#2457d6'],
  ['靛', '#5b4fd6'],
  ['紫', '#8a4fd6'],
  ['桃紅', '#c2407a'],
  ['紅', '#cd3a2f'],
  ['橘', '#c4600f'],
  ['綠', '#1b8a4d'],
  ['青', '#0f8a85'],
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

// Light theme only: darken 4 % at a time until the text reads 4.5:1 on bg and surface.
function accentText(hex: string, bg: string, surface: string) {
  const reads = (c: string) => contrast(c, bg) >= 4.5 && contrast(c, surface) >= 4.5
  let text = hex
  for (let k = 1; k * 0.04 <= 1 && !reads(text); k++) text = mixHex(hex, '#000000', k * 0.04)
  return text
}

/** Accepts rrggbb with or without #; returns #rrggbb or null. */
export function normalize(v: string): string | null {
  const s = v.trim().replace(/^#/, '')
  return /^[0-9a-fA-F]{6}$/.test(s) ? '#' + s.toLowerCase() : null
}

export function storedAccent(): string {
  try {
    return normalize(localStorage.getItem(ACCENT_KEY) || '') || DEFAULT_ACCENT
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
  // Light-theme neutrals of the teaching preset (bg, surface, ink).
  const bg = '#fcfbfb'
  const surface = '#ffffff'
  const ink = '#171512'
  const vars: Record<string, string> = {
    '--accent': h,
    '--accent-hover': mixHex(h, '#000000', 0.12),
    '--accent-press': mixHex(h, '#000000', 0.22),
    '--accent-soft': mixHex('#ffffff', h, 0.12),
    '--accent-text': accentText(h, bg, surface),
    '--on-accent': contrast('#ffffff', h) >= contrast(ink, h) ? '#ffffff' : ink,
    '--focus-ring': `rgba(${hexRgb(h).join(', ')}, 0.3)`,
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
