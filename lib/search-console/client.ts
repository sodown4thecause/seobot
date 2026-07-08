import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as authSchema from '@/lib/auth-schema'
import { GOOGLE_SEARCH_CONSOLE_SCOPE } from './oauth'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SEARCH_CONSOLE_BASE_URL = 'https://www.googleapis.com/webmasters/v3'

export interface SearchConsoleSite {
  siteUrl: string
  permissionLevel?: string
}

export interface SearchConsoleAnalyticsRow {
  keys?: string[]
  clicks?: number
  impressions?: number
  ctr?: number
  position?: number
}

export interface SearchConsoleQueryOptions {
  siteUrl: string
  startDate: string
  endDate: string
  dimensions?: Array<'query' | 'page' | 'country' | 'device' | 'date'>
  rowLimit?: number
}

interface GoogleAccount {
  id: string
  accessToken: string | null
  refreshToken: string | null
  accessTokenExpiresAt: Date | null
  scope: string | null
}

interface GoogleRefreshResponse {
  access_token?: string
  expires_in?: number
  scope?: string
  token_type?: string
  error?: string
  error_description?: string
}

function hasSearchConsoleScope(scope: string | null | undefined): boolean {
  if (!scope) return false
  return scope
    .split(/[,\s]+/)
    .map(value => value.trim())
    .filter(Boolean)
    .includes(GOOGLE_SEARCH_CONSOLE_SCOPE)
}

function isExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false
  return expiresAt.getTime() <= Date.now() + 60_000
}

async function getGoogleAccount(userId: string): Promise<GoogleAccount | null> {
  const [account] = await db
    .select({
      id: authSchema.account.id,
      accessToken: authSchema.account.accessToken,
      refreshToken: authSchema.account.refreshToken,
      accessTokenExpiresAt: authSchema.account.accessTokenExpiresAt,
      scope: authSchema.account.scope,
    })
    .from(authSchema.account)
    .where(and(
      eq(authSchema.account.userId, userId),
      eq(authSchema.account.providerId, 'google'),
    ))
    .limit(1)

  return account ?? null
}

async function refreshGoogleAccessToken(account: GoogleAccount): Promise<string> {
  if (!account.refreshToken) {
    throw new Error('Google Search Console access expired. Reconnect Google with Search Console permission.')
  }
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials are not configured.')
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: account.refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const data = await response.json().catch(() => ({})) as GoogleRefreshResponse

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Failed to refresh Google access token')
  }

  const accessTokenExpiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000)
    : null
  const scope = data.scope || account.scope

  await db
    .update(authSchema.account)
    .set({
      accessToken: data.access_token,
      accessTokenExpiresAt,
      scope,
      updatedAt: new Date(),
    })
    .where(eq(authSchema.account.id, account.id))

  return data.access_token
}

export async function getSearchConsoleAccessToken(userId: string): Promise<string> {
  const account = await getGoogleAccount(userId)
  if (!account?.accessToken) {
    throw new Error('Connect Google Search Console before importing first-party performance data.')
  }

  if (!hasSearchConsoleScope(account.scope)) {
    throw new Error('Google account is connected without Search Console read permission. Reconnect with Search Console access.')
  }

  if (isExpired(account.accessTokenExpiresAt)) {
    return refreshGoogleAccessToken(account)
  }

  return account.accessToken
}

async function searchConsoleFetch<T>(userId: string, path: string, init?: RequestInit): Promise<T> {
  const accessToken = await getSearchConsoleAccessToken(userId)
  const response = await fetch(`${SEARCH_CONSOLE_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Google Search Console API error ${response.status}: ${text.slice(0, 500)}`)
  }

  return await response.json() as T
}

export async function listSearchConsoleSites(userId: string): Promise<SearchConsoleSite[]> {
  const data = await searchConsoleFetch<{ siteEntry?: SearchConsoleSite[] }>(userId, '/sites')
  return data.siteEntry ?? []
}

export async function querySearchConsoleAnalytics(
  userId: string,
  options: SearchConsoleQueryOptions
): Promise<SearchConsoleAnalyticsRow[]> {
  const dimensions = options.dimensions ?? ['query', 'page']
  const rowLimit = Math.min(Math.max(options.rowLimit ?? 100, 1), 1000)
  const sitePath = encodeURIComponent(options.siteUrl)
  const data = await searchConsoleFetch<{ rows?: SearchConsoleAnalyticsRow[] }>(
    userId,
    `/sites/${sitePath}/searchAnalytics/query`,
    {
      method: 'POST',
      body: JSON.stringify({
        startDate: options.startDate,
        endDate: options.endDate,
        dimensions,
        rowLimit,
        searchType: 'web',
      }),
    }
  )

  return data.rows ?? []
}

export function hasGoogleSearchConsoleScope(scope: string | null | undefined): boolean {
  return hasSearchConsoleScope(scope)
}
