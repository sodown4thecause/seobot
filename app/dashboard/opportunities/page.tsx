'use client'

import { useState } from 'react'
import { TrendingUp, Search, Filter, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const MOCK_OPPORTUNITIES = [
  {
    id: '1',
    keyword: 'sustainable activewear brands',
    volume: 2400,
    difficulty: 'Medium',
    currentRanking: 11,
    intent: 'Commercial',
    priority: 'high',
    trend: 'up',
    potentialTraffic: 850,
  },
  {
    id: '2',
    keyword: 'organic cotton vs recycled polyester',
    volume: 1800,
    difficulty: 'Low',
    currentRanking: null,
    intent: 'Informational',
    priority: 'high',
    trend: 'up',
    potentialTraffic: 720,
  },
  {
    id: '3',
    keyword: 'ethical fashion guide 2025',
    volume: 3200,
    difficulty: 'Medium',
    currentRanking: 24,
    intent: 'Informational',
    priority: 'high',
    trend: 'up',
    potentialTraffic: 960,
  },
  {
    id: '4',
    keyword: 'vegan leather alternatives',
    volume: 4200,
    difficulty: 'Medium',
    currentRanking: 15,
    intent: 'Commercial',
    priority: 'high',
    trend: 'up',
    potentialTraffic: 1200,
  },
  {
    id: '5',
    keyword: 'sustainable fashion statistics',
    volume: 3800,
    difficulty: 'Low',
    currentRanking: null,
    intent: 'Informational',
    priority: 'medium',
    trend: 'stable',
    potentialTraffic: 950,
  },
  {
    id: '6',
    keyword: 'circular fashion brands',
    volume: 2100,
    difficulty: 'Medium',
    currentRanking: null,
    intent: 'Commercial',
    priority: 'medium',
    trend: 'up',
    potentialTraffic: 630,
  },
]

export default function OpportunitiesPage() {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredOpportunities = MOCK_OPPORTUNITIES.filter(opp => {
    const matchesFilter = filter === 'all' || opp.priority === filter
    const matchesSearch = opp.keyword.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Keyword Opportunities</h2>
        <p className="text-muted-foreground">847 opportunities found based on your competitors and goals</p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords..."
            className="pl-10"
          />
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'high' ? 'default' : 'outline'}
            onClick={() => setFilter('high')}
          >
            High Priority
          </Button>
          <Button
            variant={filter === 'medium' ? 'default' : 'outline'}
            onClick={() => setFilter('medium')}
          >
            Medium Priority
          </Button>
        </div>
      </div>

      {/* Opportunities Grid */}
      <div className="grid gap-4">
        {filteredOpportunities.map((opp) => (
          <Card key={opp.id} className="hover:border-primary/50 transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      "{opp.keyword}"
                    </h3>
                    <Badge variant={opp.priority === 'high' ? 'destructive' : 'secondary'}>
                      {opp.priority === 'high' ? 'High Priority' : 'Medium Priority'}
                    </Badge>
                    {opp.trend === 'up' && (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">{opp.volume.toLocaleString()}</span>
                      <span>/mo volume</span>
                    </div>
                    <span>•</span>
                    <div>
                      <span className="font-medium text-foreground">{opp.difficulty}</span>
                      <span> difficulty</span>
                    </div>
                    <span>•</span>
                    <div>
                      <span className="font-medium text-foreground">
                        {opp.currentRanking ? `#${opp.currentRanking}` : 'Not ranking'}
                      </span>
                      <span> current</span>
                    </div>
                    <span>•</span>
                    <div>
                      <span className="font-medium text-foreground">{opp.potentialTraffic}</span>
                      <span> potential visits/mo</span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/dashboard/content/create?keyword=${encodeURIComponent(opp.keyword)}`}
                  className="ml-4"
                >
                  <Button className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Write Content</span>
                  </Button>
                </Link>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <Badge variant={opp.intent === 'Commercial' ? 'default' : 'secondary'}>
                  {opp.intent}
                </Badge>
                <span className="text-muted-foreground">
                  • Est. time to rank: 2-4 weeks
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOpportunities.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No opportunities found matching your filters.</p>
        </div>
      )}
    </div>
  )
}
