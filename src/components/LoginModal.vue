<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const emit = defineEmits<{ close: [] }>()

const auth = useAuthStore()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  if (!email.value || !password.value) return
  loading.value = true
  error.value = ''
  try {
    await auth.login(email.value, password.value)
    emit('close')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erreur de connexion'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal" style="max-width:360px">
      <div class="modal-title">Connexion administration</div>
      <form @submit.prevent="submit" style="display:flex;flex-direction:column;gap:.85rem">
        <div class="field">
          <label class="field-label">Email</label>
          <input v-model="email" type="email" class="field-input" autocomplete="email" required />
        </div>
        <div class="field">
          <label class="field-label">Mot de passe</label>
          <input v-model="password" type="password" class="field-input" autocomplete="current-password" required />
        </div>
        <div v-if="error" class="form-error">{{ error }}</div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="$emit('close')">Annuler</button>
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Connexion…' : 'Se connecter' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
