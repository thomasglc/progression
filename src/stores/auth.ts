import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginDirectus, refreshDirectusToken, setAuthErrorHandler } from '../api/directus'

function tryGet(key: string): string | null {
  try { return sessionStorage.getItem(key) } catch { return null }
}
function trySet(key: string, val: string) {
  try { sessionStorage.setItem(key, val) } catch {}
}
function tryRemove(key: string) {
  try { sessionStorage.removeItem(key) } catch {}
}

// Refresh 2 minutes before expiry (Directus default: 15 min)
const REFRESH_INTERVAL = 13 * 60 * 1000

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(tryGet('admin_token'))
  const refreshToken = ref<string | null>(tryGet('admin_refresh'))
  const isAdmin = computed(() => !!token.value)

  let refreshTimer: ReturnType<typeof setTimeout> | null = null

  function scheduleRefresh() {
    if (refreshTimer) clearTimeout(refreshTimer)
    refreshTimer = setTimeout(doRefresh, REFRESH_INTERVAL)
  }

  async function doRefresh() {
    if (!refreshToken.value) { logout(); return }
    try {
      const tokens = await refreshDirectusToken(refreshToken.value)
      token.value = tokens.access_token
      refreshToken.value = tokens.refresh_token
      trySet('admin_token', tokens.access_token)
      trySet('admin_refresh', tokens.refresh_token)
      scheduleRefresh()
    } catch {
      logout()
    }
  }

  async function login(email: string, password: string): Promise<void> {
    const tokens = await loginDirectus(email, password)
    token.value = tokens.access_token
    refreshToken.value = tokens.refresh_token
    trySet('admin_token', tokens.access_token)
    trySet('admin_refresh', tokens.refresh_token)
    setAuthErrorHandler(logout)
    scheduleRefresh()
  }

  function logout(): void {
    token.value = null
    refreshToken.value = null
    if (refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null }
    tryRemove('admin_token')
    tryRemove('admin_refresh')
  }

  // Restore session on page reload
  if (token.value) {
    setAuthErrorHandler(logout)
    if (refreshToken.value) scheduleRefresh()
  }

  return { token, isAdmin, login, logout }
})
