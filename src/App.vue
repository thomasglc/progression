<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Periode } from './types'
import { useProgressionStore } from './stores/progression'
import { useAuthStore } from './stores/auth'
import WeekCard from './components/WeekCard.vue'
import PeriodeDivider from './components/PeriodeDivider.vue'
import LoginModal from './components/LoginModal.vue'
import AddSemaineModal from './components/admin/AddSemaineModal.vue'

const store = useProgressionStore()
const auth = useAuthStore()

onMounted(() => store.charger())

const showLogin = ref(false)
const addSemaineTarget = ref<Periode | null>(null)

function nextNumero(periode: Periode): number {
  const semaines = store.semainesDePeriode(periode.id)
  if (!semaines.length) return 1
  return Math.max(...semaines.map(s => s.numero)) + 1
}

function openAddSemaine(periode: Periode) {
  addSemaineTarget.value = periode
}

function onSemaineSaved() {
  addSemaineTarget.value = null
  store.charger()
}
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
        <div class="header-admin-zone">
          <template v-if="auth.isAdmin">
            <span class="admin-badge">Mode admin</span>
            <button class="btn-admin-logout" @click="auth.logout()">Déconnexion</button>
          </template>
          <button v-else class="btn-admin-login" @click="showLogin = true" title="Administration">⚙</button>
        </div>
      </div>
      <h1>Progression pédagogique annuelle</h1>
      <p class="header-sub">Bloc 1 — Bloc 3 — Atelier Professionnel · 1ère et 2ème années</p>
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
        <a class="roadmap-btn" href="/roadmap.pdf" target="_blank" title="Voir la roadmap globale">🗺 Roadmap</a>
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
            @refresh="store.charger()"
          />
          <button
            v-if="auth.isAdmin"
            class="add-semaine-btn"
            @click="openAddSemaine(periode)"
          >
            + Ajouter une semaine
          </button>
        </div>
      </template>
    </template>

    <LoginModal v-if="showLogin" @close="showLogin = false" />

    <AddSemaineModal
      v-if="addSemaineTarget"
      :periode="addSemaineTarget"
      :next-numero="nextNumero(addSemaineTarget)"
      @close="addSemaineTarget = null"
      @saved="onSemaineSaved"
    />
  </div>
</template>
