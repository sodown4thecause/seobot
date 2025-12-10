import { generateObject } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'
import { serverEnv } from '@/lib/config/env'
import { createAdminClient } from '@/lib/supabase/server'

const google = createGoogleGenerativeAI({
  apiKey: serverEnv.GOOGLE_GENERATIVE_AI_API_KEY || serverEnv.GOOGLE_API_KEY,
})

// Use singleton admin client for Supabase operations
const supabase = createAdminClient()

export interface Team {
  id: string
  name: string
  description?: string
  ownerId: string
  settings: TeamSettings
  subscriptionType: 'free' | 'pro' | 'enterprise'
  memberCount: number
  createdAt: string
  updatedAt: string
}

export interface TeamSettings {
  brandVoice?: string
  guidelines?: string[]
  workflows?: TeamWorkflow[]
  approvalRequired?: boolean
  defaultRoles?: string[]
}

export interface TeamWorkflow {
  id: string
  name: string
  steps: WorkflowStep[]
  isActive: boolean
}

export interface WorkflowStep {
  id: string
  name: string
  type: 'review' | 'approval' | 'edit' | 'publish'
  assignedRole: string
  required: boolean
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  role: 'owner' | 'admin' | 'editor' | 'member' | 'viewer'
  permissions: string[]
  status: 'pending' | 'active' | 'inactive'
  userProfile: {
    name: string
    email: string
    avatar?: string
  }
  invitedAt?: string
  joinedAt: string
}

export interface ContentComment {
  id: string
  contentId: string
  userId: string
  teamId?: string
  commentText: string
  commentType: 'general' | 'seo' | 'style' | 'fact_check' | 'approval'
  parentCommentId?: string
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: string
  userProfile: {
    name: string
    email: string
    avatar?: string
  }
  replies?: ContentComment[]
  createdAt: string
  updatedAt: string
}

export interface ContentApproval {
  id: string
  contentId: string
  userId: string
  teamId?: string
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested'
  approvalLevel: 'draft' | 'review' | 'final' | 'publish'
  notes?: string
  userProfile: {
    name: string
    email: string
    avatar?: string
  }
  createdAt: string
  updatedAt: string
}

/**
 * Create a new team
 */
export async function createTeam(params: {
  name: string
  description?: string
  ownerId: string
  settings?: Partial<TeamSettings>
}): Promise<Team> {
  try {
    const { data, error } = await supabase
      .from('teams')
      .insert({
        name: params.name,
        description: params.description,
        owner_id: params.ownerId,
        settings: params.settings || {},
        subscription_type: 'free'
      })
      .select()
      .single()

    if (error) throw error

    // Add owner as team member
    await addTeamMember(data.id, params.ownerId, 'owner', params.ownerId)

    // Get member count
    const { count } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', data.id)

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      ownerId: data.owner_id,
      settings: data.settings,
      subscriptionType: data.subscription_type,
      memberCount: count || 1,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  } catch (error) {
    console.error('Failed to create team:', error)
    throw error
  }
}

/**
 * Add a member to a team
 */
export async function addTeamMember(
  teamId: string,
  userId: string,
  role: TeamMember['role'],
  invitedBy: string
): Promise<TeamMember> {
  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email, avatar_url')
      .eq('id', userId)
      .single()

    const { data, error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role,
        permissions: getDefaultPermissions(role),
        invited_by: invitedBy,
        status: 'pending'
      })
      .select(`
        *,
        user:profiles(name, email, avatar_url)
      `)
      .single()

    if (error) throw error

    return {
      id: data.id,
      teamId: data.team_id,
      userId: data.user_id,
      role: data.role,
      permissions: data.permissions,
      status: data.status,
      userProfile: {
        name: data.user.name,
        email: data.user.email,
        avatar: data.user.avatar_url
      },
      invitedAt: data.invited_at,
      joinedAt: data.joined_at
    }
  } catch (error) {
    console.error('Failed to add team member:', error)
    throw error
  }
}

/**
 * Get user's teams
 */
export async function getUserTeams(userId: string): Promise<Team[]> {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_members!inner(count)
      `)
      .or(`owner_id.eq.${userId},team_members.user_id.eq.${userId}`)
      .eq('team_members.status', 'active')

    if (error) throw error

    return data.map((team: any) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      ownerId: team.owner_id,
      settings: team.settings,
      subscriptionType: team.subscription_type,
      memberCount: team.team_members?.length || 0,
      createdAt: team.created_at,
      updatedAt: team.updated_at
    }))
  } catch (error) {
    console.error('Failed to get user teams:', error)
    throw error
  }
}

/**
 * Get team members
 */
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        user:profiles(name, email, avatar_url)
      `)
      .eq('team_id', teamId)
      .order('joined_at', { ascending: true })

    if (error) throw error

    return data.map((member: any) => ({
      id: member.id,
      teamId: member.team_id,
      userId: member.user_id,
      role: member.role,
      permissions: member.permissions,
      status: member.status,
      userProfile: {
        name: member.user.name,
        email: member.user.email,
        avatar: member.user.avatar_url
      },
      invitedAt: member.invited_at,
      joinedAt: member.joined_at
    }))
  } catch (error) {
    console.error('Failed to get team members:', error)
    throw error
  }
}

/**
 * Add a comment to content
 */
export async function addContentComment(params: {
  contentId: string
  userId: string
  teamId?: string
  commentText: string
  commentType: ContentComment['commentType']
  parentCommentId?: string
}): Promise<ContentComment> {
  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email, avatar_url')
      .eq('id', params.userId)
      .single()

    const { data, error } = await supabase
      .from('content_comments')
      .insert({
        content_id: params.contentId,
        user_id: params.userId,
        team_id: params.teamId,
        comment_text: params.commentText,
        comment_type: params.commentType,
        parent_comment_id: params.parentCommentId
      })
      .select()
      .single()

    if (error) throw error
    if (!profile) {
      throw new Error('User profile not found')
    }

    const userProfile = profile // TypeScript now knows profile is not null

    return {
      id: data.id,
      contentId: data.content_id,
      userId: data.user_id,
      teamId: data.team_id,
      commentText: data.comment_text,
      commentType: data.comment_type,
      parentCommentId: data.parent_comment_id,
      resolved: data.resolved,
      resolvedBy: data.resolved_by,
      resolvedAt: data.resolved_at,
      userProfile: {
        name: userProfile.name || '',
        email: userProfile.email || '',
        avatar: userProfile.avatar_url || null
      },
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  } catch (error) {
    console.error('Failed to add content comment:', error)
    throw error
  }
}

/**
 * Get comments for content
 */
export async function getContentComments(
  contentId: string,
  teamId?: string,
  includeResolved: boolean = false
): Promise<ContentComment[]> {
  try {
    let query = supabase
      .from('content_comments')
      .select(`
        *,
        user:profiles(name, email, avatar_url),
        replies:content_comments(
          *,
          user:profiles(name, email, avatar_url)
        )
      `)
      .eq('content_id', contentId)
      .is('parent_comment_id', null)

    if (teamId) {
      query = query.eq('team_id', teamId)
    }

    if (!includeResolved) {
      query = query.eq('resolved', false)
    }

    const { data, error } = await query.order('created_at', { ascending: true })

    if (error) throw error

    return data.map((comment: any) => ({
      id: comment.id,
      contentId: comment.content_id,
      userId: comment.user_id,
      teamId: comment.team_id,
      commentText: comment.comment_text,
      commentType: comment.comment_type,
      parentCommentId: comment.parent_comment_id,
      resolved: comment.resolved,
      resolvedBy: comment.resolved_by,
      resolvedAt: comment.resolved_at,
      userProfile: {
        name: comment.user.name,
        email: comment.user.email,
        avatar: comment.user.avatar_url
      },
      replies: comment.replies?.map((reply: any) => ({
        id: reply.id,
        contentId: reply.content_id,
        userId: reply.user_id,
        teamId: reply.team_id,
        commentText: reply.comment_text,
        commentType: reply.comment_type,
        parentCommentId: reply.parent_comment_id,
        resolved: reply.resolved,
        resolvedBy: reply.resolved_by,
        resolvedAt: reply.resolved_at,
        userProfile: {
          name: reply.user.name,
          email: reply.user.email,
          avatar: reply.user.avatar_url
        },
        createdAt: reply.created_at,
        updatedAt: reply.updated_at
      })) || [],
      createdAt: comment.created_at,
      updatedAt: comment.updated_at
    }))
  } catch (error) {
    console.error('Failed to get content comments:', error)
    throw error
  }
}

/**
 * Submit content for approval
 */
export async function submitForApproval(params: {
  contentId: string
  userId: string
  teamId?: string
  approvalLevel: ContentApproval['approvalLevel']
  notes?: string
}): Promise<ContentApproval> {
  try {
    // Get user profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('name, email, avatar_url')
      .eq('id', params.userId)
      .single()

    const { data, error } = await supabase
      .from('content_approvals')
      .insert({
        content_id: params.contentId,
        user_id: params.userId,
        team_id: params.teamId,
        approval_level: params.approvalLevel,
        notes: params.notes,
        status: 'pending'
      })
      .select(`
        *,
        user:profiles(name, email, avatar_url)
      `)
      .single()

    if (error) throw error
    if (!data) {
      throw new Error('Failed to create approval request')
    }

    const profile = data.user as { name: string | null; email: string | null; avatar_url: string | null } | null

    return {
      id: data.id,
      contentId: data.content_id,
      userId: data.user_id,
      teamId: data.team_id,
      status: data.status,
      approvalLevel: data.approval_level,
      notes: data.notes,
      userProfile: {
        name: profile?.name || '',
        email: profile?.email || '',
        avatar: profile?.avatar_url || undefined
      },
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  } catch (error) {
    console.error('Failed to submit for approval:', error)
    throw error
  }
}

/**
 * Update approval status
 */
export async function updateApprovalStatus(params: {
  approvalId: string
  userId: string
  status: ContentApproval['status']
  notes?: string
}): Promise<ContentApproval> {
  try {
    const { data, error } = await supabase
      .from('content_approvals')
      .update({
        status: params.status,
        notes: params.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.approvalId)
      .eq('user_id', params.userId)
      .select(`
        *,
        user:profiles(name, email, avatar_url)
      `)
      .single()

    if (error) throw error

    return {
      id: data.id,
      contentId: data.content_id,
      userId: data.user_id,
      teamId: data.team_id,
      status: data.status,
      approvalLevel: data.approval_level,
      notes: data.notes,
      userProfile: {
        name: data.user.name,
        email: data.user.email,
        avatar: data.user.avatar_url
      },
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  } catch (error) {
    console.error('Failed to update approval status:', error)
    throw error
  }
}

/**
 * Get pending approvals for a user/team
 */
export async function getPendingApprovals(
  userId: string,
  teamId?: string
): Promise<ContentApproval[]> {
  try {
    let query = supabase
      .from('content_approvals')
      .select(`
        *,
        user:profiles(name, email, avatar_url),
        content:content(id, title, status)
      `)
      .eq('status', 'pending')

    if (teamId) {
      query = query.eq('team_id', teamId)
    } else {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return data.map((approval: any) => ({
      id: approval.id,
      contentId: approval.content_id,
      userId: approval.user_id,
      teamId: approval.team_id,
      status: approval.status,
      approvalLevel: approval.approval_level,
      notes: approval.notes,
      userProfile: {
        name: approval.user.name,
        email: approval.user.email,
        avatar: approval.user.avatar_url
      },
      createdAt: approval.created_at,
      updatedAt: approval.updated_at
    }))
  } catch (error) {
    console.error('Failed to get pending approvals:', error)
    throw error
  }
}

/**
 * Generate AI-powered collaboration suggestions
 */
export async function generateCollaborationInsights(
  teamId: string,
  contentData: {
    title: string
    content: string
    targetKeyword: string
  }
): Promise<{
  suggestedReviewers: string[]
  potentialIssues: string[]
  optimizationTips: string[]
}> {
  try {
    const prompt = `Analyze this content for team collaboration insights.

Title: "${contentData.title}"
Target Keyword: "${contentData.targetKeyword}"
Content: "${contentData.content.substring(0, 1500)}..."

Provide insights for:
1. Suggested reviewers (roles/expertise needed)
2. Potential issues that team collaboration could catch
3. Optimization tips for team workflow

Return as JSON with keys: suggestedReviewers, potentialIssues, optimizationTips`

    const collaborationInsightsSchema = z.object({
      suggestedReviewers: z.array(z.string()),
      potentialIssues: z.array(z.string()),
      optimizationTips: z.array(z.string()),
    })

    const { object } = await generateObject({
      model: google('gemini-3-pro-preview') as any,
      prompt,
      schema: collaborationInsightsSchema,
    })

    return object as {
      suggestedReviewers: string[]
      potentialIssues: string[]
      optimizationTips: string[]
    }
  } catch (error) {
    console.error('Failed to generate collaboration insights:', error)
    return {
      suggestedReviewers: [],
      potentialIssues: [],
      optimizationTips: []
    }
  }
}

/**
 * Get default permissions for a role
 */
function getDefaultPermissions(role: TeamMember['role']): string[] {
  const permissions = {
    owner: [
      'team:manage', 'team:delete', 'members:invite', 'members:remove', 'members:manage',
      'content:create', 'content:edit', 'content:delete', 'content:publish',
      'comments:manage', 'approvals:manage', 'settings:manage'
    ],
    admin: [
      'members:invite', 'members:remove',
      'content:create', 'content:edit', 'content:publish',
      'comments:manage', 'approvals:manage'
    ],
    editor: [
      'content:create', 'content:edit',
      'comments:create', 'comments:resolve'
    ],
    member: [
      'content:view', 'comments:create'
    ],
    viewer: [
      'content:view'
    ]
  }

  return permissions[role] || []
}

/**
 * Check if user has permission for an action
 */
export async function checkPermission(
  userId: string,
  teamId: string,
  permission: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('permissions, role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error || !data) return false

    // Owners have all permissions
    if (data.role === 'owner') return true

    return data.permissions.includes(permission)
  } catch (error) {
    console.error('Failed to check permission:', error)
    return false
  }
}
