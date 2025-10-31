'use client'

import { ConversationalOnboarding } from '@/components/onboarding/conversational-onboarding'
import { useRouter } from 'next/navigation'
import { type OnboardingData } from '@/lib/onboarding/state'

export default function OnboardingPage() {
  const router = useRouter()

  const handleComplete = (data: OnboardingData) => {
    // Redirect to dashboard after completion
    setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
  }

  return <ConversationalOnboarding onComplete={handleComplete} />
}
