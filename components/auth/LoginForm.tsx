'use client'

import { useActionState } from 'react'
import { signIn } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import Link from 'next/link'
import { useId } from 'react'

type AuthState = {
  error?: string
  success?: string | boolean
  fields?: { email?: string }
}

const initialState: AuthState = {}

export default function LoginForm() {
  const emailId = useId()
  const passwordId = useId()
  const [state, formAction, pending] = useActionState(signIn, initialState)

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>Welcome back. Enter your credentials to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={emailId}>Email</Label>
            <Input
              id={emailId}
              name="email"
              type="email"
              defaultValue={state.fields?.email ?? ''}
              autoComplete="email"
              placeholder="you@example.com"
              required
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={passwordId}>Password</Label>
            <Input
              id={passwordId}
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              disabled={pending}
            />
          </div>

          {state.error ? (
            <p className="text-sm text-red-500">{state.error}</p>
          ) : null}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
