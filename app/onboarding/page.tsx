import { redirect } from 'next/navigation'
import { ConversationalOnboarding } from '@/components/onboarding/conversational-onboarding'
import { requireUserId } from '@/lib/auth/clerk'

export default async function OnboardingPage() {
  const userId = await requireUserId()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ConversationalOnboarding userId={userId} />
    </div>
  )
}
