'use client'

import { SignIn } from '@clerk/nextjs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import Link from 'next/link'

export default function LoginForm() {
  return (
    <Card className="w-full max-w-md bg-transparent border-0 shadow-none">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl text-zinc-100">Log in</CardTitle>
        <CardDescription className="text-zinc-400">Welcome back. Enter your credentials to continue.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 flex justify-center">
        <SignIn appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-transparent shadow-none border-0',
          }
        }} />
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
