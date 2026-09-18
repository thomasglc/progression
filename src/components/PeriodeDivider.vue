<script setup lang="ts">
import type { Periode } from '../types'
defineProps<{ periode: Periode }>()
</script>

<template>
  <div class="period-divider">
    <div class="period-divider-line"></div>
    <span class="period-divider-label">{{ periode.nom }}</span>
    <div class="period-divider-line"></div>
  </div>
</template>
