<script setup lang="ts">
import type { Semaine } from '../types'
import SessionCard from './SessionCard.vue'

defineProps<{ semaine: Semaine }>()
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
          'one-col': semaine.seances.length === 1,
          'two-col': semaine.seances.length === 2,
        }"
      >
        <SessionCard
          v-for="seance in [...semaine.seances].sort((a, b) => a.ordre - b.ordre)"
          :key="seance.id"
          :seance="seance"
        />
      </div>
    </div>
  </div>
</template>
