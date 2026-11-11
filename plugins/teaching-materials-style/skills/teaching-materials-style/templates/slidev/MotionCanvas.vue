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
import {useSlideContext} from '@slidev/client';

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
const live = computed(() => ['slide', 'presenter', 'print'].includes($renderContext.value));
</script>

<template>
  <div class="motion-canvas">
    <iframe
      v-if="live"
      ref="frame"
      :src="url"
      tabindex="-1"
      title="Animation"
      loading="eager"
    />
  </div>
</template>

<style scoped>
.motion-canvas {
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 100%;
  border: 1.5px solid var(--line, #e2dfdc);
  background: #ffffff;
}
.motion-canvas iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  /* Clicks and keys stay with Slidev, so arrow keys keep turning slides. */
  pointer-events: none;
}
</style>
