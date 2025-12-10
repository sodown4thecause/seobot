'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, BarChart3, Upload, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default function AdminOverviewPage() {
  return (
    <div className="flex-1 space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Manage agent knowledge bases and monitor API usage
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#0f0f0f] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Documents</CardTitle>
            <Database className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">0</div>
            <p className="text-xs text-gray-500">Across all agents</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f0f] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">API Calls (30d)</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">0</div>
            <p className="text-xs text-gray-500">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f0f] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Cost (30d)</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">$0.00</div>
            <p className="text-xs text-gray-500">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f0f] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Uploads (7d)</CardTitle>
            <Upload className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">0</div>
            <p className="text-xs text-gray-500">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/knowledge">
          <Card className="bg-[#0f0f0f] border-white/10 hover:bg-white/5 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="h-5 w-5" />
                Manage Knowledge Bases
              </CardTitle>
              <CardDescription className="text-gray-400">
                Upload and manage documents for each agent's knowledge base
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/analytics">
          <Card className="bg-[#0f0f0f] border-white/10 hover:bg-white/5 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                View API Analytics
              </CardTitle>
              <CardDescription className="text-gray-400">
                Monitor API usage and costs across all services
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/usage">
          <Card className="bg-[#0f0f0f] border-white/10 hover:bg-white/5 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Usage Analytics
              </CardTitle>
              <CardDescription className="text-gray-400">
                View per-user AI usage, costs, and credit limits
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Agent Status */}
      <Card className="bg-[#0f0f0f] border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Agent Knowledge Base Status</CardTitle>
          <CardDescription className="text-gray-400">
            Document counts per agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'SEO/AEO Manager', docs: 0, color: 'bg-blue-500' },
              { name: 'Content Strategist', docs: 0, color: 'bg-purple-500' },
              { name: 'Keyword Researcher', docs: 0, color: 'bg-green-500' },
              { name: 'Competitor Analyst', docs: 0, color: 'bg-orange-500' },
            ].map((agent) => (
              <div key={agent.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${agent.color}`} />
                  <span className="text-sm font-medium text-white">{agent.name}</span>
                </div>
                <span className="text-sm text-gray-400">{agent.docs} documents</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

