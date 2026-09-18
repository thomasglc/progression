import { createDirectus, rest, readItems } from '@directus/sdk'
import type { Semaine, Competence } from '../types'

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

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function loginDirectus(email: string, password: string): Promise<string> {
  const resp = await fetch(`${directusUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!resp.ok) throw new Error('Identifiants incorrects')
  const data = await resp.json()
  return data.data.access_token as string
}

// ─── Admin helpers ────────────────────────────────────────────────────────────

function adminHeaders(token: string) {
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export async function fetchCompetences(token: string): Promise<Competence[]> {
  const resp = await fetch(`${directusUrl}/items/competences?limit=-1&sort=code`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  const data = await resp.json()
  return data.data as Competence[]
}

export async function patchSeance(id: number, body: object, token: string): Promise<void> {
  const resp = await fetch(`${directusUrl}/items/seances/${id}`, {
    method: 'PATCH',
    headers: adminHeaders(token),
    body: JSON.stringify(body),
  })
  if (!resp.ok) throw new Error('Erreur lors de la modification de la séance')
}

export async function createSeance(body: object, token: string): Promise<number> {
  const resp = await fetch(`${directusUrl}/items/seances`, {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify(body),
  })
  if (!resp.ok) throw new Error('Erreur lors de la création de la séance')
  const data = await resp.json()
  return data.data.id as number
}

export async function deleteSeance(id: number, token: string): Promise<void> {
  await fetch(`${directusUrl}/items/seances/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  })
}

export async function createSemaine(body: object, token: string): Promise<number> {
  const resp = await fetch(`${directusUrl}/items/semaines`, {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify(body),
  })
  if (!resp.ok) throw new Error('Erreur lors de la création de la semaine')
  const data = await resp.json()
  return data.data.id as number
}

export async function createSeanceCompetence(body: object, token: string): Promise<void> {
  const resp = await fetch(`${directusUrl}/items/seances_competences`, {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify(body),
  })
  if (!resp.ok) throw new Error('Erreur lors de la création du lien compétence')
}

export async function deleteSeanceCompetence(id: number, token: string): Promise<void> {
  await fetch(`${directusUrl}/items/seances_competences/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  })
}
