import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { type OnboardingData } from '@/lib/onboarding/state'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { userId, stepData } = await req.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if profile exists
    const { data: existing } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    const profileData: any = {
      user_id: userId,
      website_url: stepData.websiteUrl || null,
      industry: stepData.industry || null,
      goals: stepData.goals || null,
      locations: stepData.location ? [stepData.location] : null,
      content_frequency: stepData.contentFrequency || null,
      updated_at: new Date().toISOString(),
    }

    let result
    if (existing) {
      result = await supabase
        .from('business_profiles')
        .update(profileData)
        .eq('user_id', userId)
    } else {
      result = await supabase
        .from('business_profiles')
        .insert(profileData)
    }

    if (result.error) {
      throw result.error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Save step error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

