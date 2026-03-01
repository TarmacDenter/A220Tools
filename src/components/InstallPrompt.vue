<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const dismissedNative = ref(false)
const dismissedIos = ref(false)
const installed = ref(false)
const isInStandalone = ref(false)
const supportsBeforeInstallPrompt = ref(false)

let standaloneMediaQuery: MediaQueryList | null = null
const hasNavigator = typeof window !== 'undefined' && typeof window.navigator !== 'undefined'

function detectStandalone() {
  if (!hasNavigator) {
    isInStandalone.value = false
    return
  }

  const mediaStandalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false
  const navigatorStandalone = 'standalone' in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  isInStandalone.value = mediaStandalone || navigatorStandalone
}

const isIos = computed(() => {
  if (!hasNavigator) return false

  const ua = window.navigator.userAgent
  const platform = window.navigator.platform
  const touchPoints = window.navigator.maxTouchPoints ?? 0
  const iosUa = /iPad|iPhone|iPod/.test(ua)
  const ipadOsUa = platform === 'MacIntel' && touchPoints > 1
  return iosUa || ipadOsUa
})

const showNativeInstallCta = computed(() =>
  !dismissedNative.value && !installed.value && !isInStandalone.value && deferredPrompt.value !== null
)

const showIosInstructions = computed(() =>
  isIos.value &&
  !supportsBeforeInstallPrompt.value &&
  !dismissedIos.value &&
  !installed.value &&
  !isInStandalone.value
)

function handleBeforeInstallPrompt(event: Event) {
  event.preventDefault()
  supportsBeforeInstallPrompt.value = true
  deferredPrompt.value = event as BeforeInstallPromptEvent
}

function handleInstalled() {
  installed.value = true
  deferredPrompt.value = null
  detectStandalone()
}

function dismissNativePrompt() {
  dismissedNative.value = true
}

function dismissIosPrompt() {
  dismissedIos.value = true
}

async function triggerInstall() {
  if (!deferredPrompt.value) return

  await deferredPrompt.value.prompt()
  const choice = await deferredPrompt.value.userChoice
  if (choice.outcome === 'accepted') {
    installed.value = true
  }
  deferredPrompt.value = null
}

onMounted(() => {
  detectStandalone()
  standaloneMediaQuery = window.matchMedia?.('(display-mode: standalone)') ?? null
  standaloneMediaQuery?.addEventListener?.('change', detectStandalone)
  standaloneMediaQuery?.addListener?.(detectStandalone)
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', handleInstalled)
})

onUnmounted(() => {
  standaloneMediaQuery?.removeEventListener?.('change', detectStandalone)
  standaloneMediaQuery?.removeListener?.(detectStandalone)
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.removeEventListener('appinstalled', handleInstalled)
})
</script>

<template>
  <div v-if="showNativeInstallCta" class="install-banner" role="status" aria-live="polite">
    <div class="install-copy">
      <strong>Install app:</strong>
      Add this tool to your home screen for faster access and offline calculator use.
    </div>
    <div class="install-actions">
      <button class="install-btn primary" @click="triggerInstall">Install</button>
      <button class="install-btn secondary" @click="dismissNativePrompt">Dismiss</button>
    </div>
  </div>

  <div v-else-if="showIosInstructions" class="install-banner" role="status" aria-live="polite">
    <div class="install-copy">
      <strong>Install on iPhone:</strong>
      Open the browser Share menu, then tap Add to Home Screen. In Chrome this may appear as Share <em>then</em> Add to Home Screen; in Safari it is in the Share sheet.
    </div>
    <div class="install-actions">
      <button class="install-btn secondary" @click="dismissIosPrompt">Dismiss</button>
    </div>
  </div>
</template>

<style scoped>
.install-banner {
  align-items: center;
  background: var(--color-info-bg);
  border: 1px solid var(--color-info-border);
  border-radius: 8px;
  color: var(--color-info-text);
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: space-between;
  margin: 0 0 1rem;
  padding: 0.75rem 1rem;
}

.install-copy {
  font-size: 0.9rem;
}

.install-actions {
  display: flex;
  gap: 0.5rem;
}

.install-btn {
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.4rem 0.75rem;
}

.install-btn.primary {
  background: var(--color-primary);
  color: var(--color-primary-text);
}

.install-btn.primary:hover {
  background: var(--color-primary-hover);
}

.install-btn.secondary {
  background: var(--color-secondary-bg);
  color: var(--color-secondary-text);
}

.install-btn.secondary:hover {
  background: var(--color-secondary-hover);
}
</style>
