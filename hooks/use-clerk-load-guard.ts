'use client'

import { useEffect, useState } from 'react'

export function useClerkLoadGuard(isLoaded: boolean, timeoutMs = 5000) {
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (isLoaded) {
      setTimedOut(false)
      return
    }

    setTimedOut(false)
    const id = setTimeout(() => setTimedOut(true), timeoutMs)
    return () => clearTimeout(id)
  }, [isLoaded, timeoutMs])

  return { timedOut, ready: isLoaded || timedOut }
}

