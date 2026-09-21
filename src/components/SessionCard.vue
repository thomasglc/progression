<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Seance } from '../types'
import { useAuthStore } from '../stores/auth'
import { deleteSeance } from '../api/directus'
import EditSeanceModal from './admin/EditSeanceModal.vue'

const props = defineProps<{ seance: Seance; semaineId: number; expanded: boolean }>()
const emit = defineEmits<{ refresh: []; toggle: [] }>()

const auth = useAuthStore()
const showEdit = ref(false)
const confirmDelete = ref(false)
const deleting = ref(false)

// Group savoirs by competence for display
const savoirsByCompetence = computed(() => {
  const map = new Map<number, { code: string; intitule: string; savoirs: string[] }>()
  for (const ss of props.seance.savoirs ?? []) {
    const comp = ss.savoir.competence
    if (!map.has(comp.id)) map.set(comp.id, { code: comp.code, intitule: comp.intitule, savoirs: [] })
    map.get(comp.id)!.savoirs.push(ss.savoir.intitule)
  }
  return [...map.values()]
})

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
  <div class="session" :class="seance.type" @click="emit('toggle')">
    <div class="session-head">
      <span class="badge">{{ labels[seance.type] }}</span>
      <span class="duration">{{ seance.duree }}</span>
      <div v-if="auth.isAdmin" class="session-admin-btns">
        <button class="btn-admin-edit" @click.stop="showEdit = true" title="Modifier">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13H3v-2L11.5 2.5z"/>
          </svg>
        </button>
        <button class="btn-admin-delete" @click.stop="confirmDelete = true" title="Supprimer">✕</button>
      </div>
    </div>
    <div class="s-title">{{ seance.titre }}</div>
    <ul v-show="expanded" class="s-points">
      <li v-for="(point, i) in seance.points" :key="i">{{ point }}</li>
    </ul>
    <div v-show="expanded" class="s-ref">
      <p class="s-obj">
        <strong>Objectif :</strong> {{ seance.objectif }}
      </p>
      <div v-if="savoirsByCompetence.length" class="ref-row">
        <div v-for="comp in savoirsByCompetence" :key="comp.code" class="ref-comp">
          <div class="ref-comp-main">
            <span class="ref-chip">{{ comp.code }}</span>
            <span class="ref-comp-name">{{ comp.intitule }}</span>
          </div>
          <ul class="ref-savoirs-list">
            <li v-for="(s, i) in comp.savoirs" :key="i" class="ref-sa">{{ s }}</li>
          </ul>
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
    :semaine-id="semaineId"
    @close="showEdit = false"
    @saved="onSaved"
  />
</template>
