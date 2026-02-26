<script setup lang="ts">
import WindCheckerApp from '@/components/WindCheckerApp.vue'
</script>

<template>
  <WindCheckerApp />
</template>

<style>
:root {
  --color-safe: #22c55e;
  --color-unsafe: #ef4444;
  --color-warning: #f59e0b;
  --color-assumption-bg: #f0f9ff;
  --color-text: #1e293b;
  --font-mono: 'Courier New', Courier, monospace;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f1f5f9;
  color: var(--color-text);
}

code {
  font-family: var(--font-mono);
  background: #e2e8f0;
  padding: 0.1em 0.3em;
  border-radius: 3px;
  font-size: 0.9em;
}
</style>
