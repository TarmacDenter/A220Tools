<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import InstallPrompt from '@/components/InstallPrompt.vue'

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'a220-theme'
const theme = ref<Theme>('dark')

const themeToggleLabel = computed(() =>
  theme.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
)

function applyTheme(nextTheme: Theme) {
  theme.value = nextTheme
  document.documentElement.setAttribute('data-theme', nextTheme)
  window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
}

function toggleTheme() {
  applyTheme(theme.value === 'dark' ? 'light' : 'dark')
}

onMounted(() => {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (storedTheme === 'light' || storedTheme === 'dark') {
    applyTheme(storedTheme)
    return
  }

  applyTheme('dark')
})
</script>

<template>
  <div class="app-shell">
    <InstallPrompt />
    <slot :theme="theme" :theme-toggle-label="themeToggleLabel" :toggle-theme="toggleTheme" />
  </div>
</template>
