'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  BookOpen, 
  Filter,
  GraduationCap,
  Briefcase,
  Building2,
  Lightbulb,
  CheckCircle,
  HelpCircle
} from 'lucide-react'
import { JargonCategory, JargonTerm } from '@/types/jargon'
import { useJargon } from '@/components/providers/jargon-provider'
import { JARGON_CATEGORIES } from '@/lib/jargon/dictionary'
import { JargonTooltip } from './jargon-tooltip'

interface JargonSearchProps {
  trigger?: React.ReactNode
  defaultCategory?: JargonCategory
}

export function JargonSearch({ trigger, defaultCategory }: JargonSearchProps) {
  const { 
    searchTerms, 
    getTermsByCategory, 
    showAdvancedTerms,
    getLearnedTerms,
    isLoading 
  } = useJargon()
  
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<JargonCategory | 'all'>(defaultCategory || 'all')
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'basic' | 'intermediate' | 'advanced'>('all')

  const learnedTerms = getLearnedTerms()

  // Get filtered terms
  const filteredTerms = useMemo(() => {
    let terms: JargonTerm[] = []

    if (searchQuery.trim()) {
      terms = searchTerms(searchQuery)
    } else if (selectedCategory === 'all') {
      // Get all terms from all categories
      Object.keys(JARGON_CATEGORIES).forEach(category => {
        terms.push(...getTermsByCategory(category as JargonCategory))
      })
    } else {
      terms = getTermsByCategory(selectedCategory)
    }

    // Apply difficulty filter
    if (difficultyFilter !== 'all') {
      terms = terms.filter(term => term.difficulty === difficultyFilter)
    }

    // Filter advanced terms if not enabled
    if (!showAdvancedTerms) {
      terms = terms.filter(term => term.difficulty !== 'advanced')
    }

    // Remove duplicates
    const uniqueTerms = terms.filter((term, index, self) => 
      index === self.findIndex(t => t.id === term.id)
    )

    return uniqueTerms.sort((a, b) => a.term.localeCompare(b.term))
  }, [searchQuery, selectedCategory, difficultyFilter, showAdvancedTerms, searchTerms, getTermsByCategory])

  // Group terms by category for display
  const termsByCategory = useMemo(() => {
    const grouped: Record<JargonCategory, JargonTerm[]> = {} as Record<JargonCategory, JargonTerm[]>
    
    filteredTerms.forEach(term => {
      if (!grouped[term.category]) {
        grouped[term.category] = []
      }
      grouped[term.category].push(term)
    })

    return grouped
  }, [filteredTerms])

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'basic': return <GraduationCap className="w-3 h-3" />
      case 'intermediate': return <Briefcase className="w-3 h-3" />
      case 'advanced': return <Building2 className="w-3 h-3" />
      default: return <HelpCircle className="w-3 h-3" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic': return 'border-green-500 text-green-400'
      case 'intermediate': return 'border-yellow-500 text-yellow-400'
      case 'advanced': return 'border-red-500 text-red-400'
      default: return 'border-gray-500 text-gray-400'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <BookOpen className="w-4 h-4" />
            SEO Dictionary
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            SEO & AEO Dictionary
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search terms, definitions, or examples..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600 text-white"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as any)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white text-sm"
              >
                <option value="all">All Levels</option>
                <option value="basic">Basic</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
            <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full bg-gray-800">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="seo-basics" className="text-xs">Basics</TabsTrigger>
              <TabsTrigger value="keyword-research" className="text-xs">Keywords</TabsTrigger>
              <TabsTrigger value="content-optimization" className="text-xs">Content</TabsTrigger>
              <TabsTrigger value="technical-seo" className="text-xs">Technical</TabsTrigger>
              <TabsTrigger value="aeo" className="text-xs">AEO</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-4">
              <div className="max-h-96 overflow-y-auto space-y-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto" />
                    <p className="text-gray-400 mt-2">Loading dictionary...</p>
                  </div>
                ) : filteredTerms.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">
                      {searchQuery ? 'No terms found matching your search.' : 'No terms available.'}
                    </p>
                  </div>
                ) : selectedCategory === 'all' ? (
                  // Show terms grouped by category
                  <div className="space-y-6">
                    {Object.entries(termsByCategory).map(([category, terms]) => (
                      <div key={category}>
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <Filter className="w-4 h-4 text-blue-400" />
                          {JARGON_CATEGORIES[category as JargonCategory].label}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {terms.map((term) => (
                            <TermCard key={term.id} term={term} isLearned={learnedTerms.includes(term.id)} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Show terms in grid for specific category
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredTerms.map((term) => (
                      <TermCard key={term.id} term={term} isLearned={learnedTerms.includes(term.id)} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-gray-700">
            <span>{filteredTerms.length} terms found</span>
            <span>{learnedTerms.length} terms learned</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Term card component
function TermCard({ term, isLearned }: { term: JargonTerm; isLearned: boolean }) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic': return 'border-green-500 text-green-400'
      case 'intermediate': return 'border-yellow-500 text-yellow-400'
      case 'advanced': return 'border-red-500 text-red-400'
      default: return 'border-gray-500 text-gray-400'
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-600 hover:border-gray-500 transition-colors">
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <JargonTooltip term={term.term} variant="inline" showIcon={false}>
              <h4 className="font-semibold text-white hover:text-blue-300 cursor-help">
                {term.term}
              </h4>
            </JargonTooltip>
            {isLearned && (
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            )}
          </div>
          
          <p className="text-sm text-gray-300 line-clamp-2">
            {term.shortDefinition}
          </p>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`text-xs ${getDifficultyColor(term.difficulty)}`}
            >
              {term.difficulty}
            </Badge>
            {term.businessContext && (
              <Badge variant="secondary" className="text-xs">
                <Lightbulb className="w-3 h-3 mr-1" />
                Business Impact
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}