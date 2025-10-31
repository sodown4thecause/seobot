'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Palette,
  Mail,
  Globe,
  Settings,
  Users,
  TrendingUp,
  DollarSign,
  FileText,
  Eye,
  Edit,
  Save,
  Plus,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Shield,
  Zap,
  BarChart3,
  Crown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  upsertWhiteLabelSettings,
  getWhiteLabelSettings,
  createClientPortal,
  getClientPortals,
  generateWhiteLabelCSS,
  generateEmailTemplate,
  validateCustomDomain,
  getWhiteLabelAnalytics,
  WhiteLabelSettings,
  ClientPortal
} from '@/lib/white-label/white-label-service'

interface WhiteLabelDashboardProps {
  userId: string
  teamId?: string
}

export function WhiteLabelDashboard({ userId, teamId }: WhiteLabelDashboardProps) {
  const [settings, setSettings] = useState<WhiteLabelSettings | null>(null)
  const [clientPortals, setClientPortals] = useState<ClientPortal[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('branding')
  const [isSaving, setIsSaving] = useState(false)
  const [isCreatingPortal, setIsCreatingPortal] = useState(false)
  const [portalForm, setPortalForm] = useState({
    clientName: '',
    clientEmail: '',
    subdomain: ''
  })
  const [cssPreview, setCssPreview] = useState('')
  const [domainValidation, setDomainValidation] = useState<any>(null)

  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [userId, teamId])

  const loadData = async () => {
    try {
      const [whiteLabelSettings, portals, analyticsData] = await Promise.all([
        getWhiteLabelSettings(userId, teamId),
        Promise.resolve([]), // getClientPortals would need whiteLabelId
        Promise.resolve(null) // getWhiteLabelAnalytics would need whiteLabelId
      ])

      setSettings(whiteLabelSettings)
      setClientPortals(portals)
      setAnalytics(analyticsData)

      if (whiteLabelSettings) {
        const css = generateWhiteLabelCSS(whiteLabelSettings)
        setCssPreview(css)
      }
    } catch (error) {
      console.error('Failed to load white-label data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!settings) return

    setIsSaving(true)
    try {
      const updatedSettings = await upsertWhiteLabelSettings(userId, settings)
      setSettings(updatedSettings)
      
      const css = generateWhiteLabelCSS(updatedSettings)
      setCssPreview(css)

      toast({
        title: "Settings saved",
        description: "Your white-label settings have been updated.",
      })
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast({
        title: "Failed to save",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreatePortal = async () => {
    if (!settings || !portalForm.clientName || !portalForm.clientEmail || !portalForm.subdomain) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    setIsCreatingPortal(true)
    try {
      const portal = await createClientPortal({
        whiteLabelId: settings.id,
        clientName: portalForm.clientName,
        clientEmail: portalForm.clientEmail,
        subdomain: portalForm.subdomain
      })

      toast({
        title: "Portal created",
        description: `Client portal for ${portal.clientName} has been created.`,
      })

      setPortalForm({ clientName: '', clientEmail: '', subdomain: '' })
      // Reload portals
      const updatedPortals = await getClientPortals(settings.id)
      setClientPortals(updatedPortals)
    } catch (error) {
      console.error('Failed to create portal:', error)
      toast({
        title: "Failed to create portal",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsCreatingPortal(false)
    }
  }

  const handleValidateDomain = async (domain: string) => {
    if (!domain) return

    try {
      const validation = await validateCustomDomain(domain)
      setDomainValidation(validation)
    } catch (error) {
      console.error('Failed to validate domain:', error)
      setDomainValidation({ isValid: false, error: 'Validation failed' })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "The text has been copied to your clipboard.",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Set up your white-label</h3>
          <p className="text-sm text-gray-600 text-center mb-4">
            Configure your branding and start offering the platform under your own brand
          </p>
          <Button onClick={() => {
            setSettings({
              id: 'temp',
              userId,
              companyName: '',
              brandColors: {
                primary: '#3B82F6',
                secondary: '#1E40AF',
                accent: '#F59E0B',
                background: '#FFFFFF',
                text: '#1F2937',
                textSecondary: '#6B7280',
                border: '#E5E7EB',
                success: '#10B981',
                warning: '#F59E0B',
                error: '#EF4444'
              },
              emailSettings: {
                fromName: '',
                fromEmail: '',
                replyToEmail: ''
              },
              featureFlags: {
                hideBranding: false,
                customAnalytics: false,
                customIntegrations: false,
                advancedReporting: false,
                prioritySupport: false,
                customWorkflows: false,
                apiAccess: false,
                whiteLabelReports: false,
                customDomains: false,
                ssoIntegration: false
              },
              subscriptionPlan: 'agency',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Get Started
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
          <div className="p-2 bg-purple-100 rounded-lg">
            <Building2 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">White-Label Settings</h3>
            <p className="text-sm text-gray-600">Customize the platform for your agency</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={settings.subscriptionPlan === 'enterprise' ? 'default' : 'secondary'}>
            <Crown className="w-3 h-3 mr-1" />
            {settings.subscriptionPlan}
          </Badge>
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="portals">Client Portals</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Basic Branding */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Building2 className="w-4 h-4 mr-2" />
                  Basic Branding
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, companyName: e.target.value } : null)}
                    placeholder="Your Company Name"
                  />
                </div>
                <div>
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={settings.logoUrl || ''}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, logoUrl: e.target.value } : null)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div>
                  <Label htmlFor="customDomain">Custom Domain</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="customDomain"
                      value={settings.customDomain || ''}
                      onChange={(e) => {
                        setSettings(prev => prev ? { ...prev, customDomain: e.target.value } : null)
                        handleValidateDomain(e.target.value)
                      }}
                      placeholder="youragency.com"
                    />
                    <Button
                      variant="outline"
                      onClick={() => settings.customDomain && handleValidateDomain(settings.customDomain)}
                    >
                      Validate
                    </Button>
                  </div>
                  {domainValidation && (
                    <div className={`mt-2 text-sm ${domainValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {domainValidation.isValid ? '✓ Domain is valid' : `✗ ${domainValidation.error}`}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Brand Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Palette className="w-4 h-4 mr-2" />
                  Brand Colors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(settings.brandColors).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-3">
                    <Label className="w-24 text-sm capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <div className="flex items-center space-x-2 flex-1">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => setSettings(prev => prev ? {
                          ...prev,
                          brandColors: { ...prev.brandColors, [key]: e.target.value }
                        } : null)}
                        className="w-10 h-10 rounded border border-gray-300"
                      />
                      <Input
                        value={value}
                        onChange={(e) => setSettings(prev => prev ? {
                          ...prev,
                          brandColors: { ...prev.brandColors, [key]: e.target.value }
                        } : null)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Custom CSS */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Custom CSS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={settings.customCss || ''}
                onChange={(e) => setSettings(prev => prev ? { ...prev, customCss: e.target.value } : null)}
                placeholder="Add custom CSS to override default styles..."
                rows={8}
                className="font-mono text-sm"
              />
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(cssPreview)}
                  className="mr-2"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Generated CSS
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const blob = new Blob([cssPreview], { type: 'text/css' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'white-label-styles.css'
                    a.click()
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download CSS
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={settings.emailSettings.fromName}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      emailSettings: { ...prev.emailSettings, fromName: e.target.value }
                    } : null)}
                    placeholder="Your Company Name"
                  />
                </div>
                <div>
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={settings.emailSettings.fromEmail}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      emailSettings: { ...prev.emailSettings, fromEmail: e.target.value }
                    } : null)}
                    placeholder="noreply@yourcompany.com"
                  />
                </div>
                <div>
                  <Label htmlFor="replyToEmail">Reply-To Email</Label>
                  <Input
                    id="replyToEmail"
                    type="email"
                    value={settings.emailSettings.replyToEmail || ''}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      emailSettings: { ...prev.emailSettings, replyToEmail: e.target.value }
                    } : null)}
                    placeholder="support@yourcompany.com"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Email Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      // Generate template logic
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Welcome Email Template
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      // Generate template logic
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Content Ready Template
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      // Generate template logic
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Report Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                Feature Flags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {Object.entries(settings.featureFlags).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                      <p className="text-sm text-gray-600">
                        {getFeatureDescription(key)}
                      </p>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => setSettings(prev => prev ? {
                        ...prev,
                        featureFlags: { ...prev.featureFlags, [key]: checked }
                      } : null)}
                      disabled={!isFeatureAvailable(key, settings.subscriptionPlan)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Portals Tab */}
        <TabsContent value="portals" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Client Portals</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Portal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Client Portal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="clientName">Client Name</Label>
                    <Input
                      id="clientName"
                      value={portalForm.clientName}
                      onChange={(e) => setPortalForm(prev => ({ ...prev, clientName: e.target.value }))}
                      placeholder="Acme Corporation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientEmail">Client Email</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={portalForm.clientEmail}
                      onChange={(e) => setPortalForm(prev => ({ ...prev, clientEmail: e.target.value }))}
                      placeholder="contact@acme.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subdomain">Subdomain</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="subdomain"
                        value={portalForm.subdomain}
                        onChange={(e) => setPortalForm(prev => ({ ...prev, subdomain: e.target.value }))}
                        placeholder="acme"
                      />
                      <span className="text-sm text-gray-600">.yourplatform.com</span>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline">Cancel</Button>
                    <Button
                      onClick={handleCreatePortal}
                      disabled={isCreatingPortal}
                    >
                      {isCreatingPortal ? 'Creating...' : 'Create Portal'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {clientPortals.map((portal) => (
              <Card key={portal.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Globe className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{portal.clientName}</h4>
                        <p className="text-sm text-gray-600">{portal.clientEmail}</p>
                        <p className="text-xs text-gray-500">
                          {portal.subdomain}.yourplatform.com
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={portal.isActive ? 'default' : 'secondary'}>
                        {portal.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Visit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {clientPortals.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No client portals</h3>
                  <p className="text-sm text-gray-600 text-center mb-4">
                    Create your first client portal to start offering white-label services
                  </p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Portal
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {analytics ? (
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{analytics.totalClients}</p>
                      <p className="text-sm text-gray-600">Total Clients</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Globe className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{analytics.activePortals}</p>
                      <p className="text-sm text-gray-600">Active Portals</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{analytics.totalContent}</p>
                      <p className="text-sm text-gray-600">Content Created</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <DollarSign className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">${analytics.totalRevenue.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics coming soon</h3>
                <p className="text-sm text-gray-600 text-center">
                  Detailed analytics for your white-label service will be available here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function getFeatureDescription(feature: string): string {
  const descriptions: Record<string, string> = {
    hideBranding: 'Remove all platform branding from client-facing pages',
    customAnalytics: 'Use your own analytics tracking instead of platform analytics',
    customIntegrations: 'Add custom integrations specific to your agency',
    advancedReporting: 'Access detailed white-label reporting and insights',
    prioritySupport: 'Get priority support for your agency and clients',
    customWorkflows: 'Create custom content workflows for your clients',
    apiAccess: 'Full API access for custom integrations',
    whiteLabelReports: 'Generate reports with your branding',
    customDomains: 'Use custom domains for client portals',
    ssoIntegration: 'Single sign-on integration for your team'
  }

  return descriptions[feature] || ''
}

function isFeatureAvailable(feature: string, plan: string): boolean {
  const enterpriseFeatures = [
    'customAnalytics',
    'customIntegrations', 
    'advancedReporting',
    'customWorkflows',
    'apiAccess',
    'customDomains',
    'ssoIntegration'
  ]

  if (plan === 'enterprise') return true
  if (plan === 'agency') return !enterpriseFeatures.includes(feature)
  return false
}
