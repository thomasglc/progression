import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginDirectus } from '../api/directus'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(
    (() => { try { return sessionStorage.getItem('admin_token') } catch { return null } })()
  )

  const isAdmin = computed(() => !!token.value)

  async function login(email: string, password: string): Promise<void> {
    const t = await loginDirectus(email, password)
    token.value = t
    try { sessionStorage.setItem('admin_token', t) } catch {}
  }

  function logout(): void {
    token.value = null
    try { sessionStorage.removeItem('admin_token') } catch {}
  }

  return { token, isAdmin, login, logout }
})
