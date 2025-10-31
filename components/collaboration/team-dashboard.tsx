'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Settings,
  Crown,
  Shield,
  Edit,
  Eye,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Reply,
  ThumbsUp,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  getUserTeams,
  getTeamMembers,
  addTeamMember,
  getContentComments,
  addContentComment,
  getPendingApprovals,
  submitForApproval,
  updateApprovalStatus,
  generateCollaborationInsights,
  Team,
  TeamMember,
  ContentComment,
  ContentApproval
} from '@/lib/collaboration/team-service'

interface TeamDashboardProps {
  userId: string
  contentId?: string
  contentData?: {
    title: string
    content: string
    targetKeyword: string
  }
}

export function TeamDashboard({ 
  userId, 
  contentId, 
  contentData 
}: TeamDashboardProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [comments, setComments] = useState<ContentComment[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<ContentApproval[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [newComment, setNewComment] = useState('')
  const [commentType, setCommentType] = useState<ContentComment['commentType']>('general')
  const [isInvitingMember, setIsInvitingMember] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member' as TeamMember['role']
  })
  const [collaborationInsights, setCollaborationInsights] = useState<any>(null)

  const { toast } = useToast()

  useEffect(() => {
    loadTeams()
  }, [userId])

  useEffect(() => {
    if (selectedTeam) {
      loadTeamData()
    }
  }, [selectedTeam, contentId])

  const loadTeams = async () => {
    try {
      const userTeams = await getUserTeams(userId)
      setTeams(userTeams)
      if (userTeams.length > 0 && !selectedTeam) {
        setSelectedTeam(userTeams[0])
      }
    } catch (error) {
      console.error('Failed to load teams:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTeamData = async () => {
    if (!selectedTeam) return

    try {
      const [teamMembers, contentComments, approvals] = await Promise.all([
        getTeamMembers(selectedTeam.id),
        contentId ? getContentComments(contentId, selectedTeam.id) : Promise.resolve([]),
        getPendingApprovals(userId, selectedTeam.id)
      ])

      setMembers(teamMembers)
      setComments(contentComments)
      setPendingApprovals(approvals)

      // Generate AI insights if content data is available
      if (contentData) {
        const insights = await generateCollaborationInsights(selectedTeam.id, contentData)
        setCollaborationInsights(insights)
      }
    } catch (error) {
      console.error('Failed to load team data:', error)
    }
  }

  const handleInviteMember = async () => {
    if (!selectedTeam || !inviteForm.email) return

    setIsInvitingMember(true)
    try {
      // In a real implementation, you would:
      // 1. Find user by email
      // 2. Send invitation
      // 3. Create pending team member record
      
      await addTeamMember(selectedTeam.id, 'temp-user-id', inviteForm.role, userId)
      
      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${inviteForm.email}`,
      })

      setInviteForm({ email: '', role: 'member' })
      loadTeamData()
    } catch (error) {
      console.error('Failed to invite member:', error)
      toast({
        title: "Failed to invite",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsInvitingMember(false)
    }
  }

  const handleAddComment = async () => {
    if (!contentId || !selectedTeam || !newComment.trim()) return

    try {
      await addContentComment({
        contentId,
        userId,
        teamId: selectedTeam.id,
        commentText: newComment,
        commentType
      })

      toast({
        title: "Comment added",
        description: "Your comment has been posted.",
      })

      setNewComment('')
      loadTeamData()
    } catch (error) {
      console.error('Failed to add comment:', error)
      toast({
        title: "Failed to add comment",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  }

  const handleSubmitForApproval = async () => {
    if (!contentId || !selectedTeam) return

    try {
      await submitForApproval({
        contentId,
        userId,
        teamId: selectedTeam.id,
        approvalLevel: 'review',
        notes: 'Ready for team review'
      })

      toast({
        title: "Submitted for approval",
        description: "Your content has been submitted for team review.",
      })

      loadTeamData()
    } catch (error) {
      console.error('Failed to submit for approval:', error)
      toast({
        title: "Failed to submit",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  }

  const getRoleIcon = (role: TeamMember['role']) => {
    switch (role) {
      case 'owner': return <Crown className="w-3 h-3" />
      case 'admin': return <Shield className="w-3 h-3" />
      case 'editor': return <Edit className="w-3 h-3" />
      case 'member': return <Users className="w-3 h-3" />
      case 'viewer': return <Eye className="w-3 h-3" />
      default: return <Users className="w-3 h-3" />
    }
  }

  const getRoleColor = (role: TeamMember['role']) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800'
      case 'admin': return 'bg-blue-100 text-blue-800'
      case 'editor': return 'bg-green-100 text-green-800'
      case 'member': return 'bg-gray-100 text-gray-800'
      case 'viewer': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCommentTypeColor = (type: ContentComment['commentType']) => {
    switch (type) {
      case 'seo': return 'bg-blue-100 text-blue-800'
      case 'style': return 'bg-purple-100 text-purple-800'
      case 'fact_check': return 'bg-red-100 text-red-800'
      case 'approval': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getApprovalStatusColor = (status: ContentApproval['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'changes_requested': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
          <p className="text-sm text-gray-600 text-center mb-4">
            Create your first team to start collaborating with others
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Team Collaboration</h3>
            <p className="text-sm text-gray-600">Work together with your team</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedTeam?.id} onValueChange={(value) => {
            const team = teams.find(t => t.id === value)
            setSelectedTeam(team || null)
          }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name} ({team.memberCount})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* AI Collaboration Insights */}
      {collaborationInsights && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-blue-600" />
              AI Collaboration Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {collaborationInsights.suggestedReviewers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Suggested Reviewers</h4>
                <div className="flex flex-wrap gap-2">
                  {collaborationInsights.suggestedReviewers.map((reviewer: string, index: number) => (
                    <Badge key={index} variant="outline" className="bg-white">
                      {reviewer}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {collaborationInsights.potentialIssues.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Potential Issues to Review</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {collaborationInsights.potentialIssues.map((issue: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
          <TabsTrigger value="approvals">Approvals ({pendingApprovals.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{selectedTeam?.memberCount}</p>
                    <p className="text-sm text-gray-600">Team Members</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{comments.length}</p>
                    <p className="text-sm text-gray-600">Active Comments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{pendingApprovals.length}</p>
                    <p className="text-sm text-gray-600">Pending Approvals</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {comments.slice(0, 3).map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.userProfile.avatar} />
                      <AvatarFallback>
                        {comment.userProfile.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium">{comment.userProfile.name}</span>
                        <Badge className={getCommentTypeColor(comment.commentType)}>
                          {comment.commentType}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{comment.commentText}</p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-sm text-gray-600 text-center py-4">
                    No recent activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search members..."
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="colleague@example.com"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Role
                    </label>
                    <Select
                      value={inviteForm.role}
                      onValueChange={(value) => setInviteForm(prev => ({ ...prev, role: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline">Cancel</Button>
                    <Button
                      onClick={handleInviteMember}
                      disabled={isInvitingMember || !inviteForm.email}
                    >
                      {isInvitingMember ? 'Inviting...' : 'Send Invitation'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {members.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={member.userProfile.avatar} />
                        <AvatarFallback>
                          {member.userProfile.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{member.userProfile.name}</h4>
                          <Badge className={getRoleColor(member.role)}>
                            {getRoleIcon(member.role)}
                            <span className="ml-1 capitalize">{member.role}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{member.userProfile.email}</p>
                        <p className="text-xs text-gray-500">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Message
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="space-y-4">
          {contentId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add Comment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Comment Type
                    </label>
                    <Select
                      value={commentType}
                      onValueChange={(value) => setCommentType(value as any)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="seo">SEO</SelectItem>
                        <SelectItem value="style">Style</SelectItem>
                        <SelectItem value="fact_check">Fact Check</SelectItem>
                        <SelectItem value="approval">Approval</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Textarea
                  placeholder="Share your thoughts or feedback..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Cancel</Button>
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Post Comment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.userProfile.avatar} />
                      <AvatarFallback>
                        {comment.userProfile.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{comment.userProfile.name}</span>
                          <Badge className={getCommentTypeColor(comment.commentType)}>
                            {comment.commentType}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm">
                            <Reply className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{comment.commentText}</p>
                      
                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start space-x-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={reply.userProfile.avatar} />
                                <AvatarFallback className="text-xs">
                                  {reply.userProfile.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-xs font-medium">{reply.userProfile.name}</span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(reply.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-700">{reply.commentText}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-4">
          {contentId && (
            <div className="flex justify-end">
              <Button onClick={handleSubmitForApproval}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit for Approval
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {pendingApprovals.map((approval) => (
              <Card key={approval.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={approval.userProfile.avatar} />
                        <AvatarFallback>
                          {approval.userProfile.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium">{approval.userProfile.name}</span>
                          <Badge className={getApprovalStatusColor(approval.status)}>
                            {approval.status}
                          </Badge>
                          <Badge variant="outline">
                            {approval.approvalLevel}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Submitted {new Date(approval.createdAt).toLocaleDateString()}
                        </p>
                        {approval.notes && (
                          <p className="text-sm text-gray-700 mt-2">{approval.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => updateApprovalStatus({
                          approvalId: approval.id,
                          userId,
                          status: 'approved'
                        })}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateApprovalStatus({
                          approvalId: approval.id,
                          userId,
                          status: 'changes_requested'
                        })}
                      >
                        Request Changes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {pendingApprovals.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending approvals</h3>
                  <p className="text-sm text-gray-600 text-center">
                    All caught up! No items waiting for your approval.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
