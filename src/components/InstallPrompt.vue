<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const dismissed = ref(false)
const installed = ref(false)

const canInstall = computed(() => !dismissed.value && !installed.value && deferredPrompt.value !== null)

function handleBeforeInstallPrompt(event: Event) {
  event.preventDefault()
  deferredPrompt.value = event as BeforeInstallPromptEvent
}

function handleInstalled() {
  installed.value = true
  deferredPrompt.value = null
}

function dismissPrompt() {
  dismissed.value = true
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
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', handleInstalled)
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.removeEventListener('appinstalled', handleInstalled)
})
</script>

<template>
  <div v-if="canInstall" class="install-banner" role="status" aria-live="polite">
    <div class="install-copy">
      <strong>Install app:</strong>
      Add this tool to your home screen for faster access and offline calculator use.
    </div>
    <div class="install-actions">
      <button class="install-btn primary" @click="triggerInstall">Install</button>
      <button class="install-btn secondary" @click="dismissPrompt">Dismiss</button>
    </div>
  </div>
</template>

<style scoped>
.install-banner {
  align-items: center;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  color: #1e3a8a;
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
  background: #1d4ed8;
  color: #fff;
}

.install-btn.primary:hover {
  background: #1e40af;
}

.install-btn.secondary {
  background: #dbeafe;
  color: #1e3a8a;
}

.install-btn.secondary:hover {
  background: #bfdbfe;
}
</style>
