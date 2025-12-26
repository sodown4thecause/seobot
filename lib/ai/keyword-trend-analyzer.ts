/**
 * Keyword Trend Analyzer
 * Analyzes historical keyword data to detect trends, seasonal patterns, and opportunities
 */

import { dataforseo_labs_google_historical_keyword_dataToolWithClient } from '@/lib/mcp/dataforseo/dataforseo_labs_google_historical_keyword_data'
import { getMcpClient } from '@/lib/mcp/dataforseo/client'

export interface TrendAnalysis {
  trend: 'rising' | 'stable' | 'declining' | 'seasonal'
  seasonalPeaks?: string[] // e.g., ['November', 'December']
  yoyGrowth: number // Year-over-year growth percentage
  recommendation: string
  confidence: 'high' | 'medium' | 'low'
  monthlyTrend?: MonthlyTrendData[]
  bestTiming?: {
    month: string
    reason: string
  }
}

export interface MonthlyTrendData {
  month: string
  year: number
  searchVolume: number
  changeFromPrevious: number // Percentage change
}

export interface HistoricalKeywordData {
  keyword: string
  monthlySearches: Array<{
    month: string
    year: number
    searchVolume: number
  }>
  averageMonthlyVolume: number
  peakVolume: number
  lowestVolume: number
}

export class KeywordTrendAnalyzer {
  private historicalDataTool = dataforseo_labs_google_historical_keyword_dataToolWithClient(
    () => getMcpClient()
  )

  /**
   * Analyze keyword trends from historical data
   */
  async analyzeTrend(
    keyword: string,
    location: string = 'United States',
    language: string = 'en'
  ): Promise<TrendAnalysis> {
    try {
      // Fetch historical data
      const historicalData = await this.fetchHistoricalData(keyword, location, language)
      
      if (!historicalData || historicalData.monthlySearches.length === 0) {
        return {
          trend: 'stable',
          yoyGrowth: 0,
          recommendation: 'Insufficient historical data available for trend analysis.',
          confidence: 'low',
        }
      }

      // Analyze trends
      const trend = this.determineTrend(historicalData)
      const seasonalPeaks = this.detectSeasonalPatterns(historicalData)
      const yoyGrowth = this.calculateYoYGrowth(historicalData)
      const monthlyTrend = this.calculateMonthlyTrend(historicalData)
      const bestTiming = this.recommendBestTiming(historicalData, seasonalPeaks)

      // Generate recommendation
      const recommendation = this.generateRecommendation(
        trend,
        yoyGrowth,
        seasonalPeaks,
        bestTiming
      )

      return {
        trend,
        seasonalPeaks,
        yoyGrowth,
        recommendation,
        confidence: this.calculateConfidence(historicalData),
        monthlyTrend,
        bestTiming,
      }
    } catch (error) {
      console.error('Failed to analyze keyword trend:', error)
      return {
        trend: 'stable',
        yoyGrowth: 0,
        recommendation: 'Unable to analyze trends due to data availability issues.',
        confidence: 'low',
      }
    }
  }

  /**
   * Fetch historical keyword data from DataForSEO
   */
  private async fetchHistoricalData(
    keyword: string,
    location: string,
    language: string
  ): Promise<HistoricalKeywordData | null> {
    try {
      if (!this.historicalDataTool?.execute) return null
      const result = await this.historicalDataTool.execute({
        keywords: [keyword],
        location_name: location,
        language_code: language,
      }, {
        abortSignal: new AbortController().signal,
        toolCallId: 'keyword-trend-analyzer',
        messages: []
      })

      // Parse the result (it comes as JSON string)
      const data = typeof result === 'string' ? JSON.parse(result) : result

      if (!data || !data.tasks || data.tasks.length === 0) {
        return null
      }

      const taskData = data.tasks[0]
      if (!taskData.result || taskData.result.length === 0) {
        return null
      }

      const keywordData = taskData.result[0]
      const monthlySearches = this.extractMonthlySearches(keywordData)

      return {
        keyword,
        monthlySearches,
        averageMonthlyVolume: this.calculateAverage(monthlySearches.map(m => m.searchVolume)),
        peakVolume: Math.max(...monthlySearches.map(m => m.searchVolume)),
        lowestVolume: Math.min(...monthlySearches.map(m => m.searchVolume)),
      }
    } catch (error) {
      console.error('Failed to fetch historical data:', error)
      return null
    }
  }

  /**
   * Extract monthly search data from API response
   */
  private extractMonthlySearches(keywordData: any): Array<{
    month: string
    year: number
    searchVolume: number
  }> {
    const monthlySearches: Array<{
      month: string
      year: number
      searchVolume: number
    }> = []

    // DataForSEO returns monthly data in various formats
    // Adjust based on actual API response structure
    if (keywordData.monthly_searches) {
      keywordData.monthly_searches.forEach((item: any) => {
        monthlySearches.push({
          month: item.month || '',
          year: item.year || new Date().getFullYear(),
          searchVolume: item.search_volume || 0,
        })
      })
    }

    return monthlySearches.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return this.monthToNumber(a.month) - this.monthToNumber(b.month)
    })
  }

  /**
   * Determine overall trend direction
   */
  private determineTrend(data: HistoricalKeywordData): TrendAnalysis['trend'] {
    if (data.monthlySearches.length < 6) {
      return 'stable'
    }

    // Check for seasonal patterns first
    const seasonalScore = this.calculateSeasonalScore(data)
    if (seasonalScore > 0.3) {
      return 'seasonal'
    }

    // Calculate trend direction
    const recentMonths = data.monthlySearches.slice(-6)
    const olderMonths = data.monthlySearches.slice(0, 6)

    const recentAvg = this.calculateAverage(recentMonths.map(m => m.searchVolume))
    const olderAvg = this.calculateAverage(olderMonths.map(m => m.searchVolume))

    const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100

    if (changePercent > 15) return 'rising'
    if (changePercent < -15) return 'declining'
    return 'stable'
  }

  /**
   * Detect seasonal patterns
   */
  private detectSeasonalPatterns(data: HistoricalKeywordData): string[] {
    if (data.monthlySearches.length < 12) {
      return []
    }

    const monthlyAverages: Record<string, number[]> = {}

    // Group by month across all years
    data.monthlySearches.forEach(item => {
      const month = item.month
      if (!monthlyAverages[month]) {
        monthlyAverages[month] = []
      }
      monthlyAverages[month].push(item.searchVolume)
    })

    // Calculate average volume per month
    const monthAverages: Record<string, number> = {}
    Object.keys(monthlyAverages).forEach(month => {
      monthAverages[month] = this.calculateAverage(monthlyAverages[month])
    })

    // Find months that are significantly above average
    const overallAverage = this.calculateAverage(Object.values(monthAverages))
    const peaks: string[] = []

    Object.keys(monthAverages).forEach(month => {
      if (monthAverages[month] > overallAverage * 1.2) {
        peaks.push(month)
      }
    })

    return peaks.sort((a, b) => this.monthToNumber(a) - this.monthToNumber(b))
  }

  /**
   * Calculate year-over-year growth
   */
  private calculateYoYGrowth(data: HistoricalKeywordData): number {
    if (data.monthlySearches.length < 12) {
      return 0
    }

    // Get data from same months in different years
    const currentYear = new Date().getFullYear()
    const previousYear = currentYear - 1

    const currentYearData = data.monthlySearches.filter(m => m.year === currentYear)
    const previousYearData = data.monthlySearches.filter(m => m.year === previousYear)

    if (currentYearData.length === 0 || previousYearData.length === 0) {
      return 0
    }

    const currentAvg = this.calculateAverage(currentYearData.map(m => m.searchVolume))
    const previousAvg = this.calculateAverage(previousYearData.map(m => m.searchVolume))

    if (previousAvg === 0) return 0

    return ((currentAvg - previousAvg) / previousAvg) * 100
  }

  /**
   * Calculate monthly trend changes
   */
  private calculateMonthlyTrend(data: HistoricalKeywordData): MonthlyTrendData[] {
    const trends: MonthlyTrendData[] = []

    for (let i = 1; i < data.monthlySearches.length; i++) {
      const current = data.monthlySearches[i]
      const previous = data.monthlySearches[i - 1]

      const change = previous.searchVolume > 0
        ? ((current.searchVolume - previous.searchVolume) / previous.searchVolume) * 100
        : 0

      trends.push({
        month: current.month,
        year: current.year,
        searchVolume: current.searchVolume,
        changeFromPrevious: change,
      })
    }

    return trends
  }

  /**
   * Recommend best timing for content/optimization
   */
  private recommendBestTiming(
    data: HistoricalKeywordData,
    seasonalPeaks: string[]
  ): { month: string; reason: string } | undefined {
    if (seasonalPeaks.length > 0) {
      // Recommend starting 2-3 months before peak season
      const peakMonth = seasonalPeaks[0]
      const recommendedMonth = this.getMonthsBefore(peakMonth, 2)
      
      return {
        month: recommendedMonth,
        reason: `Peak search volume occurs in ${peakMonth}. Start optimization 2-3 months earlier to capture early searchers.`,
      }
    }

    // If no clear seasonal pattern, recommend based on trend
    const recentTrend = data.monthlySearches.slice(-3)
    const avgRecent = this.calculateAverage(recentTrend.map(m => m.searchVolume))
    const overallAvg = data.averageMonthlyVolume

    if (avgRecent > overallAvg * 1.1) {
      return {
        month: 'Now',
        reason: 'Search volume is currently above average. Good time to optimize and capture current demand.',
      }
    }

    return undefined
  }

  /**
   * Generate recommendation based on analysis
   */
  private generateRecommendation(
    trend: TrendAnalysis['trend'],
    yoyGrowth: number,
    seasonalPeaks: string[],
    bestTiming?: { month: string; reason: string }
  ): string {
    const recommendations: string[] = []

    if (trend === 'rising') {
      recommendations.push(`This keyword is trending upward (${yoyGrowth.toFixed(1)}% YoY growth).`)
      recommendations.push('Consider prioritizing this keyword as it shows growing demand.')
    } else if (trend === 'declining') {
      recommendations.push(`This keyword is declining (${Math.abs(yoyGrowth).toFixed(1)}% YoY decrease).`)
      recommendations.push('Consider focusing on related keywords with better growth potential.')
    } else if (trend === 'seasonal') {
      recommendations.push(`This keyword shows strong seasonal patterns with peaks in: ${seasonalPeaks.join(', ')}.`)
      recommendations.push('Plan content and optimization campaigns around these peak periods.')
    } else {
      recommendations.push('This keyword shows stable search volume over time.')
      recommendations.push('It\'s a reliable long-term target with consistent demand.')
    }

    if (bestTiming) {
      recommendations.push(`Best timing: ${bestTiming.month} - ${bestTiming.reason}`)
    }

    return recommendations.join(' ')
  }

  /**
   * Calculate confidence level in analysis
   */
  private calculateConfidence(data: HistoricalKeywordData): 'high' | 'medium' | 'low' {
    if (data.monthlySearches.length >= 24) return 'high'
    if (data.monthlySearches.length >= 12) return 'medium'
    return 'low'
  }

  /**
   * Calculate seasonal score (0-1)
   */
  private calculateSeasonalScore(data: HistoricalKeywordData): number {
    if (data.monthlySearches.length < 12) return 0

    const monthlyAverages: Record<string, number[]> = {}
    data.monthlySearches.forEach(item => {
      if (!monthlyAverages[item.month]) {
        monthlyAverages[item.month] = []
      }
      monthlyAverages[item.month].push(item.searchVolume)
    })

    const variances = Object.values(monthlyAverages).map(volumes => {
      const avg = this.calculateAverage(volumes)
      const variance = volumes.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / volumes.length
      return variance
    })

    const avgVariance = this.calculateAverage(variances)
    const overallAvg = data.averageMonthlyVolume

    // Higher variance relative to average = more seasonal
    return Math.min(avgVariance / (overallAvg * overallAvg), 1)
  }

  // Helper methods
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length
  }

  private monthToNumber(month: string): number {
    const months: Record<string, number> = {
      'January': 1, 'February': 2, 'March': 3, 'April': 4,
      'May': 5, 'June': 6, 'July': 7, 'August': 8,
      'September': 9, 'October': 10, 'November': 11, 'December': 12,
    }
    return months[month] || 0
  }

  private getMonthsBefore(month: string, count: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December']
    const currentIndex = months.indexOf(month)
    const targetIndex = (currentIndex - count + 12) % 12
    return months[targetIndex]
  }
}

export const keywordTrendAnalyzer = new KeywordTrendAnalyzer()
