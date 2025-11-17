'use client'

/**
 * AEO Metrics Dashboard
 * 
 * Visualizes Answer Engine Optimization metrics including:
 * - Citation opportunities score
 * - EEAT signals strength
 * - Platform-specific performance (ChatGPT, Perplexity, Claude, Gemini)
 * - Visibility trends over time
 */

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Award, 
  TrendingUp, 
  Target, 
  Eye, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  Sparkles,
  Brain,
  Zap
} from 'lucide-react'

interface EEATScore {
  experience: number
  expertise: number
  authoritativeness: number
  trustworthiness: number
  overall: number
}

interface CitationMetrics {
  score: number // 0-100
  opportunities: number
  currentCitations: number
  potentialCitations: number
  topSources: string[]
}

interface PlatformPerformance {
  platform: 'chatgpt' | 'perplexity' | 'claude' | 'gemini'
  visibilityScore: number // 0-100
  citationRate: number // 0-100
  recommendations: number
  lastChecked: number
}

interface AEOMetricsDashboardProps {
  url?: string
  content?: string
  autoRefresh?: boolean
}

export function AEOMetricsDashboard({ url, content, autoRefresh = false }: AEOMetricsDashboardProps) {
  const [eeatScore, setEEATScore] = React.useState<EEATScore | null>(null)
  const [citationMetrics, setCitationMetrics] = React.useState<CitationMetrics | null>(null)
  const [platformPerformance, setPlatformPerformance] = React.useState<PlatformPerformance[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selectedPlatform, setSelectedPlatform] = React.useState<string>('all')

  // Mock data for demonstration (replace with actual API calls)
  React.useEffect(() => {
    // Simulate loading data
    setEEATScore({
      experience: 72,
      expertise: 85,
      authoritativeness: 68,
      trustworthiness: 91,
      overall: 79,
    })

    setCitationMetrics({
      score: 65,
      opportunities: 12,
      currentCitations: 3,
      potentialCitations: 15,
      topSources: ['Wikipedia', 'Industry Reports', 'Academic Papers'],
    })

    setPlatformPerformance([
      {
        platform: 'chatgpt',
        visibilityScore: 72,
        citationRate: 45,
        recommendations: 8,
        lastChecked: Date.now(),
      },
      {
        platform: 'perplexity',
        visibilityScore: 88,
        citationRate: 67,
        recommendations: 3,
        lastChecked: Date.now(),
      },
      {
        platform: 'claude',
        visibilityScore: 61,
        citationRate: 38,
        recommendations: 12,
        lastChecked: Date.now(),
      },
      {
        platform: 'gemini',
        visibilityScore: 54,
        citationRate: 29,
        recommendations: 15,
        lastChecked: Date.now(),
      },
    ])
  }, [url, content])

  if (!eeatScore || !citationMetrics) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading AEO metrics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="EEAT Score"
          value={`${eeatScore.overall}/100`}
          description={getScoreLabel(eeatScore.overall)}
          icon={Award}
          progress={eeatScore.overall}
          variant={eeatScore.overall >= 80 ? 'success' : eeatScore.overall >= 60 ? 'warning' : 'danger'}
        />
        <MetricCard
          title="Citation Opportunities"
          value={citationMetrics.opportunities.toString()}
          description={`${citationMetrics.currentCitations} current citations`}
          icon={Target}
          progress={null}
          variant="info"
        />
        <MetricCard
          title="Avg Visibility"
          value={`${Math.round(platformPerformance.reduce((acc, p) => acc + p.visibilityScore, 0) / platformPerformance.length)}/100`}
          description="Across all platforms"
          icon={Eye}
          progress={platformPerformance.reduce((acc, p) => acc + p.visibilityScore, 0) / platformPerformance.length}
          variant="info"
        />
        <MetricCard
          title="Total Recommendations"
          value={platformPerformance.reduce((acc, p) => acc + p.recommendations, 0).toString()}
          description="Action items to improve"
          icon={Sparkles}
          progress={null}
          variant="warning"
        />
      </div>

      {/* EEAT Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            EEAT Signals Breakdown
          </CardTitle>
          <CardDescription>
            Experience, Expertise, Authoritativeness, Trustworthiness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <EEATBar label="Experience" score={eeatScore.experience} />
            <EEATBar label="Expertise" score={eeatScore.expertise} />
            <EEATBar label="Authoritativeness" score={eeatScore.authoritativeness} />
            <EEATBar label="Trustworthiness" score={eeatScore.trustworthiness} />
          </div>
        </CardContent>
      </Card>

      {/* Platform Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Platform Performance
          </CardTitle>
          <CardDescription>
            Visibility and citation rates across different AI platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="chatgpt">ChatGPT</TabsTrigger>
              <TabsTrigger value="perplexity">Perplexity</TabsTrigger>
              <TabsTrigger value="claude">Claude</TabsTrigger>
              <TabsTrigger value="gemini">Gemini</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-4 mt-4">
              {platformPerformance.map((platform) => (
                <PlatformCard key={platform.platform} platform={platform} />
              ))}
            </TabsContent>
            {platformPerformance.map((platform) => (
              <TabsContent key={platform.platform} value={platform.platform} className="mt-4">
                <PlatformCard platform={platform} detailed />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Citation Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Citation Opportunities
          </CardTitle>
          <CardDescription>
            Improve your content's citation-worthiness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Citation Score</span>
              <Badge variant={citationMetrics.score >= 70 ? 'default' : 'secondary'}>
                {citationMetrics.score}/100
              </Badge>
            </div>
            <Progress value={citationMetrics.score} className="h-2" />
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{citationMetrics.currentCitations}</div>
                <div className="text-xs text-muted-foreground">Current</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{citationMetrics.opportunities}</div>
                <div className="text-xs text-muted-foreground">Opportunities</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{citationMetrics.potentialCitations}</div>
                <div className="text-xs text-muted-foreground">Potential</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper Components

interface MetricCardProps {
  title: string
  value: string
  description: string
  icon: React.ElementType
  progress: number | null
  variant: 'success' | 'warning' | 'danger' | 'info'
}

function MetricCard({ title, value, description, icon: Icon, progress, variant }: MetricCardProps) {
  const variantColors = {
    success: 'text-purple-400',
    warning: 'text-blue-400',
    danger: 'text-red-400',
    info: 'text-primary',
  }

  const progressColors = {
    success: 'bg-purple-500',
    warning: 'bg-blue-400',
    danger: 'bg-red-500',
    info: 'bg-primary',
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${variantColors[variant]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {progress !== null && (
          <Progress value={progress} className="h-1.5 mt-3" indicatorClassName={progressColors[variant]} />
        )}
      </CardContent>
    </Card>
  )
}

interface EEATBarProps {
  label: string
  score: number
}

function EEATBar({ label, score }: EEATBarProps) {
  const getColor = (score: number) => {
    if (score >= 80) return 'bg-purple-500'
    if (score >= 60) return 'bg-blue-400'
    return 'bg-red-400'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant="outline">{score}/100</Badge>
      </div>
      <Progress value={score} className="h-2" indicatorClassName={getColor(score)} />
    </div>
  )
}

interface PlatformCardProps {
  platform: PlatformPerformance
  detailed?: boolean
}

function PlatformCard({ platform, detailed = false }: PlatformCardProps) {
  const platformIcons = {
    chatgpt: MessageSquare,
    perplexity: Zap,
    claude: Brain,
    gemini: Sparkles,
  }

  const Icon = platformIcons[platform.platform]
  const platformName = platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          <span className="font-semibold">{platformName}</span>
        </div>
        {platform.recommendations > 0 && (
          <Badge variant="secondary">
            {platform.recommendations} recommendations
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Visibility Score</div>
          <div className="flex items-center gap-2">
            <Progress value={platform.visibilityScore} className="h-2 flex-1" />
            <span className="text-sm font-medium">{platform.visibilityScore}%</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Citation Rate</div>
          <div className="flex items-center gap-2">
            <Progress value={platform.citationRate} className="h-2 flex-1" />
            <span className="text-sm font-medium">{platform.citationRate}%</span>
          </div>
        </div>
      </div>

      {detailed && (
        <div className="pt-3 border-t">
          <p className="text-sm text-muted-foreground">
            Last checked: {new Date(platform.lastChecked).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  )
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 80) return 'Very Good'
  if (score >= 70) return 'Good'
  if (score >= 60) return 'Fair'
  return 'Needs Improvement'
}

