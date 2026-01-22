'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { DocumentUpload } from '@/components/admin/document-upload'
import { DocumentList } from '@/components/admin/document-list'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, FileText, Search, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const agentConfig = {
  'seo-aeo': {
    name: 'SEO/AEO Manager',
    description: 'Upload SEO guides, AEO strategies, and optimization frameworks',
    icon: Target,
    color: 'bg-blue-500',
    table: 'seo_aeo_knowledge',
  },
  'content-strategist': {
    name: 'Content Strategist',
    description: 'Upload content templates, writing frameworks, and strategy guides',
    icon: FileText,
    color: 'bg-purple-500',
    table: 'content_strategist_knowledge',
  },
  'keyword-researcher': {
    name: 'Keyword Researcher',
    description: 'Upload keyword research methodologies and analysis frameworks',
    icon: Search,
    color: 'bg-green-500',
    table: 'keyword_researcher_knowledge',
  },
  'competitor-analyst': {
    name: 'Competitor Analyst',
    description: 'Upload competitive analysis frameworks and research templates',
    icon: Users,
    color: 'bg-orange-500',
    table: 'competitor_analyst_knowledge',
  },
}

export default function AgentKnowledgeBasePage() {
  const params = useParams()
  const agentId = params?.agentId as string | undefined
  const agent = agentId ? agentConfig[agentId as keyof typeof agentConfig] : undefined
  const [refreshKey, setRefreshKey] = useState(0)

  if (!agentId || !agent) {
    return (
      <div className="flex-1 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Agent not found</h1>
          <Link href="/admin/knowledge">
            <Button className="mt-4">Back to Knowledge Base</Button>
          </Link>
        </div>
      </div>
    )
  }

  const Icon = agent.icon

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/knowledge">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${agent.color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{agent.name}</h1>
            <p className="text-gray-400 mt-1">{agent.description}</p>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <Card className="bg-[#0f0f0f] border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Upload Documents</CardTitle>
          <CardDescription className="text-gray-400">
            Upload PDFs, Markdown files, or text documents to enhance this agent&apos;s knowledge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentUpload 
            agentId={agentId} 
            tableName={agent.table}
            onUploadSuccess={handleUploadSuccess}
          />
        </CardContent>
      </Card>

      {/* Document List */}
      <Card className="bg-[#0f0f0f] border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Uploaded Documents</CardTitle>
          <CardDescription className="text-gray-400">
            Manage and delete documents from this agent&apos;s knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentList 
            agentId={agentId} 
            tableName={agent.table}
            refreshKey={refreshKey}
          />
        </CardContent>
      </Card>
    </div>
  )
}

