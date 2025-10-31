'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  Star,
  TrendingUp,
  Users,
  Search,
  Target,
  CheckCircle,
  AlertTriangle,
  Building,
  Camera,
  MessageSquare,
  Calendar,
  BarChart3,
  FileText,
  Settings,
  Plus,
  Edit,
  Save,
  RefreshCw,
  ExternalLink,
  Copy,
  Download,
  Eye,
  Zap,
  Award,
  Navigation
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  upsertLocalSEOProfile,
  getLocalSEOProfile,
  generateLocalContentIdeas,
  trackLocalSEOPerformance,
  LocalSEOProfile,
  OptimizationTask
} from '@/lib/local-seo/local-seo-service'

interface LocalSEODashboardProps {
  userId: string
}

export function LocalSEODashboard({ userId }: LocalSEODashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [profile, setProfile] = useState<LocalSEOProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [contentIdeas, setContentIdeas] = useState<any>(null)
  const [performanceData, setPerformanceData] = useState<any>(null)

  // Form state
  const [businessName, setBusinessName] = useState('')
  const [businessCategory, setBusinessCategory] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [businessWebsite, setBusinessWebsite] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [country, setCountry] = useState('')
  const [servicesOffered, setServicesOffered] = useState('')
  const [serviceAreas, setServiceAreas] = useState('')
  const [localKeywords, setLocalKeywords] = useState('')

  const { toast } = useToast()

  useEffect(() => {
    loadProfile()
  }, [userId])

  const loadProfile = async () => {
    try {
      const profileData = await getLocalSEOProfile(userId)
      setProfile(profileData)
      
      if (profileData) {
        // Populate form fields
        setBusinessName(profileData.businessName)
        setBusinessCategory(profileData.businessCategory)
        setBusinessPhone(profileData.businessPhone)
        setBusinessWebsite(profileData.businessWebsite)
        setStreet(profileData.businessAddress.street)
        setCity(profileData.businessAddress.city)
        setState(profileData.businessAddress.state)
        setZip(profileData.businessAddress.zip)
        setCountry(profileData.businessAddress.country)
        setServicesOffered(profileData.servicesOffered.join(', '))
        setServiceAreas(profileData.serviceAreas.join(', '))
        setLocalKeywords(profileData.localKeywords.join(', '))
      }
    } catch (error) {
      console.error('Failed to load local SEO profile:', error)
    }
  }

  const handleSaveProfile = async () => {
    if (!businessName.trim() || !businessCategory.trim() || !city.trim()) {
      toast({
        title: "Missing required information",
        description: "Please fill in business name, category, and city.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const services = servicesOffered.split(',').map(s => s.trim()).filter(s => s)
      const areas = serviceAreas.split(',').map(s => s.trim()).filter(s => s)
      const keywords = localKeywords.split(',').map(s => s.trim()).filter(s => s)

      const updatedProfile = await upsertLocalSEOProfile({
        userId,
        businessName,
        businessCategory,
        businessAddress: {
          street,
          city,
          state,
          zip,
          country
        },
        businessPhone,
        businessWebsite,
        businessHours: {
          monday: { open: '09:00', close: '17:00' },
          tuesday: { open: '09:00', close: '17:00' },
          wednesday: { open: '09:00', close: '17:00' },
          thursday: { open: '09:00', close: '17:00' },
          friday: { open: '09:00', close: '17:00' },
          saturday: { open: '09:00', close: '17:00' },
          sunday: { open: 'closed', close: 'closed', closed: true }
        },
        servicesOffered: services,
        serviceAreas: areas,
        localKeywords: keywords,
        metadata: {
          employeesCount: 10,
          yearEstablished: 2020,
          serviceRadius: 25
        }
      })

      setProfile(updatedProfile)
      setIsEditing(false)
      
      toast({
        title: "Profile saved successfully",
        description: `Your local SEO score is ${updatedProfile.seoScore}/100`,
      })
    } catch (error) {
      console.error('Failed to save profile:', error)
      toast({
        title: "Failed to save profile",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateContentIdeas = async () => {
    if (!profile) return

    try {
      const ideas = await generateLocalContentIdeas({
        businessName: profile.businessName,
        businessCategory: profile.businessCategory,
        businessAddress: profile.businessAddress,
        servicesOffered: profile.servicesOffered,
        localKeywords: profile.localKeywords
      })

      setContentIdeas(ideas)
      setActiveTab('content')
      
      toast({
        title: "Content ideas generated",
        description: "Created local-focused content ideas for your business.",
      })
    } catch (error) {
      console.error('Failed to generate content ideas:', error)
      toast({
        title: "Generation failed",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  }

  const handleLoadPerformance = async () => {
    if (!profile) return

    try {
      const data = await trackLocalSEOPerformance({
        businessId: profile.id,
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        }
      })

      setPerformanceData(data)
      setActiveTab('analytics')
      
      toast({
        title: "Performance data loaded",
        description: "Showing local SEO performance metrics.",
      })
    } catch (error) {
      console.error('Failed to load performance data:', error)
      toast({
        title: "Failed to load data",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  }

  const getSEOScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCitationStatusColor = (status: string) => {
    switch (status) {
      case 'claimed': return 'text-green-600'
      case 'inconsistent': return 'text-yellow-600'
      case 'unclaimed': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (!profile) {
    return (
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <MapPin className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Local SEO Dashboard</h3>
            <p className="text-sm text-gray-600">Optimize your business for local search</p>
          </div>
        </div>

        {/* Setup Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Set Up Your Business Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  placeholder="Your Business Name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="businessCategory">Business Category *</Label>
                <Select value={businessCategory} onValueChange={setBusinessCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="plumber">Plumber</SelectItem>
                    <SelectItem value="dentist">Dentist</SelectItem>
                    <SelectItem value="lawyer">Lawyer</SelectItem>
                    <SelectItem value="marketing">Marketing Agency</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="retail">Retail Store</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessPhone">Phone Number</Label>
                <Input
                  id="businessPhone"
                  placeholder="(555) 123-4567"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="businessWebsite">Website</Label>
                <Input
                  id="businessWebsite"
                  placeholder="https://yourwebsite.com"
                  value={businessWebsite}
                  onChange={(e) => setBusinessWebsite(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Business Address</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Input
                  placeholder="Street Address"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
                <Input
                  placeholder="City *"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <Input
                  placeholder="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
                <Input
                  placeholder="ZIP Code"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="servicesOffered">Services Offered</Label>
              <Input
                id="servicesOffered"
                placeholder="Service 1, Service 2, Service 3"
                value={servicesOffered}
                onChange={(e) => setServicesOffered(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="serviceAreas">Service Areas</Label>
              <Input
                id="serviceAreas"
                placeholder="City 1, City 2, City 3"
                value={serviceAreas}
                onChange={(e) => setServiceAreas(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="localKeywords">Local Keywords</Label>
              <Input
                id="localKeywords"
                placeholder="plumber near me, emergency plumbing, [city] plumber"
                value={localKeywords}
                onChange={(e) => setLocalKeywords(e.target.value)}
              />
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Business Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <MapPin className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{profile.businessName}</h3>
            <p className="text-sm text-gray-600">{profile.businessCategory} • {profile.businessAddress.city}, {profile.businessAddress.state}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className={`text-2xl font-bold ${getSEOScoreColor(profile.seoScore)}`}>
              {profile.seoScore}/100
            </div>
            <p className="text-sm text-gray-600">Local SEO Score</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="citations">Citations</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{profile.competitorBusinesses.length}</p>
                    <p className="text-sm text-gray-600">Local Competitors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">
                      {profile.citationSources.filter(c => c.status === 'claimed').length}
                    </p>
                    <p className="text-sm text-gray-600">Citations Claimed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Star className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{profile.reviews.rating}</p>
                    <p className="text-sm text-gray-600">Average Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Target className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{profile.localKeywords.length}</p>
                    <p className="text-sm text-gray-600">Target Keywords</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Business Info */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">{profile.businessName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {profile.businessAddress.street}, {profile.businessAddress.city}, {profile.businessAddress.state} {profile.businessAddress.zip}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{profile.businessPhone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{profile.businessWebsite}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Mon-Fri 9AM-5PM</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Services & Areas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Services Offered</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.servicesOffered.map((service, index) => (
                      <Badge key={index} variant="secondary">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Service Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.serviceAreas.map((area, index) => (
                      <Badge key={index} variant="outline">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Target Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.localKeywords.slice(0, 5).map((keyword, index) => (
                      <Badge key={index} className="bg-blue-100 text-blue-800">
                        {keyword}
                      </Badge>
                    ))}
                    {profile.localKeywords.length > 5 && (
                      <Badge variant="outline">+{profile.localKeywords.length - 5} more</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Local Competitor Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.competitorBusinesses.map((competitor, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{competitor.name}</h4>
                        <p className="text-sm text-gray-600">{competitor.address}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span>{competitor.distance} miles away</span>
                          <span>{competitor.citations} citations</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium">{competitor.rating}</span>
                          <span className="text-xs text-gray-500">({competitor.reviewsCount})</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-green-700 mb-1">Strengths</h5>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {competitor.strengths.map((strength, sidx) => (
                            <li key={sidx}>• {strength}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-red-700 mb-1">Weaknesses</h5>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {competitor.weaknesses.map((weakness, widx) => (
                            <li key={widx}>• {weakness}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Target Keywords</h5>
                      <div className="flex flex-wrap gap-1">
                        {competitor.keywords.map((keyword, kidx) => (
                          <Badge key={kidx} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Citations Tab */}
        <TabsContent value="citations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Citation Sources</span>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Citation
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile.citationSources.map((citation, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Globe className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{citation.name}</h4>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className={`text-sm font-medium ${getCitationStatusColor(citation.status)}`}>
                            {citation.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {citation.completeness}% complete
                          </span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {citation.priority} priority
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={citation.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Optimization Tasks</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {profile.optimizationTasks.filter(t => t.status === 'pending').length} pending
                  </Badge>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Tasks
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile.optimizationTasks
                  .sort((a, b) => {
                    const priorityOrder = { high: 3, medium: 2, low: 1 }
                    return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
                  })
                  .map((task, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <span className="text-sm font-medium capitalize">{task.type}</span>
                          <Badge variant="outline">
                            Impact: {task.estimatedImpact}/10
                          </Badge>
                        </div>
                        <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Est. {task.estimatedTime} hours
                        </span>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-3 h-3 mr-1" />
                            View Steps
                          </Button>
                          <Button variant="outline" size="sm">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Mark Complete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Local Content Ideas</h3>
            <Button onClick={handleGenerateContentIdeas}>
              <Zap className="w-4 h-4 mr-2" />
              Generate Ideas
            </Button>
          </div>

          {contentIdeas ? (
            <div className="grid grid-cols-3 gap-6">
              {/* Blog Posts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Blog Posts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {contentIdeas.blogPosts.map((post: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <h4 className="font-medium text-gray-900 text-sm mb-1">{post.title}</h4>
                        <p className="text-xs text-gray-600 mb-2">{post.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{post.wordCount} words</span>
                          <Button variant="outline" size="sm">
                            <FileText className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Social Media Posts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Social Media</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {contentIdeas.socialMediaPosts.map((post: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <h4 className="font-medium text-gray-900 text-sm mb-1">{post.title}</h4>
                        <p className="text-xs text-gray-600 mb-2">{post.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{post.characterCount} chars</span>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Landing Pages */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Landing Pages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {contentIdeas.landingPages.map((page: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <h4 className="font-medium text-gray-900 text-sm mb-1">{page.title}</h4>
                        <p className="text-xs text-gray-600 mb-2">{page.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{page.wordCount} words</span>
                          <Button variant="outline" size="sm">
                            <Globe className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No content ideas yet</h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Generate local-focused content ideas to improve your search visibility
                </p>
                <Button onClick={handleGenerateContentIdeas}>
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Content Ideas
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Local SEO Performance</h3>
            <Button onClick={handleLoadPerformance}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Load Analytics
            </Button>
          </div>

          {performanceData ? (
            <div className="space-y-6">
              {/* GBP Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Google Business Profile Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-semibold">{performanceData.gbpInsights.views}</p>
                      <p className="text-sm text-gray-600">Profile Views</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-semibold">{performanceData.gbpInsights.calls}</p>
                      <p className="text-sm text-gray-600">Phone Calls</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-semibold">{performanceData.gbpInsights.websiteClicks}</p>
                      <p className="text-sm text-gray-600">Website Clicks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Local Rankings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Local Search Rankings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {performanceData.localSearchRankings.map((ranking: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="text-lg font-semibold text-gray-900">#{ranking.position}</div>
                          <div>
                            <h4 className="font-medium text-gray-900">{ranking.keyword}</h4>
                            <p className="text-sm text-gray-600">
                              {ranking.searchVolume} monthly searches • {ranking.competition} competition
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {ranking.position < ranking.previousPosition && (
                            <Badge className="bg-green-100 text-green-800">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              +{ranking.previousPosition - ranking.position}
                            </Badge>
                          )}
                          <Badge variant="outline">{ranking.location}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Review Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Review Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-semibold">{performanceData.reviewMetrics.averageRating}</p>
                      <p className="text-sm text-gray-600">Average Rating</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-semibold">{performanceData.reviewMetrics.newReviews}</p>
                      <p className="text-sm text-gray-600">New Reviews</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-semibold">{performanceData.reviewMetrics.responseRate}%</p>
                      <p className="text-sm text-gray-600">Response Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-semibold">{performanceData.reviewMetrics.averageResponseTime}h</p>
                      <p className="text-sm text-gray-600">Avg Response Time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data yet</h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Load your local SEO performance data to track your progress
                </p>
                <Button onClick={handleLoadPerformance}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Load Analytics
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
