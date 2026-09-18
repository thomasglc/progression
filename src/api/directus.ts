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

export class AuthError extends Error {
  constructor() { super('Session expirée, veuillez vous reconnecter') }
}

let _onAuthError: (() => void) | null = null
export function setAuthErrorHandler(fn: () => void) { _onAuthError = fn }

export interface AuthTokens { access_token: string; refresh_token: string }

export async function loginDirectus(email: string, password: string): Promise<AuthTokens> {
  const resp = await fetch(`${directusUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!resp.ok) throw new Error('Identifiants incorrects')
  const data = await resp.json()
  return { access_token: data.data.access_token, refresh_token: data.data.refresh_token }
}

export async function refreshDirectusToken(refreshToken: string): Promise<AuthTokens> {
  const resp = await fetch(`${directusUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken, mode: 'json' }),
  })
  if (!resp.ok) throw new AuthError()
  const data = await resp.json()
  return { access_token: data.data.access_token, refresh_token: data.data.refresh_token }
}

// ─── Admin helpers ────────────────────────────────────────────────────────────

function adminHeaders(token: string) {
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
}

async function adminFetch(url: string, init: RequestInit): Promise<Response> {
  const resp = await fetch(url, init)
  if (resp.status === 401 || resp.status === 403) {
    _onAuthError?.()
    throw new AuthError()
  }
  if (!resp.ok) throw new Error(`Erreur API: ${resp.status}`)
  return resp
}

export async function fetchCompetences(): Promise<Competence[]> {
  return client.request(
    readItems('competences', { fields: ['id', 'code', 'intitule'], sort: ['code'], limit: -1 })
  ) as Promise<Competence[]>
}

export async function patchSeance(id: number, body: object, token: string): Promise<void> {
  await adminFetch(`${directusUrl}/items/seances/${id}`, {
    method: 'PATCH',
    headers: adminHeaders(token),
    body: JSON.stringify(body),
  })
}

export async function createSeance(body: object, token: string): Promise<number> {
  const resp = await adminFetch(`${directusUrl}/items/seances`, {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify(body),
  })
  const data = await resp.json()
  return data.data.id as number
}

export async function deleteSeance(id: number, token: string): Promise<void> {
  await adminFetch(`${directusUrl}/items/seances/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  })
}

export async function createSemaine(body: object, token: string): Promise<number> {
  const resp = await adminFetch(`${directusUrl}/items/semaines`, {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify(body),
  })
  const data = await resp.json()
  return data.data.id as number
}

export async function createSeanceCompetence(body: object, token: string): Promise<void> {
  await adminFetch(`${directusUrl}/items/seances_competences`, {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify(body),
  })
}

export async function deleteSeanceCompetence(id: number, token: string): Promise<void> {
  await adminFetch(`${directusUrl}/items/seances_competences/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  })
}
