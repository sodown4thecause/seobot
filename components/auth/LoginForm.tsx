'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { getAuthErrorMessage } from '@/lib/auth/errors'
import Link from 'next/link'
import { GoogleAuthButton } from './GoogleAuthButton'

export default function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const authError = getAuthErrorMessage(searchParams.get('error'))
    if (authError) {
      setError(authError)
    }
  }, [searchParams])

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

    window.location.href = '/dashboard'
  }

  return (
    <div className="w-full">
      <div className="mb-5 space-y-5">
        <GoogleAuthButton label="Continue with Google" />
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-xs text-zinc-600">or</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-red-400 text-center">{error}</p>
        )}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-white text-black hover:bg-zinc-200 font-medium text-sm h-11 transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-500">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-white underline underline-offset-4 hover:text-zinc-300 transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  )
}
