import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchSemaines } from '../api/directus'
import type { Semaine, Niveau, Bloc, Periode } from '../types'

export const useProgressionStore = defineStore('progression', () => {
  const semaines = ref<Semaine[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const niveauActif = ref<number | null>(null)
  const blocActif = ref<number | null>(null)

  const niveaux = computed<Niveau[]>(() => {
    const map = new Map<number, Niveau>()
    semaines.value.forEach(s => {
      const n = s.periode.niveau
      if (!map.has(n.id)) map.set(n.id, n)
    })
    return [...map.values()].sort((a, b) => a.ordre - b.ordre)
  })

  const blocsParNiveau = computed(() => {
    const map = new Map<number, Map<number, Bloc>>()
    semaines.value.forEach(s => {
      const nid = s.periode.niveau.id
      const b = s.periode.bloc
      if (!map.has(nid)) map.set(nid, new Map())
      if (!map.get(nid)!.has(b.id)) map.get(nid)!.set(b.id, b)
    })
    const result = new Map<number, Bloc[]>()
    map.forEach((blocs, nid) => {
      result.set(nid, [...blocs.values()])
    })
    return result
  })

  const semainesFiltrees = computed(() => {
    return semaines.value.filter(s => {
      if (niveauActif.value !== null && s.periode.niveau.id !== niveauActif.value) return false
      if (blocActif.value !== null && s.periode.bloc.id !== blocActif.value) return false
      return true
    })
  })

  const periodesActuelles = computed<Periode[]>(() => {
    const map = new Map<number, Periode>()
    semainesFiltrees.value.forEach(s => {
      if (!map.has(s.periode.id)) map.set(s.periode.id, s.periode)
    })
    return [...map.values()].sort((a, b) => a.ordre - b.ordre)
  })

  function semainesDePeriode(periodeId: number): Semaine[] {
    return semainesFiltrees.value
      .filter(s => s.periode.id === periodeId)
      .sort((a, b) => a.numero - b.numero)
  }

  async function charger() {
    loading.value = true
    error.value = null
    try {
      semaines.value = await fetchSemaines()
      if (niveauActif.value === null && niveaux.value.length) {
        const firstNiveauId = niveaux.value[0].id
        niveauActif.value = firstNiveauId
        const blocs = blocsParNiveau.value.get(firstNiveauId)
        blocActif.value = blocs?.[0]?.id ?? null
      }
    } catch (e) {
      error.value = 'Impossible de charger la progression. Vérifiez la connexion à Directus.'
    } finally {
      loading.value = false
    }
  }

  function setNiveau(id: number) {
    niveauActif.value = id
    const blocs = blocsParNiveau.value.get(id)
    blocActif.value = blocs?.[0]?.id ?? null
  }

  function setBloc(id: number) {
    blocActif.value = id
  }

  return {
    semaines, loading, error,
    niveauActif, blocActif,
    niveaux, blocsParNiveau, semainesFiltrees, periodesActuelles,
    semainesDePeriode, charger, setNiveau, setBloc,
  }
})
