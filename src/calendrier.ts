// Calendrier scolaire 2026-2027, zone B (académie de Strasbourg) : à mettre à jour chaque été.
// Sources : data.education.gouv.fr (calendrier scolaire) et calendrier.api.gouv.fr (jours fériés).
export const ANNEE_SCOLAIRE = '2026-2027'
const PREMIER_LUNDI = '2026-09-07' // lundi de la semaine 1 de la progression
const DEBUT_ETE = '2027-07-03'

const NOMS_TRANCHES = [
  'De la rentrée à la Toussaint',
  'De la Toussaint à Noël',
  "De Noël aux vacances d'hiver",
  "Des vacances d'hiver au printemps",
  "Du printemps à l'été",
]

// debut : premier jour sans cours ; reprise : lundi de la reprise
const VACANCES = [
  { nom: 'Vacances de la Toussaint', debut: '2026-10-17', reprise: '2026-11-02' },
  { nom: 'Vacances de Noël', debut: '2026-12-19', reprise: '2027-01-04' },
  { nom: "Vacances d'hiver", debut: '2027-02-20', reprise: '2027-03-08' },
  { nom: 'Vacances de printemps', debut: '2027-04-17', reprise: '2027-05-03' },
]

const JOURS_FERIES = [
  { date: '2026-11-11', nom: 'férié' },
  { date: '2027-03-29', nom: 'férié (lundi de Pâques)' },
  { date: '2027-05-06', nom: 'férié (Ascension)' },
  { date: '2027-05-07', nom: "pont de l'Ascension" },
  { date: '2027-05-17', nom: 'férié (lundi de Pentecôte)' },
]

export interface SemaineCalendrier {
  numero: number
  lundi: Date
  vendredi: Date
  tranche: number
}

export interface Tranche {
  index: number
  nom: string
  debut: Date
  fin: Date
  premiereSemaine: number
  derniereSemaine: number
  vacancesApres: { nom: string; debut: Date; fin: Date } | null
}

export type Etat = 'passee' | 'en-cours' | 'a-venir'

function jour(iso: string): Date {
  const [a, m, j] = iso.split('-').map(Number)
  return new Date(a, m - 1, j)
}

function plusJours(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

const vacances = VACANCES.map(v => ({ nom: v.nom, debut: jour(v.debut), reprise: jour(v.reprise) }))

// Semaines de cours numérotées à partir du premier lundi, en sautant les semaines de vacances
const semaines: SemaineCalendrier[] = []
for (let lundi = jour(PREMIER_LUNDI); lundi < jour(DEBUT_ETE); lundi = plusJours(lundi, 7)) {
  if (vacances.some(v => lundi >= v.debut && lundi < v.reprise)) continue
  semaines.push({
    numero: semaines.length + 1,
    lundi,
    vendredi: plusJours(lundi, 4),
    tranche: vacances.filter(v => v.reprise <= lundi).length,
  })
}

export const tranches: Tranche[] = NOMS_TRANCHES.map((nom, index) => {
  const s = semaines.filter(x => x.tranche === index)
  const v = vacances[index]
  return {
    index,
    nom,
    debut: s[0].lundi,
    fin: s[s.length - 1].vendredi,
    premiereSemaine: s[0].numero,
    derniereSemaine: s[s.length - 1].numero,
    vacancesApres: v ? { nom: v.nom, debut: v.debut, fin: plusJours(v.reprise, -1) } : null,
  }
})

export function semaineCalendrier(numero: number): SemaineCalendrier | undefined {
  return semaines[numero - 1]
}

// En développement, ?date=2026-11-09 simule un autre jour pour vérifier l'affichage
export function aujourdhui(): Date {
  const simulee = import.meta.env.DEV ? new URLSearchParams(location.search).get('date') : null
  const d = simulee ? jour(simulee) : new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function etatSemaine(numero: number, ajd: Date): Etat | null {
  const s = semaineCalendrier(numero)
  if (!s) return null
  if (ajd < s.lundi) return 'a-venir'
  if (ajd >= plusJours(s.lundi, 7)) return 'passee'
  return 'en-cours'
}

export function etatTranche(t: Tranche, ajd: Date): Etat {
  if (ajd < t.debut) return 'a-venir'
  if (ajd > t.fin) return 'passee'
  return 'en-cours'
}

export function feriesDeLaSemaine(numero: number): string[] {
  const s = semaineCalendrier(numero)
  if (!s) return []
  return JOURS_FERIES
    .map(f => ({ date: jour(f.date), nom: f.nom }))
    .filter(f => f.date >= s.lundi && f.date <= s.vendredi)
    .map(f => `${majuscule(jourComplet.format(f.date))} : ${f.nom}`)
}

// ── Formats d'affichage ────────────────────────────────────────────────────
const jourMoisCourt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
const jourComplet = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

function majuscule(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1)
}

function jourMoisLong(d: Date): string {
  const mois = d.toLocaleDateString('fr-FR', { month: 'long' })
  return `${d.getDate() === 1 ? '1er' : d.getDate()} ${mois}`
}

// « 7 au 11 sept. » ou « 30 nov. au 4 déc. »
export function plageSemaine(s: SemaineCalendrier): string {
  const debut = s.lundi.getMonth() === s.vendredi.getMonth() ? String(s.lundi.getDate()) : jourMoisCourt.format(s.lundi)
  return `${debut} au ${jourMoisCourt.format(s.vendredi)}`
}

// « 7 sept. → 16 oct. »
export function plageCourte(debut: Date, fin: Date): string {
  return `${jourMoisCourt.format(debut)} → ${jourMoisCourt.format(fin)}`
}

// « du 17 octobre au 1er novembre »
export function plageLongue(debut: Date, fin: Date): string {
  return `du ${jourMoisLong(debut)} au ${jourMoisLong(fin)}`
}
