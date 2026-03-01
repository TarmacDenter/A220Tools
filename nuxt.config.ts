export default defineNuxtConfig({
  ssr: true,
  srcDir: '.',
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  alias: {
    '@': '/src',
  },
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
      appBaseUrl: '/',
    },
  },
})
