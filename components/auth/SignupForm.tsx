'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import Link from 'next/link'
import { GoogleAuthButton } from './GoogleAuthButton'

export default function SignupForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
    })

    if (signUpError) {
      setError(signUpError.message || 'Sign up failed')
      setLoading(false)
      return
    }

    window.location.href = '/dashboard'
  }

  return (
    <div className="w-full">
      <div className="mb-5 space-y-5">
        <GoogleAuthButton label="Sign up with Google" />
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
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
            placeholder="Your name"
          />
        </div>
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
            minLength={8}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-white text-black hover:bg-zinc-200 font-medium text-sm h-11 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{' '}
        <Link href="/login" className="text-white underline underline-offset-4 hover:text-zinc-300 transition-colors">
          Log in
        </Link>
      </p>
    </div>
  )
}
