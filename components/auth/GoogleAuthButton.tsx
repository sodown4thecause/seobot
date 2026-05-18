'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'

function getSafeCallbackURL() {
  if (typeof window === 'undefined') return '/dashboard'

  const params = new URLSearchParams(window.location.search)
  const requested = params.get('redirect_url') || params.get('callbackURL')
  if (!requested) return '/dashboard'

  if (requested.startsWith('/') && !requested.startsWith('//')) {
    return requested
  }

  try {
    const url = new URL(requested)
    if (url.origin === window.location.origin) {
      return `${url.pathname}${url.search}${url.hash}`
    }
  } catch {
    // Ignore malformed redirect targets.
  }

  return '/dashboard'
}

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

export function GoogleAuthButton({ label }: { label: string }) {
  if (!googleClientId) return null
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGoogleAuth() {
    setError('')
    setLoading(true)

    const { error: socialError } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: getSafeCallbackURL(),
    })

    if (socialError) {
      setError(socialError.message || 'Google sign-in is not available')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleGoogleAuth}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-3 border border-zinc-700 bg-zinc-950 px-3 text-sm font-bold uppercase tracking-wider text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:opacity-50"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-black text-black">
          G
        </span>
        {loading ? 'Connecting...' : label}
      </button>
      {error && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
