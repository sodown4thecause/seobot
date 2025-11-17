'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Target, FileText, Search, Users } from 'lucide-react'
import Link from 'next/link'

const agents = [
  {
    id: 'seo-aeo',
    name: 'SEO/AEO Manager',
    description: 'Upload SEO guides, AEO strategies, and optimization frameworks',
    icon: Target,
    color: 'bg-blue-500',
    table: 'seo_aeo_knowledge',
  },
  {
    id: 'content-strategist',
    name: 'Content Strategist',
    description: 'Upload content templates, writing frameworks, and strategy guides',
    icon: FileText,
    color: 'bg-purple-500',
    table: 'content_strategist_knowledge',
  },
  {
    id: 'keyword-researcher',
    name: 'Keyword Researcher',
    description: 'Upload keyword research methodologies and analysis frameworks',
    icon: Search,
    color: 'bg-green-500',
    table: 'keyword_researcher_knowledge',
  },
  {
    id: 'competitor-analyst',
    name: 'Competitor Analyst',
    description: 'Upload competitive analysis frameworks and research templates',
    icon: Users,
    color: 'bg-orange-500',
    table: 'competitor_analyst_knowledge',
  },
]

export default function KnowledgeBasePage() {
  return (
    <div className="flex-1 space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Knowledge Base Management</h1>
        <p className="text-gray-400 mt-1">
          Upload and manage documents for each agent's knowledge base
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {agents.map((agent) => (
          <Card key={agent.id} className="bg-[#0f0f0f] border-white/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${agent.color}`}>
                  <agent.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">{agent.name}</CardTitle>
                  <CardDescription className="text-gray-400 text-sm">
                    {agent.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Documents:</span>
                  <span className="text-white font-medium">0</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Last updated:</span>
                  <span className="text-white font-medium">Never</span>
                </div>
                <Link href={`/admin/knowledge/${agent.id}`}>
                  <Button className="w-full bg-white/10 hover:bg-white/20 text-white border-white/10">
                    Manage Documents
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

