import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'

export interface GeoTuiConfig {
  apiBaseUrl: string
  cfAccessClientId?: string
  cfAccessClientSecret?: string
}

const configPath = path.join(homedir(), '.config', 'geo-tui', 'config.json')

export function loadGeoTuiConfig(): GeoTuiConfig {
  if (!existsSync(configPath)) {
    throw new Error(`Missing config at ${configPath}. Create it with apiBaseUrl and Cloudflare Access service token fields.`)
  }

  const raw = JSON.parse(readFileSync(configPath, 'utf8')) as GeoTuiConfig
  if (!raw.apiBaseUrl) {
    throw new Error('config.json must include apiBaseUrl')
  }

  return raw
}

export function saveGeoTuiConfig(config: GeoTuiConfig) {
  mkdirSync(path.dirname(configPath), { recursive: true })
  writeFileSync(configPath, JSON.stringify(config, null, 2))
}

export async function fetchDigest(config: GeoTuiConfig) {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (config.cfAccessClientId && config.cfAccessClientSecret) {
    headers['CF-Access-Client-Id'] = config.cfAccessClientId
    headers['CF-Access-Client-Secret'] = config.cfAccessClientSecret
  }

  const response = await fetch(`${config.apiBaseUrl.replace(/\/$/, '')}/digest/latest`, { headers })
  if (!response.ok) {
    throw new Error(`Failed to load digest (${response.status})`)
  }

  return response.json()
}
