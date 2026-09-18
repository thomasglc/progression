<script setup lang="ts">
import { ref } from 'vue'
import type { Seance } from '../types'
import { useAuthStore } from '../stores/auth'
import { deleteSeance } from '../api/directus'
import EditSeanceModal from './admin/EditSeanceModal.vue'

const props = defineProps<{ seance: Seance }>()
const emit = defineEmits<{ refresh: [] }>()

const auth = useAuthStore()
const showEdit = ref(false)
const confirmDelete = ref(false)
const deleting = ref(false)

const labels: Record<string, string> = {
  tp: 'TP', cours: 'Cours', ap: 'AP', eval: 'Évaluation',
}

async function doDelete() {
  deleting.value = true
  try {
    await deleteSeance(props.seance.id, auth.token!)
    emit('refresh')
  } finally {
    deleting.value = false
    confirmDelete.value = false
  }
}

function onSaved() {
  showEdit.value = false
  emit('refresh')
}
</script>

<template>
  <div class="session" :class="seance.type">
    <div class="session-head">
      <span class="badge">{{ labels[seance.type] }}</span>
      <span class="duration">{{ seance.duree }}</span>
      <div v-if="auth.isAdmin" class="session-admin-btns">
        <button class="btn-admin-edit" @click.stop="showEdit = true" title="Modifier">✏</button>
        <button class="btn-admin-delete" @click.stop="confirmDelete = true" title="Supprimer">✕</button>
      </div>
    </div>
    <div class="s-title">{{ seance.titre }}</div>
    <ul class="s-points">
      <li v-for="(point, i) in seance.points" :key="i">{{ point }}</li>
    </ul>
    <div class="s-ref">
      <p class="s-obj">
        <strong>Objectif :</strong> {{ seance.objectif }}
      </p>
      <div v-if="seance.competences?.length" class="ref-row">
        <div class="ref-item">
          <span class="ref-label">Compétence{{ seance.competences.length > 1 ? 's' : '' }}</span>
          <span
            v-for="c in seance.competences"
            :key="c.id"
            class="ref-chip"
          >{{ c.competence.code }}</span>
        </div>
        <div
          v-for="c in seance.competences.filter(c => c.savoir_associe)"
          :key="'sa-' + c.id"
          class="ref-item"
        >
          <span class="ref-label">Savoir</span>
          <span class="ref-sa">{{ c.savoir_associe }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Confirm delete -->
  <div v-if="confirmDelete" class="modal-backdrop" @click.self="confirmDelete = false">
    <div class="modal" style="max-width:340px;text-align:center">
      <div class="modal-title">Supprimer cette séance ?</div>
      <p style="font-size:13px;color:var(--text-2);margin-bottom:1.25rem">
        « {{ seance.titre }} » sera définitivement supprimée.
      </p>
      <div class="modal-actions" style="justify-content:center">
        <button class="btn-secondary" @click="confirmDelete = false">Annuler</button>
        <button class="btn-danger" :disabled="deleting" @click="doDelete">
          {{ deleting ? 'Suppression…' : 'Supprimer' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Edit modal -->
  <EditSeanceModal
    v-if="showEdit"
    :seance="seance"
    @close="showEdit = false"
    @saved="onSaved"
  />
</template>
