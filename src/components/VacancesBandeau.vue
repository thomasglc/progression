<script setup lang="ts">
import { plageLongue } from '../calendrier'

defineProps<{ nom: string; debut: Date; fin: Date }>()
</script>

<template>
  <div class="vacances">
    <strong>{{ nom }}</strong>
    <span>{{ plageLongue(debut, fin) }}</span>
  </div>
</template>
