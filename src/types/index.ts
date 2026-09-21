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

export interface Savoir {
  id: number
  intitule: string
  competence: Competence
}

export interface SeanceSavoir {
  id: number  // junction id (for deletion)
  savoir: Savoir
}

export interface Seance {
  id: number
  titre: string
  type: 'tp' | 'cours' | 'ap' | 'eval'
  duree: string
  points: string[]
  objectif: string
  savoirs: SeanceSavoir[]
  ordre: number
}

export interface Semaine {
  id: number
  numero: number
  periode: Periode
  seances: Seance[]
}
