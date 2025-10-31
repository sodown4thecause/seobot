/**
 * Auto-seed frameworks from markdown/text files
 * 
 * File naming convention:
 * - [category]-[name].md or .txt
 * - Example: seo-keyword-research.md, aeo-voice-search.txt
 * 
 * File format:
 * ```
 * # Framework Name (first line)
 * 
 * tags: keyword1, keyword2, keyword3
 * 
 * ## Description (main content - will be embedded)
 * Your detailed description here...
 * This is what gets embedded for semantic search.
 * 
 * ## Structure (optional)
 * - Section 1: Details
 * - Section 2: Details
 * 
 * ## Example (optional)
 * Your example here...
 * ```
 * 
 * Usage: npm run seed:files
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { generateEmbedding } from '../lib/ai/embedding'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

// Load environment variables
config({ path: '.env.local' })

// Validate environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const DOCUMENTS_DIR = join(process.cwd(), 'documents', 'frameworks')

interface ParsedFramework {
  name: string
  category: string
  tags: string[]
  description: string
  structure: string
  example: string
}

/**
 * Parse markdown/text file into framework structure
 */
function parseFile(filename: string, content: string): ParsedFramework | null {
  // Extract category from filename: seo-my-framework.md -> seo
  const match = filename.match(/^(seo|aeo|geo|marketing)-(.+)\.(md|txt)$/)
  if (!match) {
    console.warn(`⚠️  Skipping ${filename} - invalid naming (use: category-name.md)`)
    return null
  }

  const [, category, slug] = match
  const lines = content.split('\n')
  
  // Extract title (first # heading or use slug)
  let name = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const titleLine = lines.find(l => l.trim().startsWith('# '))
  if (titleLine) {
    name = titleLine.replace(/^#\s+/, '').trim()
  }

  // Extract tags
  let tags: string[] = []
  const tagsLine = lines.find(l => l.trim().toLowerCase().startsWith('tags:'))
  if (tagsLine) {
    tags = tagsLine
      .replace(/^tags:/i, '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
  }

  // Split content into sections
  const sections = content.split(/^##\s+/m)
  
  let description = ''
  let structure = ''
  let example = ''

  sections.forEach(section => {
    const sectionLines = section.trim().split('\n')
    const header = sectionLines[0]?.toLowerCase() || ''
    const body = sectionLines.slice(1).join('\n').trim()

    if (header.includes('description') || description === '') {
      // First section or explicit description
      description = body || section.trim()
    } else if (header.includes('structure') || header.includes('sections')) {
      structure = body
    } else if (header.includes('example')) {
      example = body
    }
  })

  // Fallback: use entire content as description if sections not found
  if (!description) {
    description = content
      .replace(/^#.*$/gm, '') // Remove headers
      .replace(/^tags:.*$/gm, '') // Remove tags line
      .trim()
  }

  return {
    name,
    category,
    tags,
    description: description.slice(0, 3000), // Limit for embedding
    structure: structure || 'See description for details',
    example: example || 'N/A'
  }
}

/**
 * Main seeding function
 */
async function seedFromFiles() {
  console.log('\n📁 File-Based Framework Seeding')
  console.log('='.repeat(60))
  console.log(`📂 Reading from: ${DOCUMENTS_DIR}\n`)

  // Read all files from documents/frameworks
  let files: string[]
  try {
    files = await readdir(DOCUMENTS_DIR)
  } catch (error) {
    console.error('❌ Error reading documents directory:', error)
    console.log('\n💡 Create documents/frameworks/ and add your files:')
    console.log('   - seo-your-framework.md')
    console.log('   - aeo-your-framework.txt')
    process.exit(1)
  }

  const markdownFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.txt'))
  
  if (markdownFiles.length === 0) {
    console.log('⚠️  No .md or .txt files found in documents/frameworks/')
    console.log('\n💡 Add files using this naming: category-name.md')
    console.log('   Categories: seo, aeo, geo, marketing')
    process.exit(0)
  }

  console.log(`📄 Found ${markdownFiles.length} file(s)\n`)

  let processed = 0
  let skipped = 0

  for (const filename of markdownFiles) {
    const filePath = join(DOCUMENTS_DIR, filename)
    
    try {
      console.log(`📝 Processing: ${filename}`)
      
      // Read file content
      const content = await readFile(filePath, 'utf-8')
      
      // Parse framework
      const framework = parseFile(filename, content)
      if (!framework) {
        skipped++
        continue
      }

      console.log(`   → Name: ${framework.name}`)
      console.log(`   → Category: ${framework.category}`)
      console.log(`   → Tags: ${framework.tags.join(', ') || 'none'}`)

      // Generate embedding
      console.log(`   → Generating embedding...`)
      const embedding = await generateEmbedding(framework.description)

      // Check if already exists
      const { data: existing } = await supabase
        .from('writing_frameworks')
        .select('id')
        .ilike('name', framework.name)
        .eq('category', framework.category)
        .is('user_id', null)
        .single()

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('writing_frameworks')
          .update({
            description: framework.description,
            structure: { raw: framework.structure },
            example: framework.example,
            tags: framework.tags,
            embedding,
          })
          .eq('id', existing.id)

        if (error) throw error
        console.log(`   ✅ Updated existing framework\n`)
      } else {
        // Insert new
        const { error } = await supabase
          .from('writing_frameworks')
          .insert({
            name: framework.name,
            description: framework.description,
            structure: { raw: framework.structure },
            example: framework.example,
            category: framework.category,
            tags: framework.tags,
            embedding,
            is_custom: false,
            user_id: null,
            usage_count: 0,
          })

        if (error) throw error
        console.log(`   ✅ Created new framework\n`)
      }

      processed++

    } catch (error) {
      console.error(`   ❌ Error processing ${filename}:`, error)
      skipped++
    }
  }

  console.log('='.repeat(60))
  console.log(`✅ Successfully processed: ${processed}`)
  console.log(`⚠️  Skipped: ${skipped}`)
  console.log('='.repeat(60))
}

seedFromFiles().catch(console.error)
