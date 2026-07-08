'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { GOOGLE_SEARCH_CONSOLE_SCOPES } from '@/lib/search-console/oauth'

function getCallbackURL() {
  if (typeof window === 'undefined') return '/dashboard'
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

export function SearchConsoleConnectButton({ reconnect = false }: { reconnect?: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleConnect() {
    setError('')
    setLoading(true)

    const { error: socialError } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: getCallbackURL(),
      errorCallbackURL: '/dashboard',
      scopes: [...GOOGLE_SEARCH_CONSOLE_SCOPES],
      ...(reconnect ? { prompt: 'consent' } : {}),
    })

    if (socialError) {
      setError(socialError.message || 'Unable to connect Google Search Console')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleConnect}
        disabled={loading}
        className="inline-flex h-10 items-center justify-center border border-zinc-700 bg-zinc-950 px-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:opacity-50"
      >
        {loading ? 'Connecting...' : reconnect ? 'Reconnect Google' : 'Connect Search Console'}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
