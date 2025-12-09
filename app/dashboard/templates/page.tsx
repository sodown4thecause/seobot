import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  LayoutTemplate,
  Sparkles,
  Wand2,
  FolderPlus,
  Download,
  Upload,
  BookOpen,
  ChartLine,
  Share2,
} from 'lucide-react'

const templateCategories = [
  {
    id: 'landing-pages',
    title: 'Landing Pages',
    description: 'Hero layouts, feature sections, conversion flows',
    color: 'from-blue-500/10 to-cyan-500/10',
    templates: [
      {
        name: 'SaaS Hero + Feature Stack',
        description: 'Modern hero, credibility bar, and converting feature grid',
        tags: ['Hero', 'Logos', 'CTA'],
      },
      {
        name: 'Agency Results Page',
        description: 'Case-study forward template with proof blocks and pricing tiers',
        tags: ['Case Study', 'Pricing'],
      },
    ],
  },
  {
    id: 'content-hubs',
    title: 'Content Hubs',
    description: 'Research hubs, resource libraries, and editorial layouts',
    color: 'from-purple-500/10 to-pink-500/10',
    templates: [
      {
        name: 'SEO Research Hub',
        description: 'Multi-column layout for insights, briefs, and quick wins',
        tags: ['Research', 'Dashboard'],
      },
      {
        name: 'Thought Leadership Library',
        description: 'Long-form storytelling layout with quotes and highlights',
        tags: ['Long-form', 'Story'],
      },
    ],
  },
  {
    id: 'playbooks',
    title: 'Operational Playbooks',
    description: 'Workflow, onboarding, and SOP templates',
    color: 'from-emerald-500/10 to-teal-500/10',
    templates: [
      {
        name: 'AI Writer Brief',
        description: 'Structured brief that pairs with the chat workspace',
        tags: ['Brief', 'AI'],
      },
      {
        name: 'Technical SEO Checklist',
        description: 'Step-by-step diagnostic with completion tracking',
        tags: ['Checklist', 'Automation'],
      },
    ],
  },
]

const featuredTemplates = [
  {
    title: 'Ranked Content Blueprint',
    description: 'Combines competitor gaps, EEAT proof, and CTA playbooks.',
    stats: '24 saved variations',
  },
  {
    title: 'Intent-Driven Email Series',
    description: 'Sequenced nurture emails aligned to keyword intent buckets.',
    stats: '12 recent deployments',
  },
  {
    title: 'AI Search Answer Pack',
    description: 'Structured knowledge panels that map to ChatGPT + Perplexity prompts.',
    stats: '6 curated snippets',
  },
]

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-[#05050a] p-6 md:p-10 space-y-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3 text-zinc-400 mb-2 text-sm">
            <LayoutTemplate className="w-5 h-5 text-indigo-400" />
            <span>Reusable systems · AI-native</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Template Library</h1>
          <p className="text-zinc-400 mt-2 max-w-2xl">
            Launch faster with proven blueprints. Remix, version, and deploy high-performing templates
            for landing pages, playbooks, and AI chat experiences.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <Button className="gap-2 bg-white text-black hover:bg-zinc-200">
            <Sparkles className="w-4 h-4" />
            Generate from brief
          </Button>
          <Button variant="secondary" className="gap-2 bg-white/10 text-white border-white/10 hover:bg-white/20">
            <Upload className="w-4 h-4" />
            Import template
          </Button>
        </div>
      </header>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-white text-2xl">Start with a prompt</CardTitle>
              <CardDescription className="text-zinc-400">
                Describe the outcome you want. We will assemble a stitched template and matching workflow.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input
            placeholder="Example: Create a landing page template for an AI analytics tool with testimonial wall and usage-based pricing"
            className="bg-black/40 border-white/10 text-white placeholder:text-white/40"
          />
          <div className="flex flex-wrap gap-3">
            {['Launch announcement', 'Competitive teardown', 'Authority blog', 'Sales enablement'].map((chip) => (
              <Button key={chip} variant="outline" className="border-white/10 text-white/80 bg-white/5 hover:bg-white/10">
                {chip}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="landing-pages" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          {templateCategories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="text-sm">
              {category.title}
            </TabsTrigger>
          ))}
        </TabsList>
        {templateCategories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <div className={`rounded-3xl border border-white/10 bg-gradient-to-r ${category.color} p-6`}
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm uppercase tracking-wider text-white/60">{category.title}</p>
                  <h2 className="text-2xl font-semibold text-white">{category.description}</h2>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" className="bg-white/10 text-white border-white/20">
                    <Wand2 className="w-4 h-4 mr-2" />
                    Remix with AI
                  </Button>
                  <Button variant="ghost" className="text-white hover:bg-white/10">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {category.templates.map((template) => (
                <Card key={template.name} className="bg-white/5 border-white/10 flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">{template.name}</CardTitle>
                    <CardDescription className="text-zinc-400 text-sm">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 flex-1">
                    <div className="flex flex-wrap gap-2">
                      {template.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="border-white/10 text-white/70">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <Button className="flex-1 bg-white text-black hover:bg-zinc-200">
                        Use template
                      </Button>
                      <Button variant="outline" className="border-white/10 text-white/80">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <section className="grid gap-4 md:grid-cols-3">
        {featuredTemplates.map((template) => (
          <Card key={template.title} className="bg-white/5 border-white/10 h-full">
            <CardHeader className="space-y-1">
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-300" />
                {template.title}
              </CardTitle>
              <CardDescription className="text-zinc-400">{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm text-zinc-400">
              <span>{template.stats}</span>
              <Button variant="secondary" className="bg-white/10 text-white border-white/10">
                View variations
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ChartLine className="w-5 h-5 text-emerald-300" />
              Template analytics
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Track adoption, conversions, and downstream performance across teams.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {[
              { label: 'Live variants', value: '42' },
              { label: 'Avg. conversion', value: '37%' },
              { label: 'Automations', value: '18 triggers' },
              { label: 'Shared playbooks', value: '11' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-black/30 border border-white/5 p-4">
                <p className="text-sm text-white/60">{stat.label}</p>
                <p className="text-2xl font-semibold text-white mt-1">{stat.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-cyan-300" />
              Quick actions
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Publish to teams, sync to CMS, or share with the AI chat workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[{
              title: 'Push to AI chat workspace',
              description: 'Expose template to the chat agent for instant personalization.',
              icon: Sparkles,
            },
            {
              title: 'Sync to CMS block library',
              description: 'Create portable blocks in Webflow, Notion, or Sanity.',
              icon: FileText,
            },
            {
              title: 'Share with collaborators',
              description: 'Invite teammates or clients to review and remix.',
              icon: Share2,
            }].map((action) => (
              <div key={action.title} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                <action.icon className="w-5 h-5 text-white/70" />
                <div>
                  <p className="text-white font-medium">{action.title}</p>
                  <p className="text-sm text-white/60">{action.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
