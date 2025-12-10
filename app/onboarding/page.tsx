import { redirect } from 'next/navigation'
import { ConversationalOnboarding } from '@/components/onboarding/conversational-onboarding'
import { createClient } from '@/lib/supabase/server'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login?redirectedFrom=/onboarding')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ConversationalOnboarding userId={user.id} />
    </div>
  )
}
