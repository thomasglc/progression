<script setup lang="ts">
import type { Seance } from '../types'

defineProps<{ seance: Seance }>()

const labels: Record<string, string> = {
  tp: 'TP', cours: 'Cours', ap: 'AP', eval: 'Évaluation',
}
</script>

<template>
  <div class="session" :class="seance.type">
    <div class="session-head">
      <span class="badge">{{ labels[seance.type] }}</span>
      <span class="duration">{{ seance.duree }}</span>
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
</template>
