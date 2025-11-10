# Content Quality & Generation APIs

This document describes the Winston AI and Rytr integrations for content quality validation and SEO-optimized content generation.

## Overview

The platform now includes two powerful content APIs:

1. **Winston AI** - Plagiarism detection and AI content detection
2. **Rytr AI** - SEO-optimized content generation with tone control

These APIs are integrated into the chat interface as AI SDK tools and are also available via REST endpoints.

---

## Winston AI Integration

Winston AI provides plagiarism detection and AI content detection to ensure content originality and SEO compliance.

### Features

- **Plagiarism Detection**: Real-time plagiarism checking with source identification
- **AI Content Detection**: Detect if content is AI-generated
- **Multilingual Support**: Check content in multiple languages
- **SEO Validation**: Combined plagiarism + AI detection for SEO compliance

### API Endpoints

#### POST `/api/content/validate`

Validate content for SEO compliance.

**Request:**
```json
{
  "text": "Your content to validate...",
  "checkAi": true
}
```

**Response:**
```json
{
  "success": true,
  "validation": {
    "isValid": true,
    "plagiarismScore": 5,
    "aiScore": 15,
    "issues": [],
    "recommendations": []
  }
}
```

### Chat Tools

Winston AI tools are available in the chat interface:

#### `validate_content`
Validate content for SEO compliance (plagiarism + AI detection).

**Example:**
```
User: "Validate this content for SEO: [paste content]"
```

#### `check_plagiarism`
Check content for plagiarism and duplicate sources.

**Example:**
```
User: "Check this for plagiarism: [paste content]"
```

#### `check_ai_content`
Detect if content is AI-generated.

**Example:**
```
User: "Is this AI-generated? [paste content]"
```

### Usage in Code

```typescript
import { validateContentForSEO, checkPlagiarism } from '@/lib/external-apis/winston-ai'

// Validate content for SEO
const validation = await validateContentForSEO(text)
console.log('Is valid:', validation.isValid)
console.log('Issues:', validation.issues)
console.log('Recommendations:', validation.recommendations)

// Check plagiarism only
const plagiarismResult = await checkPlagiarism({
  text,
  language: 'en',
  checkAiContent: true,
})
console.log('Plagiarism score:', plagiarismResult.score)
console.log('Sources:', plagiarismResult.sources)
```

---

## Rytr AI Integration

Rytr AI provides SEO-optimized content generation with tone and style control.

### Features

- **SEO Content Generation**: Blog posts, articles, meta descriptions
- **Tone Control**: 20+ tones (informative, casual, formal, enthusiastic, etc.)
- **Content Improvement**: Improve and expand existing content
- **Meta Generation**: Auto-generate meta titles and descriptions
- **Variations**: Generate multiple content variations for A/B testing

### API Endpoints

#### POST `/api/content/rytr`

Generate or improve content using Rytr AI.

**Actions:**

1. **generate_seo_content** - Generate complete SEO content
2. **generate_blog_section** - Generate blog section
3. **generate_meta_title** - Generate meta title
4. **generate_meta_description** - Generate meta description
5. **improve_content** - Improve existing content
6. **expand_content** - Expand content with more details
7. **generate_variations** - Generate content variations

**Example Request (SEO Content):**
```json
{
  "action": "generate_seo_content",
  "topic": "How to Rank on ChatGPT",
  "keywords": ["ChatGPT SEO", "AI search optimization", "GEO"],
  "tone": "informative"
}
```

**Response:**
```json
{
  "success": true,
  "content": "Generated blog content...",
  "metaTitle": "How to Rank on ChatGPT: Complete SEO Guide",
  "metaDescription": "Learn proven strategies to optimize...",
  "variations": ["Variation 1...", "Variation 2..."]
}
```

**Example Request (Improve Content):**
```json
{
  "action": "improve_content",
  "text": "Your existing content...",
  "tone": "professional"
}
```

### Chat Tools

Rytr AI tools are available in the chat interface:

#### `generate_seo_content`
Generate complete SEO-optimized content with meta tags.

**Example:**
```
User: "Generate SEO content about 'AI-powered SEO tools' targeting keywords: AI SEO, SEO automation, AI optimization"
```

#### `generate_blog_section`
Generate a blog section about a specific topic.

**Example:**
```
User: "Write a blog section about 'keyword research best practices' with keywords: keyword research, SEO keywords, search volume"
```

#### `generate_meta_title`
Generate SEO-optimized meta title.

**Example:**
```
User: "Generate a meta title for 'AI SEO Tools Guide' with keyword 'AI SEO tools'"
```

#### `generate_meta_description`
Generate SEO-optimized meta description.

**Example:**
```
User: "Generate meta description for 'Complete SEO Guide' with keywords: SEO guide, SEO tips, search optimization"
```

#### `improve_content`
Improve existing content.

**Example:**
```
User: "Improve this content: [paste content]"
```

#### `expand_content`
Expand content with more details.

**Example:**
```
User: "Expand this section: [paste content]"
```

### Usage in Code

```typescript
import {
  generateSEOContent,
  generateBlogSection,
  improveContent,
} from '@/lib/external-apis/rytr'

// Generate complete SEO content
const seoContent = await generateSEOContent({
  topic: 'How to Rank on ChatGPT',
  keywords: ['ChatGPT SEO', 'AI optimization'],
  tone: 'informative',
})
console.log('Content:', seoContent.content)
console.log('Meta Title:', seoContent.metaTitle)
console.log('Meta Description:', seoContent.metaDescription)

// Generate blog section
const blogSection = await generateBlogSection(
  'Keyword Research Best Practices',
  ['keyword research', 'SEO keywords'],
  'professional'
)
console.log('Blog section:', blogSection)

// Improve content
const improved = await improveContent(existingContent, 'informative')
console.log('Improved:', improved)
```

---

## Available Tones

Rytr supports the following tones:

- `informative` - Clear, educational content
- `casual` - Relaxed, conversational style
- `formal` - Professional, business-appropriate
- `enthusiastic` - Energetic, exciting
- `professional` - Expert, authoritative
- `friendly` - Warm, approachable
- `urgent` - Time-sensitive, action-oriented
- `inspirational` - Motivational, uplifting
- `humorous` - Light, entertaining
- `convincing` - Persuasive, compelling

---

## Best Practices

### Content Generation Workflow

1. **Generate** content using Rytr with appropriate tone and keywords
2. **Validate** content using Winston AI for plagiarism and AI detection
3. **Improve** content based on validation recommendations
4. **Re-validate** to ensure SEO compliance

### Example Workflow in Chat

```
User: "Generate SEO content about 'AI SEO tools' with keywords: AI SEO, automation, optimization"
