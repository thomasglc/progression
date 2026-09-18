<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import type { Seance, Competence } from '../../types'
import { fetchCompetences, patchSeance, deleteSeanceCompetence, createSeanceCompetence } from '../../api/directus'
import { useAuthStore } from '../../stores/auth'

const props = defineProps<{ seance: Seance }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const auth = useAuthStore()
const saving = ref(false)
const error = ref('')
const allCompetences = ref<Competence[]>([])

const form = reactive({
  titre: props.seance.titre,
  type: props.seance.type as string,
  duree: props.seance.duree,
  points: [...props.seance.points],
  objectif: props.seance.objectif,
})

interface CompLink {
  competence_id: number
  savoir_associe: string
}

const links = ref<CompLink[]>(
  props.seance.competences.map(c => ({
    competence_id: c.competence.id,
    savoir_associe: c.savoir_associe ?? '',
  }))
)

onMounted(async () => {
  try {
    allCompetences.value = await fetchCompetences(auth.token!)
  } catch {
    error.value = 'Impossible de charger les compétences'
  }
})

function addPoint() { form.points.push('') }
function removePoint(i: number) { form.points.splice(i, 1) }

function addLink() {
  links.value.push({ competence_id: allCompetences.value[0]?.id ?? 0, savoir_associe: '' })
}
function removeLink(i: number) { links.value.splice(i, 1) }

async function save() {
  saving.value = true
  error.value = ''
  try {
    await patchSeance(props.seance.id, {
      titre: form.titre.trim(),
      type: form.type,
      duree: form.duree.trim(),
      points: form.points.map(p => p.trim()).filter(Boolean),
      objectif: form.objectif.trim(),
    }, auth.token!)

    for (const c of props.seance.competences) {
      await deleteSeanceCompetence(c.id, auth.token!)
    }
    for (const link of links.value) {
      if (link.competence_id) {
        await createSeanceCompetence({
          seance: props.seance.id,
          competence: link.competence_id,
          savoir_associe: link.savoir_associe.trim(),
        }, auth.token!)
      }
    }
    emit('saved')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erreur lors de la sauvegarde'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-title">Modifier la séance</div>

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
              <button type="button" class="btn-icon-danger" @click="removePoint(i)" title="Supprimer">✕</button>
            </div>
          </div>
          <button type="button" class="btn-add-item" @click="addPoint">+ Ajouter un point</button>
        </div>

        <div class="field" style="margin-top:.75rem">
          <label class="field-label">Objectif</label>
          <textarea v-model="form.objectif" class="field-input" rows="3" />
        </div>

        <div class="field" style="margin-top:.75rem">
          <label class="field-label">Compétences</label>
          <div style="display:flex;flex-direction:column;gap:.5rem">
            <div v-for="(link, i) in links" :key="i" class="comp-row">
              <select v-model="link.competence_id" class="field-input comp-select">
                <option v-for="c in allCompetences" :key="c.id" :value="c.id">{{ c.code }}</option>
              </select>
              <input v-model="link.savoir_associe" type="text" class="field-input comp-savoir" placeholder="Savoir associé…" />
              <button type="button" class="btn-icon-danger" @click="removeLink(i)" title="Supprimer">✕</button>
            </div>
          </div>
          <button type="button" class="btn-add-item" @click="addLink">+ Ajouter une compétence</button>
        </div>

        <div v-if="error" class="form-error" style="margin-top:.75rem">{{ error }}</div>

        <div class="modal-actions" style="margin-top:1.25rem">
          <button type="button" class="btn-secondary" @click="$emit('close')">Annuler</button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Sauvegarde…' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
