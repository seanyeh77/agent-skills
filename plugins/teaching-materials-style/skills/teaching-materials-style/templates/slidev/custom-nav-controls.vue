<script setup lang="ts">
// Accent picker at the right end of the Slidev nav bar (teaching-materials-style, Setup).
// Copy to the deck root as custom-nav-controls.vue (Slidev renders it in the nav bar) with
// utils/accent.ts next to it.
// The dot is a focusable div, not a <button>: Slidev turns its arrow-key shortcuts off while
// a button has focus, and Esc returns focus to the dot.
// Square swatches, no shadow, 1.5 px borders: the teaching preset has radius 0 and no shadows.
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { DEFAULT_ACCENT, PRESETS, applyAccent, normalize, storedAccent } from './utils/accent'

const open = ref(false)
const current = ref(DEFAULT_ACCENT)
const field = ref('')
const bad = ref(false)
const dot = ref<HTMLElement>()
const pop = ref<HTMLElement>()
const pos = ref({ left: 0, bottom: 0, width: 300 })

const checkedIndex = computed(() => PRESETS.findIndex(([, h]) => h === current.value))

onMounted(() => {
  current.value = storedAccent()
  field.value = current.value.slice(1)
})

function place() {
  const r = dot.value!.getBoundingClientRect()
  const width = Math.min(300, window.innerWidth - 16)
  const left = Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8))
  pos.value = { left, bottom: window.innerHeight - r.top + 8, width }
}

async function show() {
  current.value = storedAccent()
  field.value = current.value.slice(1)
  bad.value = false
  place()
  open.value = true
  await nextTick()
  const i = checkedIndex.value
  const radios = pop.value?.querySelectorAll<HTMLElement>('[role=radio]')
  ;(radios?.[i >= 0 ? i : 0] || pop.value?.querySelector('input'))?.focus()
  document.addEventListener('pointerdown', outside, true)
  window.addEventListener('resize', place)
}

function close(refocus: boolean) {
  open.value = false
  document.removeEventListener('pointerdown', outside, true)
  window.removeEventListener('resize', place)
  if (refocus) dot.value?.focus()
}

function outside(e: Event) {
  const t = e.target as Node
  if (pop.value?.contains(t) || dot.value?.contains(t)) return
  close(false)
}

function toggle() {
  open.value ? close(true) : show()
}

function choose(hex: string) {
  current.value = hex
  field.value = hex.slice(1)
  bad.value = false
  applyAccent(hex)
}

function onDotKey(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    e.stopPropagation()
    toggle()
  }
}

// Keys inside the popover never reach Slidev's slide shortcuts.
function onPopKey(e: KeyboardEvent) {
  e.stopPropagation()
  if (e.key === 'Escape') {
    e.preventDefault()
    close(true)
    return
  }
  const t = e.target as HTMLElement
  if (t.getAttribute('role') !== 'radio') return
  const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
  if (!(e.key in keys)) return
  e.preventDefault()
  const radios = [...pop.value!.querySelectorAll<HTMLElement>('[role=radio]')]
  const i = (radios.indexOf(t) + keys[e.key] + radios.length) % radios.length
  radios[i].focus()
  choose(PRESETS[i][1])
}

function onInput() {
  const h = normalize(field.value)
  if (h) {
    bad.value = false
    current.value = h
    field.value = h.slice(1)
    applyAccent(h)
  } else {
    bad.value = field.value.trim() !== ''
  }
}

onBeforeUnmount(() => close(false))
</script>

<template>
  <div class="acp-wrap">
    <div
      ref="dot"
      class="acp-dot"
      role="button"
      tabindex="0"
      aria-haspopup="dialog"
      :aria-expanded="open"
      aria-label="強調色"
      title="強調色"
      @click="toggle"
      @keydown="onDotKey"
    >
      <span :style="{ background: current }" />
    </div>
    <Teleport to="body">
      <div
        v-if="open"
        ref="pop"
        class="acp-pop"
        role="dialog"
        aria-label="強調色"
        :style="{ left: pos.left + 'px', bottom: pos.bottom + 'px', width: pos.width + 'px' }"
        @keydown="onPopKey"
      >
        <div class="acp-title">強調色</div>
        <div class="acp-swatches" role="radiogroup" aria-label="推薦色">
          <div
            v-for="([name, hex], i) in PRESETS"
            :key="hex"
            role="radio"
            class="acp-sw"
            :class="{ on: current === hex }"
            :aria-checked="current === hex"
            :aria-label="name + ' ' + hex"
            :title="name + ' ' + hex"
            :tabindex="(checkedIndex >= 0 ? checkedIndex : 0) === i ? 0 : -1"
            :style="{ '--sw': hex }"
            @click="choose(hex)"
          >
            <svg v-if="current === hex" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg>
          </div>
        </div>
        <label class="acp-label" for="acp-hex">色碼</label>
        <div class="acp-field" :class="{ bad }">
          <span>#</span>
          <input
            id="acp-hex"
            v-model="field"
            maxlength="7"
            spellcheck="false"
            autocomplete="off"
            :aria-invalid="bad"
            aria-describedby="acp-hint"
            @input="onInput"
          >
        </div>
        <div id="acp-hint" class="acp-hint" :class="{ bad }">
          {{ bad ? '色碼格式不正確：需要 6 個 0 到 9 或 a 到 f 的字元，例如 0e827d' : '輸入 6 碼色碼，可省略 #' }}
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style>
.acp-wrap { display: flex; align-items: center; padding: 0 6px; }
.acp-dot { width: 32px; height: 32px; display: grid; place-items: center; cursor: pointer; outline: none; }
.acp-dot span { width: 18px; height: 18px; box-shadow: 0 0 0 2px var(--surface), 0 0 0 3.5px var(--line-strong); }
.acp-dot:hover { background: rgba(156, 163, 175, 0.15); }
.acp-dot:focus-visible { box-shadow: 0 0 0 2px var(--focus-ring); }
.acp-pop {
  position: fixed; z-index: 200; box-sizing: border-box; padding: 16px;
  background: var(--surface); color: var(--ink); border: 1.5px solid var(--line);
  font: 14px/1.5 var(--font-sans);
}
.acp-title { font-weight: 700; margin-bottom: 10px; }
.acp-swatches { display: grid; grid-template-columns: repeat(8, 1fr); gap: 8px; margin-bottom: 14px; }
.acp-sw { aspect-ratio: 1; min-width: 24px; background: var(--sw); cursor: pointer; display: grid; place-items: center; outline: none; }
.acp-sw.on { box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--sw); }
.acp-sw:focus-visible { box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--ink); }
.acp-sw svg { width: 60%; height: 60%; fill: none; stroke: #ffffff; stroke-width: 2.4; stroke-linecap: square; }
.acp-label { display: block; font-weight: 600; margin-bottom: 4px; }
.acp-field { display: flex; align-items: center; gap: 4px; height: 40px; padding: 0 10px; border: 1.5px solid var(--line); font-family: var(--font-mono); }
.acp-field:focus-within { border-color: var(--accent); }
.acp-field.bad { border-color: var(--danger); }
.acp-field span { color: var(--ink-muted); }
.acp-field input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; font: inherit; color: inherit; }
.acp-hint { margin-top: 6px; font-size: 13px; color: var(--ink-muted); }
.acp-hint.bad { color: var(--danger-text); }
@media print { .acp-wrap, .acp-pop { display: none !important; } }
</style>
