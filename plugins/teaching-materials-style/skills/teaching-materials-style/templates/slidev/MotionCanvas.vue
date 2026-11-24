<!--
  Plays a Motion Canvas animation inside a Slidev slide, one step per click.

  Build the animation (templates/motion-canvas, `npm run build`) and copy its
  dist/ folder into the deck's public/ folder, for example public/motion/.

    <MotionCanvas src="motion/index.html" scene="clusterFlow" :steps="7" />

  steps is the number of step() (or beginSlide) calls in the scene; check_motion.py
  prints it. The component takes that many clicks, counted like v-click, so it
  works next to other v-click elements. at works like v-click's at: the default
  '+1' starts on the next click; give an absolute number to share clicks with the
  note column. Click k plays the segment after the k-th step(); going back shows
  the earlier state at once, without replaying.
-->
<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {useIsSlideActive, useSlideContext} from '@slidev/client';

const props = withDefaults(
  defineProps<{
    src: string;
    scene?: string;
    steps: number;
    /** like v-click's at: where the first step starts, default '+1' (the next click) */
    at?: string | number;
  }>(),
  {at: '+1'},
);

const {$clicksContext, $renderContext} = useSlideContext();
const frame = ref<HTMLIFrameElement>();
const ready = ref(false);

// Register the clicks in mounted, like v-click does, so elements before this one
// on the slide take their clicks first.
const marker = {};
const clicks = ref<{start: number} | null>(null);
onMounted(() => {
  const info = $clicksContext.calculateSince(props.at, props.steps);
  $clicksContext.register(marker as any, info);
  clicks.value = info;
});
onBeforeUnmount(() => $clicksContext.unregister(marker as any));

/** 0 before the first click of this component, then 1 .. steps. */
const stage = computed(() => {
  if (!clicks.value) return 0;
  const done = $clicksContext.current - clicks.value.start + 1;
  return Math.max(0, Math.min(done, props.steps));
});

const url = computed(() => {
  const isAbsolute = /^(https?:)?\//.test(props.src);
  const base = isAbsolute ? props.src : import.meta.env.BASE_URL + props.src;
  const query = new URLSearchParams({embed: '1'});
  if (props.scene) query.set('scene', props.scene);
  return `${base}${base.includes('?') ? '&' : '?'}${query}`;
});

function send() {
  frame.value?.contentWindow?.postMessage({type: 'motion:goto', index: stage.value}, '*');
}

function onMessage(event: MessageEvent) {
  if (event.source !== frame.value?.contentWindow) return;
  const data = event.data;
  if (data?.type !== 'motion:info' || !data.count) return; // count is 0 until the scene is loaded
  if (!ready.value) {
    ready.value = true;
    if (data.count !== props.steps) {
      console.warn(
        `[MotionCanvas] ${props.scene ?? props.src} has ${data.count} steps, but steps="${props.steps}"`,
      );
    }
    send();
  }
}

onMounted(() => window.addEventListener('message', onMessage));
onBeforeUnmount(() => window.removeEventListener('message', onMessage));
watch(stage, () => ready.value && send());

// Thumbnails (overview, next-slide preview) do not need a running animation.
// Slidev keeps the neighbouring slides mounted but hidden with display: none, where Motion
// Canvas would measure every box and text as size 0. So in the deck view the iframe is
// teleported to a page-level layer: it loads while the slide is still hidden (parked
// transparent behind the deck), and is laid over this slide's frame once the slide is shown.
// Arriving on the slide then shows an animation that is already loaded and at the right step.
const isActive = useIsSlideActive();
const floating = computed(() => $renderContext.value === 'slide');
const live = computed(
  () =>
    ['slide', 'presenter', 'print'].includes($renderContext.value) &&
    (floating.value || $renderContext.value === 'print' || isActive.value),
);

const box = ref<HTMLElement>();
const rect = ref({left: 0, top: 0, width: 1374, height: 773});
let raf = 0;
function track() {
  const el = box.value;
  if (el && isActive.value) {
    const r = el.getBoundingClientRect();
    if (r.width > 0) {
      const c = rect.value;
      if (c.left !== r.left || c.top !== r.top || c.width !== r.width || c.height !== r.height)
        rect.value = {left: r.left, top: r.top, width: r.width, height: r.height};
    }
  }
  raf = requestAnimationFrame(track);
}
onMounted(() => {
  if (floating.value) raf = requestAnimationFrame(track);
});
onBeforeUnmount(() => cancelAnimationFrame(raf));
const floatStyle = computed(() => {
  const r = rect.value;
  // While the slide is hidden the frame stays inside the window, transparent and behind the
  // deck: Chrome stops rendering iframes that are off-screen, which would freeze a step that
  // is still playing.
  const shown = isActive.value;
  return {
    left: `${r.left}px`,
    top: `${r.top}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
    opacity: shown ? 1 : 0,
    zIndex: shown ? 1 : -1,
  };
});

watch(live, on => {
  if (!on) ready.value = false;
});
// Leaving the slide hides the floating frame at once (before the next paint).
watch(isActive, on => {
  if (on) {
    const el = box.value;
    const r = el?.getBoundingClientRect();
    if (r && r.width > 0) rect.value = {left: r.left, top: r.top, width: r.width, height: r.height};
  }
});

// If the animation has not reported back a few seconds after the iframe appears
// (slow network, a request that stalled), load it once more instead of leaving a
// blank frame.
const attempt = ref(0);
let retry: ReturnType<typeof setTimeout> | undefined;
watch(
  [live, attempt],
  ([on]) => {
    clearTimeout(retry);
    if (on)
      retry = setTimeout(() => {
        if (!ready.value && attempt.value < 2) attempt.value++;
      }, 6000);
  },
  {immediate: true},
);
watch(ready, r => r && clearTimeout(retry));
onBeforeUnmount(() => clearTimeout(retry));

// The animation reads the viewer's accent (ui-accent) when it loads. When the viewer picks
// another color in the deck (accent.ts fires 'ui-accent-change'), reload it so the
// highlighted element follows; it returns to the current step on its own.
const recolor = ref(0);
const onAccent = () => {
  if (!live.value) return;
  ready.value = false;
  recolor.value++;
};
onMounted(() => window.addEventListener('ui-accent-change', onAccent));
onBeforeUnmount(() => window.removeEventListener('ui-accent-change', onAccent));
</script>

<template>
  <div ref="box" class="motion-canvas">
    <!-- In the deck view the iframe lives in a page-level layer (see floating below), so it
         can load while this slide is still hidden; elsewhere it stays in place. -->
    <Teleport to="body" :disabled="!floating">
      <iframe
        v-if="live"
        :key="`${attempt}-${recolor}`"
        ref="frame"
        :class="{'mc-floating': floating}"
        :style="floating ? floatStyle : undefined"
        :src="url"
        tabindex="-1"
        title="Animation"
        loading="eager"
      />
    </Teleport>
  </div>
</template>

<style scoped>
.motion-canvas {
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 100%;
  /* No frame: the canvas uses the slide background, so the animation sits on the page. */
  background: var(--bg, #fcfbfb);
}
.motion-canvas iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  /* Clicks and keys stay with Slidev, so arrow keys keep turning slides. */
  pointer-events: none;
}
.mc-floating {
  position: fixed;
  display: block;
  border: 0;
  z-index: 1;
  pointer-events: none;
  background: var(--bg, #fcfbfb);
}
</style>
