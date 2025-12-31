'use client'

/**
 * Link Building Dashboard
 * Kanban-style interface for managing link building campaigns
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Link2,
  Mail,
  Search,
  Filter,
  Plus,
  MoreVertical,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  Send,
  Reply,
  Ban,
  Trophy
} from 'lucide-react'
import type { LinkProspect, LinkCampaign, ProspectStatus } from '@/lib/link-building/types'

interface LinkBuildingDashboardProps {
  campaigns?: LinkCampaign[]
  onCreateCampaign?: () => void
  onProspectStatusChange?: (prospectId: string, newStatus: ProspectStatus) => void
}

const COLUMN_CONFIG = {
  discovered: {
    label: 'Discovered',
    icon: Search,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20'
  },
  qualified: {
    label: 'Qualified',
    icon: CheckCircle2,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20'
  },
  outreach_sent: {
    label: 'Outreach Sent',
    icon: Send,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20'
  },
  follow_up: {
    label: 'Follow-up',
    icon: Reply,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20'
  },
  won: {
    label: 'Won',
    icon: Trophy,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20'
  },
  lost: {
    label: 'Lost',
    icon: Ban,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20'
  }
} as const

type ColumnStatus = keyof typeof COLUMN_CONFIG

export function LinkBuildingDashboard({ 
  campaigns = [], 
  onCreateCampaign,
  onProspectStatusChange 
}: LinkBuildingDashboardProps) {
  const [activeCampaign, setActiveCampaign] = useState<LinkCampaign | null>(
    campaigns.length > 0 ? campaigns[0] : null
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDomain, setFilterDomain] = useState<string>('all')

  useEffect(() => {
    if (campaigns.length > 0 && !activeCampaign) {
      setActiveCampaign(campaigns[0])
    }
  }, [campaigns, activeCampaign])

  // Group prospects by status
  const prospectsByStatus = React.useMemo((): Partial<Record<ProspectStatus, LinkProspect[]>> => {
    if (!activeCampaign) return {}

    const filtered = activeCampaign.prospects.filter(prospect => {
      const matchesSearch = searchQuery === '' || 
        prospect.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prospect.url.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesDomain = filterDomain === 'all' || prospect.domain === filterDomain

      return matchesSearch && matchesDomain
    })

    return filtered.reduce((acc, prospect) => {
      const status = prospect.status
      if (!acc[status]) {
        acc[status] = []
      }
      acc[status]!.push(prospect)
      return acc
    }, {} as Partial<Record<ProspectStatus, LinkProspect[]>>)
  }, [activeCampaign, searchQuery, filterDomain])

  // Get unique domains for filter
  const uniqueDomains = React.useMemo(() => {
    if (!activeCampaign) return []
    const domains = new Set(activeCampaign.prospects.map(p => p.domain))
    return Array.from(domains)
  }, [activeCampaign])

  const handleStatusChange = (prospectId: string, newStatus: ProspectStatus) => {
    onProspectStatusChange?.(prospectId, newStatus)
  }

  const getProspectQualityBadge = (score: number) => {
    if (score >= 80) {
      return <Badge variant="default" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">High Quality</Badge>
    }
    if (score >= 60) {
      return <Badge variant="default" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Medium Quality</Badge>
    }
    return <Badge variant="default" className="bg-red-500/20 text-red-300 border-red-500/30">Low Quality</Badge>
  }

  if (campaigns.length === 0) {
    return (
      <Card className="glass-card border-none bg-black/40">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Link2 className="w-16 h-16 text-zinc-600 mb-4" />
          <h3 className="text-xl font-semibold text-zinc-300 mb-2">No Link Building Campaigns</h3>
          <p className="text-zinc-500 mb-6 text-center max-w-md">
            Start your first link building campaign to discover prospects, send outreach emails, and track your progress.
          </p>
          <Button onClick={onCreateCampaign} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Campaign Selector and Metrics */}
      <Card className="glass-card border-none bg-black/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-zinc-100 text-2xl">Link Building Dashboard</CardTitle>
              <CardDescription className="text-zinc-400">
                Manage prospects and track outreach campaigns
              </CardDescription>
            </div>
            <Button onClick={onCreateCampaign}>
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Campaign Tabs */}
          <Tabs 
            value={activeCampaign?.id} 
            onValueChange={(id) => setActiveCampaign(campaigns.find(c => c.id === id) || null)}
            className="mb-6"
          >
            <TabsList className="bg-black/40 border border-white/5">
              {campaigns.map(campaign => (
                <TabsTrigger 
                  key={campaign.id} 
                  value={campaign.id}
                  className="data-[state=active]:bg-white/10"
                >
                  {campaign.name}
                  <Badge variant="outline" className="ml-2 border-white/10">
                    {campaign.prospects.length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Campaign Metrics */}
          {activeCampaign && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-black/20 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-zinc-400 text-sm">Total Prospects</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-zinc-100">
                  {activeCampaign.metrics.totalProspects}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-black/20 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-zinc-400 text-sm">Outreach Sent</span>
                  <Mail className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-zinc-100">
                  {activeCampaign.metrics.outreachSent}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-black/20 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-zinc-400 text-sm">Response Rate</span>
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-zinc-100">
                  {activeCampaign.metrics.responseRate.toFixed(1)}%
                </div>
              </div>

              <div className="p-4 rounded-lg bg-black/20 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-zinc-400 text-sm">Links Earned</span>
                  <Trophy className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-zinc-100">
                  {activeCampaign.metrics.linksEarned}
                </div>
              </div>
            </div>
          )}

          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search prospects by domain or URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-black/20 border-white/10 text-zinc-100"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-white/10">
                  <Filter className="w-4 h-4 mr-2" />
                  {filterDomain === 'all' ? 'All Domains' : filterDomain}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-zinc-900 border-white/10">
                <DropdownMenuItem 
                  onClick={() => setFilterDomain('all')}
                  className="text-zinc-300"
                >
                  All Domains
                </DropdownMenuItem>
                {uniqueDomains.map(domain => (
                  <DropdownMenuItem 
                    key={domain}
                    onClick={() => setFilterDomain(domain)}
                    className="text-zinc-300"
                  >
                    {domain}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {(Object.keys(COLUMN_CONFIG) as ColumnStatus[]).map(status => {
          const config = COLUMN_CONFIG[status]
          const prospects = prospectsByStatus[status] || []
          const Icon = config.icon

          return (
            <Card 
              key={status} 
              className={`glass-card border ${config.borderColor} bg-black/40`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <CardTitle className="text-sm font-medium text-zinc-300">
                      {config.label}
                    </CardTitle>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`${config.bgColor} ${config.color} border-white/10`}
                  >
                    {prospects.length}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {prospects.length === 0 ? (
                  <div className="text-center py-8 text-zinc-600 text-sm">
                    No prospects
                  </div>
                ) : (
                  prospects.map(prospect => (
                    <ProspectCard
                      key={prospect.id}
                      prospect={prospect}
                      onStatusChange={handleStatusChange}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// Prospect Card Component
interface ProspectCardProps {
  prospect: LinkProspect
  onStatusChange: (prospectId: string, newStatus: ProspectStatus) => void
}

function ProspectCard({ prospect, onStatusChange }: ProspectCardProps) {
  const getOpportunityIcon = () => {
    switch (prospect.opportunityType) {
      case 'guest_post': return <Mail className="w-3 h-3" />
      case 'broken_link': return <AlertCircle className="w-3 h-3" />
      case 'unlinked_mention': return <Link2 className="w-3 h-3" />
      default: return <Link2 className="w-3 h-3" />
    }
  }

  return (
    <div className="p-3 rounded-lg bg-black/20 border border-white/5 hover:bg-white/5 transition-colors group">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getOpportunityIcon()}
            <span className="text-xs text-zinc-400 truncate">{prospect.domain}</span>
          </div>
          <h4 className="text-sm font-medium text-zinc-200 truncate">
            {prospect.title || prospect.url}
          </h4>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
            >
              <MoreVertical className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-zinc-900 border-white/10">
            <DropdownMenuItem className="text-zinc-300">
              <ExternalLink className="w-3 h-3 mr-2" />
              View Prospect
            </DropdownMenuItem>
            <DropdownMenuItem className="text-zinc-300">
              <Mail className="w-3 h-3 mr-2" />
              Send Outreach
            </DropdownMenuItem>
            <DropdownMenuItem className="text-zinc-300">
              <CheckCircle2 className="w-3 h-3 mr-2" />
              Mark as Won
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="text-xs border-white/10 text-zinc-400">
          DA {prospect.domainAuthority}
        </Badge>
        <Badge variant="outline" className="text-xs border-white/10 text-zinc-400">
          Score {prospect.score}
        </Badge>
      </div>

      <p className="text-xs text-zinc-500 line-clamp-2 mb-2">
        {prospect.reason}
      </p>

      {prospect.contactEmail && (
        <div className="text-xs text-zinc-600 flex items-center gap-1">
          <Mail className="w-3 h-3" />
          {prospect.contactEmail}
        </div>
      )}
    </div>
  )
}
