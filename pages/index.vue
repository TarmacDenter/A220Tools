<script setup lang="ts">
import WindCheckerApp from '@/components/WindCheckerApp.vue'

defineOptions({
  name: 'HomePage',
})
</script>

<template>
  <NuxtLayout v-slot="{ theme, themeToggleLabel, toggleTheme }">
    <WindCheckerApp
      :theme="theme"
      :theme-toggle-label="themeToggleLabel"
      @toggle-theme="toggleTheme"
    />
  </NuxtLayout>
</template>
