export default defineNuxtConfig({
  ssr: true,
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  css: ['~/assets/css/theme.css'],
  app: {
    head: {
      title: 'A220 Start Calc — Tailwind Limit Calculator for Pilots',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'theme-color', content: '#1e40af' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'description', content: 'Real-time tailwind limit calculations for Airbus A220 pilots. Enter an airport ICAO code to check runway wind conditions from live METAR data.' },
        { name: 'keywords', content: 'A220, tailwind, wind limits, METAR, runway, pilot tool, Airbus A220, start calculator' },
        { property: 'og:title', content: 'A220 Start Calc — Tailwind Limit Calculator for Pilots' },
        { property: 'og:description', content: 'Real-time METAR-based tailwind limit checks for A220 pilots. Enter any ICAO airport code for instant runway wind analysis.' },
        { property: 'og:type', content: 'website' },
      ],
      link: [
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/icons/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/icons/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/icons/favicon-16x16.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
      ],
    },
  },
  runtimeConfig: {
    public: {
      appBaseUrl: process.env.NUXT_PUBLIC_APP_BASE_URL || '/',
    },
  },
  nitro: {
    storage: {
      hits: process.env.REDIS_URL
        ? { driver: 'redis', url: process.env.REDIS_URL }
        : { driver: 'memory' },
    },
    experimental: {
      tasks: true,
    },
    scheduledTasks: {
      '0-59/30 * * * *': ['cache:prune-hits'],
    },
  },
});
