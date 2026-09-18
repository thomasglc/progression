<script setup lang="ts">
import { onMounted } from 'vue'
import { useProgressionStore } from './stores/progression'
import WeekCard from './components/WeekCard.vue'
import PeriodeDivider from './components/PeriodeDivider.vue'

const store = useProgressionStore()
onMounted(() => store.charger())
</script>

<template>
  <div class="page">
    <header class="header">
      <div class="header-meta">
        <span class="meta-tag">BTS SIO · Option SLAM</span>
        <span class="meta-sep">—</span>
        <span class="meta-tag">Lycée Camille Sée · Colmar</span>
        <span class="meta-sep">—</span>
        <span class="meta-tag">Année 2026–2027</span>
      </div>
      <h1>Progression pédagogique annuelle</h1>
      <p class="header-sub">Bloc 1 — Bloc 3 — Atelier Professionnel · 1ère et 2ème années</p>
      <p class="header-note">
        Référentiel BTS SIO – Session 2022. Les codes de compétences sont à vérifier dans le référentiel officiel.
      </p>
    </header>

    <div v-if="store.error" class="error-banner">{{ store.error }}</div>
    <div v-else-if="store.loading" class="loading">Chargement…</div>

    <template v-else>
      <nav class="level-nav">
        <button
          v-for="niveau in store.niveaux"
          :key="niveau.id"
          class="level-btn"
          :class="{ active: store.niveauActif === niveau.id }"
          @click="store.setNiveau(niveau.id)"
        >{{ niveau.nom }}</button>
        <button class="print-btn" onclick="window.print()">🖨 Imprimer / PDF</button>
      </nav>

      <nav class="block-nav">
        <button
          v-for="bloc in store.blocsParNiveau.get(store.niveauActif!) ?? []"
          :key="bloc.id"
          class="block-btn"
          :class="{ active: store.blocActif === bloc.id }"
          @click="store.setBloc(bloc.id)"
        >{{ bloc.nom }}</button>
      </nav>

      <template v-for="periode in store.periodesActuelles" :key="periode.id">
        <PeriodeDivider :periode="periode" />
        <div class="weeks">
          <WeekCard
            v-for="semaine in store.semainesDePeriode(periode.id)"
            :key="semaine.id"
            :semaine="semaine"
          />
        </div>
      </template>
    </template>
  </div>
</template>
