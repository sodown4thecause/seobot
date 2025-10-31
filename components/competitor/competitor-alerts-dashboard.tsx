'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Globe,
  MessageSquare,
  DollarSign,
  Link,
  Star,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Mail,
  MessageSquare as SlackIcon,
  Webhook,
  Smartphone,
  RefreshCw,
  BarChart3,
  Target,
  Zap,
  Settings,
  Filter,
  Search,
  Calendar,
  ExternalLink,
  Copy,
  Download,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
  createCompetitorAlert,
  getCompetitorAlerts,
  getAlertEvents,
  monitorCompetitors,
  sendAlertNotifications,
  generateCompetitorInsights,
  updateAlertEventStatus,
  deleteCompetitorAlert,
  CompetitorAlert,
  CompetitorAlertEvent
} from '@/lib/competitor/competitor-alerts-service'

interface CompetitorAlertsDashboardProps {
  userId: string
}

export function CompetitorAlertsDashboard({ userId }: CompetitorAlertsDashboardProps) {
  const [activeTab, setActiveTab] = useState('alerts')
  const [alerts, setAlerts] = useState<CompetitorAlert[]>([])
  const [selectedAlert, setSelectedAlert] = useState<CompetitorAlert | null>(null)
  const [alertEvents, setAlertEvents] = useState<CompetitorAlertEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [insights, setInsights] = useState<any>(null)

  // Form state
  const [alertName, setAlertName] = useState('')
  const [competitorDomains, setCompetitorDomains] = useState('')
  const [targetKeywords, setTargetKeywords] = useState('')
  const [alertTypes, setAlertTypes] = useState<string[]>([])
  const [alertFrequency, setAlertFrequency] = useState<'real_time' | 'hourly' | 'daily' | 'weekly'>('daily')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [slackNotifications, setSlackNotifications] = useState(false)
  const [webhookNotifications, setWebhookNotifications] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    loadAlerts()
  }, [userId])

  const loadAlerts = async () => {
    try {
      const alertsData = await getCompetitorAlerts(userId)
      setAlerts(alertsData)
    } catch (error) {
      console.error('Failed to load alerts:', error)
    }
  }

  const handleCreateAlert = async () => {
    if (!alertName.trim() || !competitorDomains.trim()) {
      toast({
        title: "Missing required information",
        description: "Please provide alert name and competitor domains.",
        variant: "destructive"
      })
      return
    }

    setIsCreating(true)
    try {
      const domains = competitorDomains.split(',').map(d => d.trim()).filter(d => d)
      const keywords = targetKeywords.split(',').map(k => k.trim()).filter(k => k)

      const notificationChannels = [
        {
          type: 'email' as const,
          config: { email: 'user@example.com' }, // Would get from user profile
          enabled: emailNotifications
        },
        {
          type: 'slack' as const,
          config: { slackChannel: '#seo-alerts' },
          enabled: slackNotifications
        },
        {
          type: 'webhook' as const,
          config: { webhookUrl: 'https://example.com/webhook' },
          enabled: webhookNotifications
        }
      ]

      const alert = await createCompetitorAlert({
        userId,
        alertName,
        competitorDomains: domains,
        targetKeywords: keywords,
        alertTypes: alertTypes as any[],
        notificationChannels,
        alertFrequency,
        alertConditions: []
      })

      setAlerts([alert, ...alerts])
      setIsCreating(false)
      setAlertName('')
      setCompetitorDomains('')
      setTargetKeywords('')
      setAlertTypes([])
      
      toast({
        title: "Alert created successfully",
        description: "Your competitor alert is now active.",
      })
    } catch (error) {
      console.error('Failed to create alert:', error)
      toast({
        title: "Failed to create alert",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleSelectAlert = async (alert: CompetitorAlert) => {
    setSelectedAlert(alert)
    try {
      const events = await getAlertEvents(alert.id)
      setAlertEvents(events)
    } catch (error) {
      console.error('Failed to load alert events:', error)
    }
  }

  const handleMonitorNow = async () => {
    setIsLoading(true)
    try {
      const result = await monitorCompetitors(userId)
      
      toast({
        title: "Monitoring complete",
        description: `Processed ${result.alertsProcessed} alerts and generated ${result.eventsGenerated.length} events.`,
      })

      // Send notifications for new events
      if (result.eventsGenerated.length > 0) {
        const notificationResult = await sendAlertNotifications(result.eventsGenerated)
        toast({
          title: "Notifications sent",
          description: `${notificationResult.sent} notifications sent successfully.`,
        })
      }

      // Reload data
      await loadAlerts()
      if (selectedAlert) {
        await handleSelectAlert(selectedAlert)
      }
    } catch (error) {
      console.error('Failed to monitor competitors:', error)
      toast({
        title: "Monitoring failed",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateInsights = async () => {
    if (!selectedAlert) return

    try {
      const insightsData = await generateCompetitorInsights({
        competitorDomain: selectedAlert.competitorDomains[0],
        targetKeywords: selectedAlert.targetKeywords,
        timeRange: '30d'
      })

      setInsights(insightsData)
      setActiveTab('insights')
      
      toast({
        title: "Insights generated",
        description: "AI-powered competitor insights are ready.",
      })
    } catch (error) {
      console.error('Failed to generate insights:', error)
      toast({
        title: "Insights generation failed",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  }

  const handleUpdateEventStatus = async (eventId: string, status: 'new' | 'acknowledged' | 'resolved') => {
    try {
      await updateAlertEventStatus(eventId, status)
      
      // Update local state
      setAlertEvents(events.map(event => 
        event.id === eventId ? { ...event, status } : event
      ))

      toast({
        title: "Event updated",
        description: `Event marked as ${status}.`,
      })
    } catch (error) {
      console.error('Failed to update event status:', error)
      toast({
        title: "Update failed",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await deleteCompetitorAlert(alertId, userId)
      setAlerts(alerts.filter(alert => alert.id !== alertId))
      
      if (selectedAlert?.id === alertId) {
        setSelectedAlert(null)
        setAlertEvents([])
      }

      toast({
        title: "Alert deleted",
        description: "The competitor alert has been removed.",
      })
    } catch (error) {
      console.error('Failed to delete alert:', error)
      toast({
        title: "Delete failed",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'critical': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'new_content_published': return <FileText className="w-4 h-4" />
      case 'ranking_improved': return <TrendingUp className="w-4 h-4" />
      case 'ranking_dropped': return <TrendingDown className="w-4 h-4" />
      case 'new_backlink_acquired': return <Link className="w-4 h-4" />
      case 'price_decreased': return <DollarSign className="w-4 h-4" />
      case 'social_post_published': return <MessageSquare className="w-4 h-4" />
      default: return <Bell className="w-4 h-4" />
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />
      case 'slack': return <SlackIcon className="w-4 h-4" />
      case 'webhook': return <Webhook className="w-4 h-4" />
      case 'push': return <Smartphone className="w-4 h-4" />
      default: return <Bell className="w-4 h-4" />
    }
  }

  const alertTypeOptions = [
    { value: 'new_content', label: 'New Content' },
    { value: 'ranking_changes', label: 'Ranking Changes' },
    { value: 'backlinks', label: 'Backlinks' },
    { value: 'price_changes', label: 'Price Changes' },
    { value: 'traffic_changes', label: 'Traffic Changes' },
    { value: 'social_media_activity', label: 'Social Media' },
    { value: 'ad_campaigns', label: 'Ad Campaigns' },
    { value: 'technical_changes', label: 'Technical Changes' }
  ]

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Bell className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Competitor Alerts</h3>
            <p className="text-sm text-gray-600">Real-time monitoring and notifications</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {alerts.filter(a => a.isActive).length} active
          </Badge>
          <Button variant="outline" size="sm" onClick={handleMonitorNow} disabled={isLoading}>
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Monitor Now
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-3 gap-6">
            {/* Create Alert Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Create New Alert</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="alertName">Alert Name</Label>
                  <Input
                    id="alertName"
                    placeholder="Main Competitors Monitor"
                    value={alertName}
                    onChange={(e) => setAlertName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="competitorDomains">Competitor Domains</Label>
                  <Textarea
                    id="competitorDomains"
                    placeholder="competitor1.com, competitor2.com"
                    value={competitorDomains}
                    onChange={(e) => setCompetitorDomains(e.target.value)}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="targetKeywords">Target Keywords</Label>
                  <Input
                    id="targetKeywords"
                    placeholder="SEO, marketing, digital strategy"
                    value={targetKeywords}
                    onChange={(e) => setTargetKeywords(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Alert Types</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {alertTypeOptions.slice(0, 6).map((option) => (
                      <label key={option.value} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={alertTypes.includes(option.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAlertTypes([...alertTypes, option.value])
                            } else {
                              setAlertTypes(alertTypes.filter(t => t !== option.value))
                            }
                          }}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="alertFrequency">Frequency</Label>
                  <Select value={alertFrequency} onValueChange={(value) => setAlertFrequency(value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="real_time">Real Time</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Notification Channels</Label>
                  <div className="space-y-2 mt-2">
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                      />
                      <Mail className="w-3 h-3" />
                      <span>Email</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={slackNotifications}
                        onChange={(e) => setSlackNotifications(e.target.checked)}
                      />
                      <SlackIcon className="w-3 h-3" />
                      <span>Slack</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={webhookNotifications}
                        onChange={(e) => setWebhookNotifications(e.target.checked)}
                      />
                      <Webhook className="w-3 h-3" />
                      <span>Webhook</span>
                    </label>
                  </div>
                </div>

                <Button onClick={handleCreateAlert} disabled={isCreating} className="w-full">
                  {isCreating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Create Alert
                </Button>
              </CardContent>
            </Card>

            {/* Alerts List */}
            <div className="col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Active Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alerts.length === 0 ? (
                      <div className="text-center py-8">
                        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No alerts configured yet</p>
                        <p className="text-sm text-gray-500 mt-1">Create your first alert to start monitoring competitors</p>
                      </div>
                    ) : (
                      alerts.map((alert) => (
                        <div 
                          key={alert.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedAlert?.id === alert.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleSelectAlert(alert)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">{alert.alertName}</h4>
                              <p className="text-sm text-gray-600">
                                {alert.competitorDomains.length} competitors • {alert.targetKeywords.length} keywords
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={alert.isActive ? 'default' : 'secondary'}>
                                {alert.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              <Badge variant="outline">{alert.alertFrequency}</Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>{alert.alertTypes.length} alert types</span>
                              <span>{alert.notificationChannels.filter(c => c.enabled).length} notifications</span>
                              {alert.lastTriggered && (
                                <span>Last: {new Date(alert.lastTriggered).toLocaleDateString()}</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleGenerateInsights()
                                }}
                              >
                                <BarChart3 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteAlert(alert.id)
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-1">
                            {alert.competitorDomains.slice(0, 3).map((domain, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {domain}
                              </Badge>
                            ))}
                            {alert.competitorDomains.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{alert.competitorDomains.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          {selectedAlert ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Events for {selectedAlert.alertName}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {alertEvents.filter(e => e.status === 'new').length} new
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => handleSelectAlert(selectedAlert)}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alertEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No events detected yet</p>
                      <p className="text-sm text-gray-500 mt-1">Events will appear here when competitor activity is detected</p>
                    </div>
                  ) : (
                    alertEvents.map((event) => (
                      <div key={event.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              {getEventIcon(event.eventType)}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 capitalize">
                                {event.eventType.replace(/_/g, ' ')}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {event.competitorDomain} • {new Date(event.detectedAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getSeverityColor(event.severity)}>
                              {event.severity}
                            </Badge>
                            <Badge variant={event.status === 'new' ? 'default' : 'secondary'}>
                              {event.status}
                            </Badge>
                          </div>
                        </div>

                        {event.eventData.title && (
                          <p className="text-sm text-gray-700 mb-2">{event.eventData.title}</p>
                        )}
                        
                        {event.eventData.description && (
                          <p className="text-sm text-gray-600 mb-2">{event.eventData.description}</p>
                        )}

                        {event.eventData.url && (
                          <div className="mb-2">
                            <Button variant="outline" size="sm" asChild>
                              <a href={event.eventData.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3 h-3 mr-1" />
                                View Content
                              </a>
                            </Button>
                          </div>
                        )}

                        {event.eventData.changeAmount && (
                          <div className="text-sm text-gray-600 mb-2">
                            Change: {event.eventData.changeAmount > 0 ? '+' : ''}{event.eventData.changeAmount}
                            {event.eventData.changePercentage && ` (${event.eventData.changePercentage}%)`}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            {event.notificationSent && (
                              <span>Notification sent</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {event.status === 'new' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateEventStatus(event.id, 'acknowledged')}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Acknowledge
                              </Button>
                            )}
                            {event.status === 'acknowledged' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateEventStatus(event.id, 'resolved')}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Resolve
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select an alert to view events</h3>
                <p className="text-sm text-gray-600 text-center">
                  Choose an alert from the list to see detected competitor activity
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {selectedAlert ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Competitor Insights</h3>
                <Button onClick={handleGenerateInsights}>
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Insights
                </Button>
              </div>

              {insights ? (
                <div className="grid grid-cols-2 gap-6">
                  {/* Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 leading-relaxed">{insights.summary}</p>
                    </CardContent>
                  </Card>

                  {/* Key Changes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Key Changes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {insights.keyChanges.map((change: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2 text-sm">
                            <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5" />
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {insights.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2 text-sm">
                            <Target className="w-4 h-4 text-green-500 mt-0.5" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Threats & Opportunities */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base text-red-700">Potential Threats</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {insights.threats.map((threat: string, index: number) => (
                            <li key={index} className="flex items-start space-x-2 text-sm">
                              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                              <span>{threat}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base text-green-700">Opportunities</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {insights.opportunities.map((opp: string, index: number) => (
                            <li key={index} className="flex items-start space-x-2 text-sm">
                              <Star className="w-4 h-4 text-green-500 mt-0.5" />
                              <span>{opp}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No insights available yet</h3>
                    <p className="text-sm text-gray-600 text-center mb-4">
                      Generate AI-powered insights to understand competitor behavior
                    </p>
                    <Button onClick={handleGenerateInsights}>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate Insights
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select an alert to generate insights</h3>
                <p className="text-sm text-gray-600 text-center">
                  Choose an alert to analyze competitor patterns and get strategic recommendations
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Email Notifications</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">New content alerts</span>
                      </div>
                      <input type="checkbox" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Ranking changes</span>
                      </div>
                      <input type="checkbox" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Price changes</span>
                      </div>
                      <input type="checkbox" />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Slack Integration</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <SlackIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">#seo-alerts channel</span>
                      </div>
                      <input type="checkbox" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Hash className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">#competitor-watch</span>
                      </div>
                      <input type="checkbox" />
                    </div>
                    <Button variant="outline" className="w-full mt-2">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure Slack
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Monitoring Settings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Default monitoring frequency</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="real_time">Real Time</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Event retention period</Label>
                    <Select defaultValue="30">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
