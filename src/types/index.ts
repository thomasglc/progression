export interface Niveau {
  id: number
  nom: string
  ordre: number
}

export interface Bloc {
  id: number
  nom: string
  code: string
  couleur: 'tp' | 'cm' | 'ap'
}

export interface Periode {
  id: number
  nom: string
  niveau: Niveau
  bloc: Bloc
  ordre: number
}

export interface Competence {
  id: number
  code: string
  intitule: string
}

export interface CompetenceSeance {
  id: number
  competence: Competence
  savoir_associe: string
}

export interface Seance {
  id: number
  titre: string
  type: 'tp' | 'cm' | 'ap' | 'eval'
  duree: string
  points: string[]
  objectif: string
  competences: CompetenceSeance[]
  ordre: number
}

export interface Semaine {
  id: number
  numero: number
  periode: Periode
  seances: Seance[]
}
