export default defineNuxtConfig({
  ssr: true,
  srcDir: '.',
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  alias: {
    '@': '/src',
  },
  runtimeConfig: {
    avwxToken: '',
    public: {
      appBaseUrl: '/',
    },
  },
})
