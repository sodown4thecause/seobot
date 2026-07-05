'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { getAuthErrorMessage } from '@/lib/auth/errors'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
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
    <Card className="w-full max-w-md bg-transparent border-0 shadow-none">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl text-zinc-100">Log in</CardTitle>
        <CardDescription className="text-zinc-400">Welcome back. Enter your credentials to continue.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="mb-5 space-y-5">
          <GoogleAuthButton label="Continue with Google" />
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">or</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}
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
            disabled={loading}
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
