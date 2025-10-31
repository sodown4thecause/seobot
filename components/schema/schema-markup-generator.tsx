'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Code,
  FileText,
  CheckCircle,
  AlertTriangle,
  Copy,
  Download,
  Play,
  Save,
  Plus,
  Edit,
  Trash2,
  Eye,
  Settings,
  Zap,
  BookOpen,
  Globe,
  Search,
  Filter,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Lightbulb,
  Database,
  Layers,
  Target,
  Calendar
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
  generateSchemaMarkup,
  createSchemaTemplate,
  getSchemaTemplates,
  getGeneratedSchemas,
  generateImplementationCode,
  generateSchemaFromTemplate,
  SchemaMarkupTemplate,
  GeneratedSchemaMarkup,
  SchemaType
} from '@/lib/schema/schema-markup-service'

interface SchemaMarkupGeneratorProps {
  userId: string
}

export function SchemaMarkupGenerator({ userId }: SchemaMarkupGeneratorProps) {
  const [activeTab, setActiveTab] = useState('generate')
  const [templates, setTemplates] = useState<SchemaMarkupTemplate[]>([])
  const [generatedSchemas, setGeneratedSchemas] = useState<GeneratedSchemaMarkup[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSchema, setSelectedSchema] = useState<GeneratedSchemaMarkup | null>(null)
  const [implementationCode, setImplementationCode] = useState('')
  const [implementationFormat, setImplementationFormat] = useState<'json-ld' | 'microdata' | 'rdfa'>('json-ld')

  // Form state
  const [contentType, setContentType] = useState<SchemaType>('Article')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [author, setAuthor] = useState('')
  const [publisher, setPublisher] = useState('')
  const [publishDate, setPublishDate] = useState('')
  const [image, setImage] = useState('')
  const [targetKeywords, setTargetKeywords] = useState('')
  const [customFields, setCustomFields] = useState('')

  // Template form state
  const [templateName, setTemplateName] = useState('')
  const [templateContent, setTemplateContent] = useState('')
  const [isTemplatePublic, setIsTemplatePublic] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    try {
      const [templatesData, schemasData] = await Promise.all([
        getSchemaTemplates(userId),
        getGeneratedSchemas(userId)
      ])
      setTemplates(templatesData)
      setGeneratedSchemas(schemasData)
    } catch (error) {
      console.error('Failed to load schema data:', error)
    }
  }

  const handleGenerateSchema = async () => {
    if (!title.trim() || !description.trim() || !url.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title, description, and URL.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const keywords = targetKeywords.split(',').map(k => k.trim()).filter(k => k)
      const customFieldsData = customFields ? JSON.parse(customFields) : {}

      const schema = await generateSchemaMarkup({
        contentData: {
          title,
          description,
          url,
          author: author.trim() || undefined,
          publisher: publisher.trim() || undefined,
          publishDate: publishDate.trim() || undefined,
          image: image.trim() || undefined,
          ...customFieldsData
        },
        schemaType: contentType,
        customFields: customFieldsData,
        targetKeywords: keywords
      }, userId)

      setGeneratedSchemas([schema, ...generatedSchemas])
      setSelectedSchema(schema)
      setActiveTab('library')

      toast({
        title: "Schema generated successfully",
        description: `Created ${contentType} schema with ${schema.validationStatus === 'valid' ? 'valid' : 'invalid'} validation.`,
      })
    } catch (error) {
      console.error('Failed to generate schema:', error)
      toast({
        title: "Generation failed",
        description: "Please check your inputs and try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    if (!templateName.trim() || !templateContent.trim()) {
      toast({
        title: "Missing template information",
        description: "Please provide template name and content.",
        variant: "destructive"
      })
      return
    }

    try {
      const templateData = JSON.parse(templateContent)
      
      const template = await createSchemaTemplate({
        templateName,
        schemaType: contentType,
        templateContent: templateData,
        isPublic: isTemplatePublic,
        userId
      })

      setTemplates([template, ...templates])
      toast({
        title: "Template created",
        description: "Your schema template has been saved successfully.",
      })

      // Reset form
      setTemplateName('')
      setTemplateContent('')
      setIsTemplatePublic(false)
    } catch (error) {
      console.error('Failed to create template:', error)
      toast({
        title: "Template creation failed",
        description: error instanceof Error ? error.message : "Please check your template format.",
        variant: "destructive"
      })
    }
  }

  const handleGenerateFromTemplate = async (template: SchemaMarkupTemplate) => {
    if (!title.trim() || !description.trim() || !url.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title, description, and URL.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const customFieldsData = customFields ? JSON.parse(customFields) : {}

      const schema = await generateSchemaFromTemplate(
        template.id,
        {
          title,
          description,
          url,
          author: author.trim() || undefined,
          publisher: publisher.trim() || undefined,
          publishDate: publishDate.trim() || undefined,
          image: image.trim() || undefined,
          ...customFieldsData
        },
        userId
      )

      setGeneratedSchemas([schema, ...generatedSchemas])
      setSelectedSchema(schema)
      setActiveTab('library')

      toast({
        title: "Schema generated from template",
        description: `Created ${template.schemaType} schema using your template.`,
      })
    } catch (error) {
      console.error('Failed to generate schema from template:', error)
      toast({
        title: "Generation failed",
        description: "Please check your inputs and try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateImplementation = async () => {
    if (!selectedSchema) return

    try {
      const code = await generateImplementationCode(selectedSchema.id, implementationFormat)
      setImplementationCode(code)
    } catch (error) {
      console.error('Failed to generate implementation code:', error)
      toast({
        title: "Code generation failed",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "The code has been copied to your clipboard.",
    })
  }

  const getValidationColor = (status: string) => {
    switch (status) {
      case 'valid': return 'text-green-600 bg-green-100'
      case 'invalid': return 'text-red-600 bg-red-100'
      default: return 'text-yellow-600 bg-yellow-100'
    }
  }

  const getSchemaTypeIcon = (type: SchemaType) => {
    switch (type) {
      case 'Article': return <FileText className="w-4 h-4" />
      case 'Product': return <Target className="w-4 h-4" />
      case 'Event': return <Calendar className="w-4 h-4" />
      case 'LocalBusiness': return <Globe className="w-4 h-4" />
      case 'VideoObject': return <Play className="w-4 h-4" />
      default: return <Code className="w-4 h-4" />
    }
  }

  const schemaTypes: SchemaType[] = [
    'Article', 'Product', 'Event', 'Recipe', 'Review', 'FAQ', 'HowTo',
    'JobPosting', 'LocalBusiness', 'Organization', 'Person', 'VideoObject',
    'PodcastEpisode', 'Course', 'Service', 'SoftwareApplication'
  ]

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Code className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Schema Markup Generator</h3>
            <p className="text-sm text-gray-600">Create structured data for rich snippets</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {generatedSchemas.length} schemas generated
          </Badge>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="implement">Implement</TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Content Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Content Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="contentType">Schema Type</Label>
                  <Select value={contentType} onValueChange={(value) => setContentType(value as SchemaType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {schemaTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center space-x-2">
                            {getSchemaTypeIcon(type)}
                            <span>{type}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Your content title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="A detailed description of your content"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="url">URL *</Label>
                  <Input
                    id="url"
                    placeholder="https://example.com/your-content"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      placeholder="Author name"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="publisher">Publisher</Label>
                    <Input
                      id="publisher"
                      placeholder="Publisher name"
                      value={publisher}
                      onChange={(e) => setPublisher(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="publishDate">Publish Date</Label>
                    <Input
                      id="publishDate"
                      type="date"
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="image">Image URL</Label>
                    <Input
                      id="image"
                      placeholder="https://example.com/image.jpg"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="targetKeywords">Target Keywords</Label>
                  <Input
                    id="targetKeywords"
                    placeholder="SEO, marketing, schema markup"
                    value={targetKeywords}
                    onChange={(e) => setTargetKeywords(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="customFields">Custom Fields (JSON)</Label>
                  <Textarea
                    id="customFields"
                    placeholder='{"price": "29.99", "rating": "4.5"}'
                    value={customFields}
                    onChange={(e) => setCustomFields(e.target.value)}
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>

                <Button
                  onClick={handleGenerateSchema}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  Generate Schema
                </Button>
              </CardContent>
            </Card>

            {/* Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Use Template</span>
                  <Badge variant="outline">{templates.length} available</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {templates.length === 0 ? (
                    <div className="text-center py-8">
                      <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No templates available</p>
                      <p className="text-sm text-gray-500 mt-1">Create your first template to get started</p>
                    </div>
                  ) : (
                    templates
                      .filter(template => template.schemaType === contentType)
                      .map((template) => (
                        <div key={template.id} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {getSchemaTypeIcon(template.schemaType)}
                              <span className="font-medium text-sm">{template.templateName}</span>
                            </div>
                            {template.isPublic && (
                              <Badge variant="secondary" className="text-xs">
                                Public
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              Used {template.usageCount} times
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateFromTemplate(template)}
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Use
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Create Template */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Create New Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input
                    id="templateName"
                    placeholder="My Article Template"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="templateType">Schema Type</Label>
                  <Select value={contentType} onValueChange={(value) => setContentType(value as SchemaType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {schemaTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="templateContent">Template Content (JSON)</Label>
                  <Textarea
                    id="templateContent"
                    placeholder='{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{{title}}",
  "description": "{{description}}"
}'
                    value={templateContent}
                    onChange={(e) => setTemplateContent(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isTemplatePublic}
                    onChange={(e) => setIsTemplatePublic(e.target.checked)}
                  />
                  <Label htmlFor="isPublic" className="text-sm">
                    Make template public
                  </Label>
                </div>

                <Button onClick={handleCreateTemplate} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </CardContent>
            </Card>

            {/* Template List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {templates.length === 0 ? (
                    <div className="text-center py-8">
                      <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No templates created yet</p>
                    </div>
                  ) : (
                    templates.map((template) => (
                      <div key={template.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getSchemaTypeIcon(template.schemaType)}
                            <span className="font-medium text-sm">{template.templateName}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {template.isPublic && (
                              <Badge variant="secondary" className="text-xs">
                                Public
                              </Badge>
                            )}
                            {template.isDefault && (
                              <Badge variant="outline" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Used {template.usageCount} times • {template.schemaType}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Library Tab */}
        <TabsContent value="library" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Generated Schemas</span>
                <div className="flex items-center space-x-2">
                  <Select value={contentType} onValueChange={(value) => setContentType(value as SchemaType)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {schemaTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {generatedSchemas.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No schemas generated yet</p>
                    <p className="text-sm text-gray-500 mt-1">Create your first schema to get started</p>
                  </div>
                ) : (
                  generatedSchemas
                    .filter(schema => contentType === 'all' || schema.schemaType === contentType)
                    .map((schema) => (
                      <div 
                        key={schema.id} 
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedSchema?.id === schema.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedSchema(schema)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getSchemaTypeIcon(schema.schemaType)}
                            <span className="font-medium">{schema.schemaData?.headline || schema.schemaData?.name || 'Untitled'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getValidationColor(schema.validationStatus)}>
                              {schema.validationStatus === 'valid' ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : (
                                <AlertTriangle className="w-3 h-3 mr-1" />
                              )}
                              {schema.validationStatus}
                            </Badge>
                            <Badge variant="outline">
                              {schema.implementationStatus}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {schema.schemaData?.description || 'No description available'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Created {new Date(schema.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                copyToClipboard(JSON.stringify(schema.schemaData, null, 2))
                              }}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveTab('implement')
                              }}
                            >
                              <Code className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {schema.validationErrors.length > 0 && (
                          <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                            {schema.validationErrors.slice(0, 2).join(', ')}
                            {schema.validationErrors.length > 2 && ` +${schema.validationErrors.length - 2} more`}
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Implement Tab */}
        <TabsContent value="implement" className="space-y-4">
          {selectedSchema ? (
            <div className="grid grid-cols-2 gap-6">
              {/* Schema Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Schema Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      {getSchemaTypeIcon(selectedSchema.schemaType)}
                      <span className="font-medium">{selectedSchema.schemaType}</span>
                      <Badge className={getValidationColor(selectedSchema.validationStatus)}>
                        {selectedSchema.validationStatus}
                      </Badge>
                    </div>
                    <Textarea
                      value={JSON.stringify(selectedSchema.schemaData, null, 2)}
                      readOnly
                      rows={12}
                      className="font-mono text-sm"
                    />
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(selectedSchema.schemaData, null, 2))}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy JSON
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Implementation Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Implementation Code</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Format</Label>
                    <Select value={implementationFormat} onValueChange={(value) => setImplementationFormat(value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json-ld">JSON-LD (Recommended)</SelectItem>
                        <SelectItem value="microdata">Microdata</SelectItem>
                        <SelectItem value="rdfa">RDFa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleGenerateImplementation} className="w-full">
                    <Code className="w-4 h-4 mr-2" />
                    Generate Code
                  </Button>

                  {implementationCode && (
                    <div className="space-y-3">
                      <Textarea
                        value={implementationCode}
                        readOnly
                        rows={10}
                        className="font-mono text-sm"
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(implementationCode)}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy Code
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Code className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a schema to implement</h3>
                <p className="text-sm text-gray-600 text-center">
                  Choose a schema from your library to generate implementation code
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
