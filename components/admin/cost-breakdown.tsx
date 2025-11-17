'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'

interface CostBreakdownProps {
  period: 'day' | 'week' | 'month'
}

interface ServiceCost {
  service: string
  cost: number
  calls: number
  percentage: number
}

const SERVICE_COLORS: Record<string, string> = {
  dataforseo: 'bg-blue-500',
  perplexity: 'bg-purple-500',
  openai: 'bg-green-500',
  firecrawl: 'bg-orange-500',
  rytr: 'bg-pink-500',
  winston: 'bg-yellow-500',
  jina: 'bg-cyan-500',
}

export function CostBreakdown({ period }: CostBreakdownProps) {
  const [data, setData] = useState<ServiceCost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/admin/analytics/cost-breakdown?period=${period}`)
      if (!response.ok) throw new Error('Failed to fetch cost breakdown')
      
      const result = await response.json()
      setData(result.data || [])
    } catch (error) {
      console.error('Error fetching cost breakdown:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalCost = data.reduce((sum, item) => sum + item.cost, 0)

  return (
    <Card className="bg-[#0f0f0f] border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Cost Breakdown by Service
        </CardTitle>
        <CardDescription className="text-gray-400">
          Total: ${totalCost.toFixed(2)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">No data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((item) => (
              <div key={item.service} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${SERVICE_COLORS[item.service] || 'bg-gray-500'}`} />
                    <span className="text-sm font-medium text-white capitalize">
                      {item.service}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">${item.cost.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{item.calls} calls</div>
                  </div>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${SERVICE_COLORS[item.service] || 'bg-gray-500'}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

