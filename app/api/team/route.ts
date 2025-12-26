import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/clerk'
import {
  createTeam,
  getUserTeams,
  getTeamMembers,
  addTeamMember,
  checkPermission
} from '@/lib/collaboration/team-service'

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()

    // Verify user is authenticated using StackAuth
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let result

    switch (action) {
      case 'create':
        result = await createTeam({
          name: data.name,
          description: data.description,
          ownerId: user.id,
          settings: data.settings
        })
        break

      case 'add_member':
        // Check if user has permission to add members
        const hasPermission = await checkPermission(user.id, data.teamId, 'members:invite')
        if (!hasPermission) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          )
        }

        result = await addTeamMember(
          data.teamId,
          data.userId,
          data.role,
          user.id
        )
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('Team API error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    // Verify user is authenticated using StackAuth
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let result

    if (teamId) {
      // Get specific team members
      result = await getTeamMembers(teamId)
    } else {
      // Get user's teams
      result = await getUserTeams(user.id)
    }

    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('Team fetch API error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
