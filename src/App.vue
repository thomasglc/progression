<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Periode, Semaine } from './types'
import { useProgressionStore } from './stores/progression'
import { useAuthStore } from './stores/auth'
import { tranches, semaineCalendrier, etatTranche, aujourdhui, plageCourte, ANNEE_SCOLAIRE } from './calendrier'
import type { Tranche, Etat } from './calendrier'
import WeekCard from './components/WeekCard.vue'
import PeriodeDivider from './components/PeriodeDivider.vue'
import TrancheSection from './components/TrancheSection.vue'
import VacancesBandeau from './components/VacancesBandeau.vue'
import LoginModal from './components/LoginModal.vue'
import AddSemaineModal from './components/admin/AddSemaineModal.vue'

const store = useProgressionStore()
const auth = useAuthStore()

onMounted(() => store.charger())

interface GroupePeriode { periode: Periode; semaines: Semaine[]; dernierDeLaPeriode: boolean }
interface TrancheAffichee { cle: string; tranche: Tranche | null; etat: Etat; groupes: GroupePeriode[] }

function grouper(semaines: Semaine[], derniers: Map<number, number>): GroupePeriode[] {
  const groupes: GroupePeriode[] = []
  for (const s of semaines) {
    const g = groupes[groupes.length - 1]
    if (g && g.periode.id === s.periode.id) g.semaines.push(s)
    else groupes.push({ periode: s.periode, semaines: [s], dernierDeLaPeriode: false })
  }
  for (const g of groupes) g.dernierDeLaPeriode = g.semaines[g.semaines.length - 1].numero === derniers.get(g.periode.id)
  return groupes
}

// Tranches de la première ayant des semaines jusqu'à celle qui suit la dernière (à préparer)
const tranchesAffichees = computed<TrancheAffichee[]>(() => {
  const ajd = aujourdhui()
  const semaines = [...store.semainesFiltrees].sort((a, b) => a.numero - b.numero)
  const derniers = new Map<number, number>()
  for (const s of semaines) derniers.set(s.periode.id, Math.max(derniers.get(s.periode.id) ?? 0, s.numero))

  const parTranche = new Map<number, Semaine[]>()
  for (const s of semaines) {
    const i = semaineCalendrier(s.numero)?.tranche ?? -1
    parTranche.set(i, [...(parTranche.get(i) ?? []), s])
  }

  const resultat: TrancheAffichee[] = []
  const indices = [...parTranche.keys()].filter(i => i >= 0)
  if (indices.length) {
    const premier = Math.min(...indices)
    const dernier = Math.min(Math.max(...indices) + 1, tranches.length - 1)
    for (const t of tranches.slice(premier, dernier + 1)) {
      resultat.push({ cle: `${ANNEE_SCOLAIRE}:${t.index}`, tranche: t, etat: etatTranche(t, ajd), groupes: grouper(parTranche.get(t.index) ?? [], derniers) })
    }
  }
  const horsCalendrier = parTranche.get(-1)
  if (horsCalendrier) resultat.push({ cle: `${ANNEE_SCOLAIRE}:hors`, tranche: null, etat: 'a-venir', groupes: grouper(horsCalendrier, derniers) })
  return resultat
})

function meta(t: TrancheAffichee): string {
  if (!t.tranche) return 'au-delà du calendrier scolaire'
  const plage = `S${t.tranche.premiereSemaine} à S${t.tranche.derniereSemaine} · ${plageCourte(t.tranche.debut, t.tranche.fin)}`
  return t.groupes.length ? plage : `${plage} · pas encore préparé`
}

// Les tranches terminées sont repliées par défaut ; un choix manuel est retenu par le navigateur
const CLE_STOCKAGE = 'progression:tranches'
const ouvertures = ref<Record<string, boolean>>(lireOuvertures())

function lireOuvertures(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(CLE_STOCKAGE) ?? '{}')
  } catch {
    return {}
  }
}

function estOuverte(t: TrancheAffichee): boolean {
  return ouvertures.value[t.cle] ?? t.etat !== 'passee'
}

function basculer(t: TrancheAffichee) {
  ouvertures.value = { ...ouvertures.value, [t.cle]: !estOuverte(t) }
  try {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(ouvertures.value))
  } catch {
    // stockage indisponible (navigation privée) : le choix vaut pour la visite en cours
  }
}

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
        <a class="roadmap-btn" href="/roadmap.pdf" target="_blank" title="Voir la roadmap globale">Roadmap</a>
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

      <template v-for="(t, i) in tranchesAffichees" :key="t.cle">
        <VacancesBandeau
          v-if="i > 0 && tranchesAffichees[i - 1].tranche?.vacancesApres"
          v-bind="tranchesAffichees[i - 1].tranche!.vacancesApres!"
        />
        <TrancheSection
          :nom="t.tranche?.nom ?? 'Semaines hors calendrier'"
          :etat="t.etat"
          :meta="meta(t)"
          :ouverte="estOuverte(t)"
          :vide="!t.groupes.length"
          @basculer="basculer(t)"
        >
          <template v-for="(g, gi) in t.groupes" :key="`${t.cle}-${gi}`">
            <PeriodeDivider :periode="g.periode" />
            <div class="weeks">
              <WeekCard
                v-for="semaine in g.semaines"
                :key="semaine.id"
                :semaine="semaine"
                @refresh="store.charger()"
              />
              <button
                v-if="auth.isAdmin && g.dernierDeLaPeriode"
                class="add-semaine-btn"
                @click="openAddSemaine(g.periode)"
              >
                + Ajouter une semaine
              </button>
            </div>
          </template>
        </TrancheSection>
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
