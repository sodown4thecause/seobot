'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import Link from 'next/link'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message || 'Sign in failed')
      setLoading(false)
      return
    }

    window.location.href = getPostAuthURL()
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setGoogleLoading(true)

    const callbackURL = getPostAuthURL()

    const { error: signInError } = await authClient.signIn.social({
      provider: 'google',
      callbackURL,
      errorCallbackURL: '/login',
      newUserCallbackURL: callbackURL,
    })

    if (signInError) {
      setError(signInError.message || 'Google sign in failed')
      setGoogleLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md bg-transparent border-0 shadow-none">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl text-zinc-100">Log in</CardTitle>
        <CardDescription className="text-zinc-400">Welcome back. Enter your credentials to continue.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-4">
          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full bg-zinc-950 border border-zinc-700 text-white hover:bg-zinc-900 font-black uppercase tracking-wider rounded-none text-sm h-12 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-black text-black">
              G
            </span>
            {googleLoading ? 'Connecting...' : 'Continue with Google'}
          </button>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">or</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-zinc-400 uppercase text-xs tracking-wider font-medium">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-white focus:ring-1 focus:ring-white rounded-none px-3 py-2 text-sm"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-zinc-400 uppercase text-xs tracking-wider font-medium">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-white focus:ring-1 focus:ring-white rounded-none px-3 py-2 text-sm"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-wider rounded-none text-sm h-12 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </CardContent>
      <CardFooter className="flex items-center justify-center pt-4">
        <p className="text-sm text-zinc-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

function getPostAuthURL() {
  if (typeof window === 'undefined') return '/dashboard'

  const redirectURL = new URLSearchParams(window.location.search).get('redirect_url')
  if (!redirectURL) return '/dashboard'

  try {
    const parsed = new URL(redirectURL, window.location.origin)
    if (parsed.origin !== window.location.origin) return '/dashboard'
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return '/dashboard'
  }
}
