<script setup lang="ts">
import type { Etat } from '../calendrier'

defineProps<{ nom: string; etat: Etat; meta: string; ouverte: boolean; vide: boolean }>()
defineEmits<{ basculer: [] }>()

const libelles: Record<Etat, string> = { passee: 'terminé', 'en-cours': 'en cours', 'a-venir': 'à venir' }
</script>

<template>
  <section class="tranche" :class="`tranche--${etat}`">
    <button
      type="button"
      class="tranche-header"
      :disabled="vide"
      :aria-expanded="vide ? undefined : ouverte"
      @click="$emit('basculer')"
    >
      <span v-if="!vide" class="tranche-chevron" :class="{ ouverte }">▸</span>
      <span class="tranche-nom">{{ nom }}</span>
      <span class="tranche-etat" :class="etat">{{ libelles[etat] }}</span>
      <span class="tranche-meta">{{ meta }}</span>
    </button>
    <div v-if="ouverte && !vide" class="tranche-body">
      <slot />
    </div>
  </section>
</template>
