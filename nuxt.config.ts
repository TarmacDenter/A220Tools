export default defineNuxtConfig({
  ssr: true,
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  css: ['~/assets/css/theme.css'],
  app: {
    head: {
      title: 'A220 Start Calc',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'theme-color', content: '#1e40af' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
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
    devStorage: {
      cache: { driver: 'memory' },
    },
    storage: {
      cache: { driver: 'redis', url: process.env.REDIS_URL },
    },
    experimental: {
      tasks: true,
    },
    scheduledTasks: {
      '0-59/30 * * * *': ['cache:prune-hits'],
    },
  },
});
