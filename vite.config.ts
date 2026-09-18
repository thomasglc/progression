import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const directusUrl = env.VITE_DIRECTUS_URL || 'https://back.galocha.fr'

  return {
    plugins: [vue()],
    base: mode === 'production' ? '/progression/' : '/',
    server: {
      proxy: {
        '/directus-api': {
          target: directusUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/directus-api/, ''),
        },
      },
    },
  }
})
