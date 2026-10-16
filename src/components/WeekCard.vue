<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Semaine, Seance } from '../types'
import { useAuthStore } from '../stores/auth'
import { useProgressionStore } from '../stores/progression'
import { semaineCalendrier, plageSemaine, etatSemaine, feriesDeLaSemaine, aujourdhui } from '../calendrier'
import type { Ferie } from '../calendrier'
import SessionCard from './SessionCard.vue'
import AddSeanceModal from './admin/AddSeanceModal.vue'

const props = defineProps<{ semaine: Semaine }>()
const emit = defineEmits<{ refresh: [] }>()

const auth = useAuthStore()
const store = useProgressionStore()
const showAdd = ref(false)
const expanded = ref(false)

const dates = computed(() => {
  const s = semaineCalendrier(props.semaine.numero)
  return s ? plageSemaine(s) : ''
})
const etat = computed(() => etatSemaine(props.semaine.numero, aujourdhui()))

// Un jour férié prend la place d'une séance manquante, pour garder le même nombre de cases
type Cellule = { cle: string; seance: Seance } | { cle: string; ferie: Ferie }
const cellules = computed(() => {
  const liste: Cellule[] = [...props.semaine.seances]
    .sort((a, b) => a.ordre - b.ordre)
    .map(seance => ({ cle: `s${seance.id}`, seance }))
  const placesLibres = Math.max(0, store.seancesParSemaine - liste.length)
  for (const ferie of feriesDeLaSemaine(props.semaine.numero).slice(0, placesLibres)) {
    liste.splice(Math.min(ferie.position, liste.length), 0, { cle: `f${ferie.position}`, ferie })
  }
  return liste
})

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
  <div class="week" :class="{ 'week--courante': etat === 'en-cours', 'week--passee': etat === 'passee' }">
    <div class="week-inner">
      <div class="week-label">
        <div class="week-num">{{ semaine.numero }}</div>
        <div class="week-word">Semaine</div>
        <div v-if="dates" class="week-dates">{{ dates }}</div>
        <div v-if="etat === 'en-cours'" class="week-now">Cette semaine</div>
      </div>
      <div
        class="week-sessions"
        :class="{
          'one-col': cellules.length === 1 && !auth.isAdmin,
          'two-col': cellules.length === 2 && !auth.isAdmin,
        }"
      >
        <template v-for="cellule in cellules" :key="cellule.cle">
          <SessionCard
            v-if="'seance' in cellule"
            :seance="cellule.seance"
            :semaine-id="semaine.id"
            :expanded="expanded"
            @toggle="expanded = !expanded"
            @refresh="$emit('refresh')"
          />
          <div v-else class="session session-ferie">
            <span class="ferie-jour">{{ cellule.ferie.jour }}</span>
            <span class="ferie-nom">{{ cellule.ferie.nom }}</span>
          </div>
        </template>
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
