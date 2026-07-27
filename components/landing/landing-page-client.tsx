'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function AuthErrorRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const authError = searchParams.get('error')
    if (!authError) return

    const params = new URLSearchParams(searchParams.toString())
    router.replace(`/login?${params.toString()}`)
  }, [router, searchParams])

  return null
}
