<script setup lang="ts">
defineOptions({ name: 'ActivityPage' })

const { data, status } = await useFetch<{ icao: string; hits: number; uniqueCallers: number }[]>('/api/activity')
</script>

<template>
  <NuxtLayout v-slot="{ theme }">
    <main class="activity-main" :data-theme="theme">
      <header class="activity-header">
        <NuxtLink to="/" class="back-btn" aria-label="Back to wind checker">
          <svg viewBox="0 0 24 24" class="back-icon" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </NuxtLink>
        <h1 class="activity-title">Recent Activity</h1>
        <p class="activity-subtitle">Airport lookups in the past 24 hours</p>
      </header>

      <div v-if="status === 'pending'" class="activity-state">
        Loading…
      </div>

      <div v-else-if="!data || data.length === 0" class="activity-state">
        No activity in the past 24 hours.
      </div>

      <table v-else class="activity-table">
        <thead>
          <tr>
            <th>Airport (ICAO)</th>
            <th class="hits-col">Lookups (24h)</th>
            <th class="hits-col">Unique callers</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in data" :key="row.icao">
            <td class="icao-cell">{{ row.icao }}</td>
            <td class="hits-cell">{{ row.hits }}</td>
            <td class="hits-cell">{{ row.uniqueCallers }}</td>
          </tr>
        </tbody>
      </table>
    </main>
  </NuxtLayout>
</template>

<style scoped>
.activity-main {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

.activity-header {
  margin-bottom: 1.5rem;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.85rem;
  margin-bottom: 1rem;
  transition: color 0.15s ease;
}

.back-btn:hover {
  color: var(--color-text);
}

.back-icon {
  width: 1rem;
  height: 1rem;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.activity-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.activity-subtitle {
  font-size: 0.95rem;
  color: var(--color-text-muted);
  margin: 0.25rem 0 0;
}

.activity-state {
  margin: 2rem 0;
  padding: 1.5rem;
  background: var(--color-surface-muted);
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.activity-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.activity-table th {
  text-align: left;
  padding: 0.6rem 0.75rem;
  border-bottom: 2px solid var(--color-border-strong);
  color: var(--color-text-subtle);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.activity-table td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
}

.activity-table tbody tr:last-child td {
  border-bottom: none;
}

.activity-table tbody tr:hover td {
  background: var(--color-surface-muted);
}

.hits-col,
.hits-cell {
  text-align: right;
}

.icao-cell {
  font-family: var(--font-mono);
  font-weight: 600;
}
</style>
