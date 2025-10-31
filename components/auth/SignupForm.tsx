'use client'

import { useActionState } from 'react'
import { signUp } from '@/lib/auth/actions'
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

export default function SignupForm() {
  const emailId = useId()
  const passwordId = useId()
  const [state, formAction, pending] = useActionState(signUp, initialState)

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Start your journey. A confirmation email may be required.</CardDescription>
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
              autoComplete="new-password"
              placeholder="At least 8 characters"
              required
              disabled={pending}
            />
          </div>

          {state.error ? (
            <p className="text-sm text-red-500">{state.error}</p>
          ) : null}
          {typeof state.success === 'string' ? (
            <p className="text-sm text-emerald-500">{state.success}</p>
          ) : null}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Creating account...' : 'Sign up'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="underline">
            Log in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
