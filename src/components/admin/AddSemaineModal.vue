<script setup lang="ts">
import { ref } from 'vue'
import type { Periode } from '../../types'
import { createSemaine } from '../../api/directus'
import { useAuthStore } from '../../stores/auth'

const props = defineProps<{ periode: Periode; nextNumero: number }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const auth = useAuthStore()
const saving = ref(false)
const error = ref('')
const numero = ref(props.nextNumero)

async function save() {
  saving.value = true
  error.value = ''
  try {
    await createSemaine({
      periode: props.periode.id,
      numero: numero.value,
    }, auth.token!)
    emit('saved')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erreur lors de la création'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal" style="max-width:380px">
      <div class="modal-title">Ajouter une semaine</div>
      <form @submit.prevent="save">
        <div class="field">
          <label class="field-label">Période</label>
          <div class="field-static">{{ periode.nom }}</div>
        </div>
        <div class="field" style="margin-top:.75rem">
          <label class="field-label">Numéro de semaine</label>
          <input v-model.number="numero" type="number" min="1" class="field-input" style="max-width:100px" required />
        </div>

        <div v-if="error" class="form-error" style="margin-top:.75rem">{{ error }}</div>

        <div class="modal-actions" style="margin-top:1.25rem">
          <button type="button" class="btn-secondary" @click="$emit('close')">Annuler</button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Création…' : 'Créer la semaine' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
