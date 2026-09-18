import { createDirectus, rest, readItems } from '@directus/sdk'
import type { Semaine } from '../types'

const directusUrl = import.meta.env.DEV
  ? new URL('/directus-api', location.href).href
  : (import.meta.env.VITE_DIRECTUS_URL as string)

const client = createDirectus(directusUrl).with(rest())

export async function fetchSemaines(): Promise<Semaine[]> {
  return client.request(
    readItems('semaines', {
      fields: [
        'id', 'numero',
        'periode.id', 'periode.nom', 'periode.ordre',
        'periode.niveau.id', 'periode.niveau.nom', 'periode.niveau.ordre',
        'periode.bloc.id', 'periode.bloc.nom', 'periode.bloc.code', 'periode.bloc.couleur',
        'seances.id', 'seances.titre', 'seances.type', 'seances.duree',
        'seances.points', 'seances.objectif', 'seances.ordre',
        'seances.competences.id',
        'seances.competences.savoir_associe',
        'seances.competences.competence.id',
        'seances.competences.competence.code',
        'seances.competences.competence.intitule',
      ],
      sort: ['periode.niveau.ordre', 'periode.bloc.ordre', 'periode.ordre', 'numero'],
      limit: -1,
    })
  ) as Promise<Semaine[]>
}
