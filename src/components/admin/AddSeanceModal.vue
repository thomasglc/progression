<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { Savoir } from '../../types'
import { fetchSavoirs, createSeance, createSeanceSavoir } from '../../api/directus'
import { useAuthStore } from '../../stores/auth'

const props = defineProps<{ semaineId: number; nextOrdre: number }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const auth = useAuthStore()
const saving = ref(false)
const error = ref('')
const allSavoirs = ref<Savoir[]>([])

const form = reactive({
  titre: '',
  type: 'tp',
  duree: '1h30',
  points: [''],
  objectif: '',
})

const selectedSavoirIds = ref<Set<number>>(new Set())
const selectedCompetenceIds = ref<Set<number>>(new Set())

const allCompetences = computed(() => {
  const map = new Map<number, { id: number; code: string; intitule: string }>()
  for (const s of allSavoirs.value) {
    if (!map.has(s.competence.id)) map.set(s.competence.id, s.competence)
  }
  return [...map.values()]
})

const filteredGroups = computed(() => {
  const map = new Map<number, { id: number; code: string; intitule: string; savoirs: Savoir[] }>()
  for (const s of allSavoirs.value) {
    if (!selectedCompetenceIds.value.has(s.competence.id)) continue
    const c = s.competence
    if (!map.has(c.id)) map.set(c.id, { id: c.id, code: c.code, intitule: c.intitule, savoirs: [] })
    map.get(c.id)!.savoirs.push(s)
  }
  return [...map.values()]
})

function toggleCompetence(id: number) {
  if (selectedCompetenceIds.value.has(id)) {
    selectedCompetenceIds.value.delete(id)
    for (const s of allSavoirs.value) {
      if (s.competence.id === id) selectedSavoirIds.value.delete(s.id)
    }
  } else {
    selectedCompetenceIds.value.add(id)
  }
}

onMounted(async () => {
  try { allSavoirs.value = await fetchSavoirs() } catch {}
})

function toggleSavoir(id: number) {
  if (selectedSavoirIds.value.has(id)) selectedSavoirIds.value.delete(id)
  else selectedSavoirIds.value.add(id)
}

function addPoint() { form.points.push('') }
function removePoint(i: number) { form.points.splice(i, 1) }

async function save() {
  saving.value = true
  error.value = ''
  try {
    const seanceId = await createSeance({
      semaine: props.semaineId,
      titre: form.titre.trim(),
      type: form.type,
      duree: form.duree.trim(),
      points: form.points.map(p => p.trim()).filter(Boolean),
      objectif: form.objectif.trim(),
      ordre: props.nextOrdre,
    }, auth.token!)

    for (const savoirId of selectedSavoirIds.value) {
      await createSeanceSavoir(seanceId, savoirId, auth.token!)
    }
    emit('saved')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erreur lors de la création'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-title">Ajouter une séance</div>
      <form @submit.prevent="save">
        <div class="form-grid-2">
          <div class="field">
            <label class="field-label">Titre</label>
            <input v-model="form.titre" type="text" class="field-input" required />
          </div>
          <div class="field">
            <label class="field-label">Type</label>
            <select v-model="form.type" class="field-input">
              <option value="tp">TP</option>
              <option value="cours">Cours</option>
              <option value="ap">AP</option>
              <option value="eval">Évaluation</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Durée</label>
            <input v-model="form.duree" type="text" class="field-input" placeholder="ex: 1h30" required />
          </div>
        </div>

        <div class="field" style="margin-top:.75rem">
          <label class="field-label">Points du programme</label>
          <div style="display:flex;flex-direction:column;gap:.35rem">
            <div v-for="(_, i) in form.points" :key="i" class="point-row">
              <input v-model="form.points[i]" type="text" class="field-input" />
              <button type="button" class="btn-icon-danger" @click="removePoint(i)">✕</button>
            </div>
          </div>
          <button type="button" class="btn-add-item" @click="addPoint">+ Ajouter un point</button>
        </div>

        <div class="field" style="margin-top:.75rem">
          <label class="field-label">Objectif</label>
          <textarea v-model="form.objectif" class="field-input" rows="2" />
        </div>

        <div class="field" style="margin-top:.75rem">
          <label class="field-label">Compétences</label>
          <div v-if="allSavoirs.length === 0" style="font-size:12px;color:var(--text-3);margin-top:.35rem">
            Chargement…
          </div>
          <div v-else class="comp-selector">
            <button
              v-for="comp in allCompetences"
              :key="comp.id"
              type="button"
              class="comp-chip"
              :class="{ selected: selectedCompetenceIds.has(comp.id) }"
              :title="comp.intitule"
              @click="toggleCompetence(comp.id)"
            >{{ comp.code }}</button>
          </div>
        </div>

        <div v-if="selectedCompetenceIds.size > 0" class="field" style="margin-top:.75rem">
          <label class="field-label">Savoirs traités</label>
          <div class="savoir-picker">
            <div v-for="group in filteredGroups" :key="group.id" class="savoir-group">
              <div class="savoir-group-header">
                <span class="ref-chip">{{ group.code }}</span>
                <span class="savoir-group-name">{{ group.intitule }}</span>
              </div>
              <label
                v-for="s in group.savoirs"
                :key="s.id"
                class="savoir-option"
                :class="{ selected: selectedSavoirIds.has(s.id) }"
              >
                <input
                  type="checkbox"
                  :checked="selectedSavoirIds.has(s.id)"
                  @change="toggleSavoir(s.id)"
                />
                {{ s.intitule }}
              </label>
            </div>
          </div>
        </div>

        <div v-if="error" class="form-error" style="margin-top:.75rem">{{ error }}</div>

        <div class="modal-actions" style="margin-top:1.25rem">
          <button type="button" class="btn-secondary" @click="$emit('close')">Annuler</button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Création…' : 'Créer la séance' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
