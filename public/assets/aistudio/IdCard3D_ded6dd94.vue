<template>
  <div
    ref="host"
    class="idcard-stage"
    role="img"
    :aria-label="`Interactive 3D ID card for ${profile.firstName} ${profile.lastName}. Drag to swing, click to flip, pull down to switch light and dark mode.`"
  ></div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { HangingCard } from '../three/HangingCard'
import { profile, theme } from '../data/profile'
import { mode, playClick, toggleTheme } from '../composables/useTheme'
import { haptic } from '../utils/haptics'

const emit = defineEmits(['pull'])

const host = ref(null)
let card = null
let resizeObserver = null
let visibilityObserver = null
let unmounted = false
let lastPull = 0
let unmountDebug = null

// Canvas text needs the web fonts loaded before the textures are drawn.
function loadFonts() {
  const fonts = ['700 100px "Space Grotesk"', '500 100px "Space Grotesk"', '500 24px "JetBrains Mono"']
  const ready = Promise.all(fonts.map((f) => document.fonts.load(f)))
  const timeout = new Promise((resolve) => setTimeout(resolve, 2500))
  return Promise.race([ready, timeout]).catch(() => {})
}

onMounted(async () => {
  // `?debug` shows motion-sensor diagnostics (loaded only when asked for).
  if (new URLSearchParams(location.search).has('debug')) {
    import('../three/motionDebug').then(({ mountMotionDebug }) => {
      if (!unmounted) unmountDebug = mountMotionDebug(() => card)
    })
  }

  await loadFonts()
  if (unmounted) return

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  card = new HangingCard(host.value, {
    profile,
    theme,
    mode: mode.value,
    reducedMotion,
    onPull: (progress) => {
      // Light tick the moment the pull switch arms.
      if (progress >= 1 && lastPull < 1) haptic(12)
      lastPull = progress
      emit('pull', progress)
    },
    onToggle: (origin) => {
      playClick()
      toggleTheme(origin)
    },
  })

  resizeObserver = new ResizeObserver(() => card.resize())
  resizeObserver.observe(host.value)
  visibilityObserver = new IntersectionObserver(([entry]) => card.setActive(entry.isIntersecting))
  visibilityObserver.observe(host.value)
})

watch(mode, (m) => card?.setMode(m))

onBeforeUnmount(() => {
  unmounted = true
  unmountDebug?.()
  resizeObserver?.disconnect()
  visibilityObserver?.disconnect()
  card?.dispose()
})
</script>

<style scoped>
.idcard-stage {
  position: absolute;
  inset: 0;
}

.idcard-stage :deep(.idcard-canvas) {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: pan-y;
}
</style>
