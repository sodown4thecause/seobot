'use client'

import { SignUp } from '@clerk/nextjs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import Link from 'next/link'

export default function SignupForm() {
  return (
    <Card className="w-full max-w-md bg-transparent border-0 shadow-none">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl text-zinc-100">Create an account</CardTitle>
        <CardDescription className="text-zinc-400">Start your SEO journey today.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 flex justify-center">
        <SignUp appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-transparent shadow-none border-0',
          }
        }} />
      </CardContent>
      <CardFooter className="flex items-center justify-center pt-4">
        <p className="text-sm text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 underline">
            Log in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
