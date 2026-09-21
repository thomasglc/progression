<script setup lang="ts">
import { ref } from 'vue'
import type { Semaine } from '../types'
import { useAuthStore } from '../stores/auth'
import SessionCard from './SessionCard.vue'
import AddSeanceModal from './admin/AddSeanceModal.vue'

const props = defineProps<{ semaine: Semaine }>()
const emit = defineEmits<{ refresh: [] }>()

const auth = useAuthStore()
const showAdd = ref(false)
const expanded = ref(false)

function nextOrdre(): number {
  if (!props.semaine.seances.length) return 1
  return Math.max(...props.semaine.seances.map(s => s.ordre)) + 1
}

function onSaved() {
  showAdd.value = false
  emit('refresh')
}
</script>

<template>
  <div class="week">
    <div class="week-inner">
      <div class="week-label">
        <div class="week-num">{{ semaine.numero }}</div>
        <div class="week-word">Semaine</div>
      </div>
      <div
        class="week-sessions"
        :class="{
          'one-col': semaine.seances.length === 1 && !auth.isAdmin,
          'two-col': semaine.seances.length === 2 && !auth.isAdmin,
        }"
      >
        <SessionCard
          v-for="seance in [...semaine.seances].sort((a, b) => a.ordre - b.ordre)"
          :key="seance.id"
          :seance="seance"
          :semaine-id="semaine.id"
          :expanded="expanded"
          @toggle="expanded = !expanded"
          @refresh="$emit('refresh')"
        />
        <button
          v-if="auth.isAdmin"
          class="add-seance-btn"
          @click="showAdd = true"
          title="Ajouter une séance"
        >
          +
        </button>
      </div>
    </div>
  </div>

  <AddSeanceModal
    v-if="showAdd"
    :semaine-id="semaine.id"
    :next-ordre="nextOrdre()"
    @close="showAdd = false"
    @saved="onSaved"
  />
</template>
