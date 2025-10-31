# AI Image Generation with Gemini 2.5 Flash - Complete Guide

## 🎨 Overview

The SEO chatbot now includes powerful AI image generation capabilities using Google's Gemini 2.5 Flash model. This feature is specifically designed for article writers who need custom, high-quality images for their content.

---

## ✨ Features

### 1. **Gemini 2.5 Flash Integration**
- Powered by Google's latest multimodal model
- Generate images from text prompts
- Edit existing images with natural language
- Support for multiple styles and sizes

### 2. **SEO-Optimized Templates**
Pre-built prompts for common image types:
- **Blog Featured Images** - Professional layouts with keyword integration
- **Social Media Graphics** - Eye-catching, shareable designs
- **Product Showcases** - Commercial-quality product photography
- **Infographics** - Data visualization with charts and graphs
- **How-To Illustrations** - Step-by-step visual guides
- **Comparison Graphics** - Split-screen comparisons

### 3. **Multiple Styles**
- **Realistic** - Photorealistic, professional photography
- **Artistic** - Creative, stylized, digital art
- **Illustrated** - Clean, vector-style, minimal design
- **Photographic** - Natural lighting, high resolution

### 4. **Flexible Sizes**
- **Small** - 512x512 (perfect for thumbnails)
- **Medium** - 1024x1024 (standard blog images)
- **Large** - 1792x1024 (landscape, banners)

---

## 🚀 How to Use

### Option 1: Dedicated Images Page

Visit `/images` to access the full image generation interface:

```typescript
// Navigate to the images page
http://localhost:3000/images
```

**Features:**
- User-friendly interface
- SEO templates
- Style and size selection
- Live preview
- One-click download
- Copy as Markdown

### Option 2: API Integration

Generate images programmatically using the API:

```typescript
// POST /api/images/generate
{
  "action": "generate-gemini",
  "prompt": "Professional blog featured image about SEO tools",
  "style": "realistic",
  "type": "blog",
  "size": "medium"
}
```

### Option 3: Direct Function Calls

Use the library directly in your code:

```typescript
import { generateImageWithGemini, SEOPrompts } from '@/lib/ai/image-generation'

// Generate with custom prompt
const image = await generateImageWithGemini({
  prompt: "Modern SEO dashboard showing keyword rankings",
  style: "realistic",
  type: "blog",
  size: "medium"
})

// Or use SEO templates
const blogImage = await generateImageWithGemini({
  prompt: SEOPrompts.blogFeatured("SEO Tools", ["keyword research", "rank tracking"]),
  style: "realistic",
  type: "blog",
  size: "medium"
})
```

---

## 📁 File Structure

```
lib/ai/image-generation.ts          # Core generation service
├── generateImageWithGemini()       # Main generation function
├── editImageWithGemini()           # Image editing
├── generateImageVariationsWithGemini() # Multiple styles
└── SEOPrompts                      # SEO-optimized templates

app/api/images/generate/route.ts    # API endpoint
├── POST /generate                  # Generate new images
│   ├── generate-gemini             # Gemini 2.5 Flash
│   ├── edit-gemini                 # Edit existing
│   └── variations-gemini           # Multiple styles
├── GET /generate                   # List user images
└── DELETE /generate                # Delete images

components/ui/image-generator.tsx   # React component
└── ImageGenerator                  # Full UI with templates

app/images/page.tsx                 # Dedicated page
└── ImagesPage                      # Complete interface
```

---

## 🎯 SEO Templates

### Blog Featured Image
```typescript
SEOPrompts.blogFeatured(topic, keywords)
// Example:
// "Professional blog featured image for: SEO Tools.
// Include keywords: keyword research, rank tracking.
// Clean, modern design with space for text overlay."
```

### Social Media Share
```typescript
SEOPrompts.socialShare(title, brand?)
// Example:
// "Social media shareable image for: '10 SEO Tips'.
// Brand: YourBrand. Eye-catching, engaging design."
```

### Product Showcase
```typescript
SEOPrompts.productShowcase(product, features?)
// Example:
// "Product showcase image for: SEO Software.
// Features: keyword research, rank tracking, analytics.
// Clean white background, commercial quality."
```

### Infographic
```typescript
SEOPrompts.infographic(topic, dataPoints?)
// Example:
// "Infographic about: SEO Statistics.
// Data: 75% of users never scroll past first page.
// Clean data visualization, informative design."
```

### How-To Illustration
```typescript
SEOPrompts.howTo(title, steps?)
// Example:
// "How-to illustration for: Set Up Google Analytics.
// Steps: create account, install code, configure goals.
// Step-by-step visual guide."
```

### Comparison
```typescript
SEOPrompts.comparison(item1, item2, category)
// Example:
// "Comparison between SEMrush vs Ahrefs in SEO tools.
// Split-screen layout, clear differentiation."
```

---

## 💡 Use Cases

### 1. **Blog Articles**
Generate featured images that match your content:
```typescript
await generateImageWithGemini({
  prompt: SEOPrompts.blogFeatured(
    "Complete Guide to SEO in 2024",
    ["SEO", "search optimization", "rankings"]
  ),
  style: "realistic",
  type: "blog",
  size: "large"
})
```

### 2. **Social Media**
Create engaging graphics for sharing:
```typescript
await generateImageWithGemini({
  prompt: SEOPrompts.socialShare(
    "5 SEO Tips to Boost Your Rankings",
    "YourBrand"
  ),
  style: "artistic",
  type: "social",
  size: "medium"
})
```

### 3. **Product Pages**
Showcase products professionally:
```typescript
await generateImageWithGemini({
  prompt: SEOPrompts.productShowcase(
    "SEO Audit Tool",
    ["crawl errors", "keyword analysis", "backlink check"]
  ),
  style: "photographic",
  type: "product",
  size: "large"
})
```

### 4. **Content Marketing**
Create infographics for data:
```typescript
await generateImageWithGemini({
  prompt: SEOPrompts.infographic(
    "SEO Statistics 2024",
    [
      "75% users never scroll past first page",
      "60% of searches are mobile",
      "50% of queries are 4+ words"
    ]
  ),
  style: "illustrated",
  type: "infographic",
  size: "large"
})
```

---

## 🔧 Advanced Features

### Image Variations
Generate the same image in different styles for A/B testing:
```typescript
const variations = await generateImageVariationsWithGemini(
  "SEO dashboard showing keyword rankings",
  ["realistic", "artistic", "illustrated"]
)
// Returns 3 images with different styles
```

### Image Editing
Edit existing images with natural language:
```typescript
const edited = await editImageWithGemini(
  "https://example.com/image.jpg",
  "Add a small logo in the top right corner"
)
// Returns edited version
```

### Batch Generation
Generate multiple images at once:
```typescript
const prompts = [
  "Blog featured image about AI",
  "Social media graphic for AI tools",
  "Product showcase for AI software"
]

const images = await Promise.all(
  prompts.map(prompt => generateImageWithGemini({ prompt }))
)
```

---

## 📊 API Reference

### Generate Image
```typescript
POST /api/images/generate
{
  "action": "generate-gemini",
  "prompt": "string",
  "style": "realistic" | "artistic" | "illustrated" | "photographic",
  "type": "blog" | "social" | "product" | "infographic" | "custom",
  "size": "small" | "medium" | "large"
}

// Response
{
  "success": true,
  "data": {
    "id": "gemini-1234567890",
    "data": "Uint8Array",
    "mediaType": "image/png",
    "prompt": "...",
    "timestamp": 1234567890
  }
}
```

### Edit Image
```typescript
POST /api/images/generate
{
  "action": "edit-gemini",
  "imageUrl": "https://...",
  "editPrompt": "Add text overlay: 'SEO Tips'"
}

// Response: Same as generate
```

### Generate Variations
```typescript
POST /api/images/generate
{
  "action": "variations-gemini",
  "basePrompt": "SEO dashboard",
  "styles": ["realistic", "artistic"]
}

// Response
{
  "success": true,
  "data": [
    { /* image 1 */ },
    { /* image 2 */ }
  ]
}
```

---

## 🎨 Best Practices

### 1. **Write Detailed Prompts**
❌ Bad: "SEO image"
✅ Good: "Professional SEO dashboard showing keyword rankings chart with clean modern design"

### 2. **Use SEO Keywords**
Include relevant keywords naturally in your prompt for better optimization:
```typescript
SEOPrompts.blogFeatured("Keyword Research Guide", ["keyword research", "SEO tools", "search optimization"])
```

### 3. **Match Style to Content**
- **Realistic** - Professional content, business topics
- **Artistic** - Creative articles, design content
- **Illustrated** - Technical guides, how-tos
- **Photographic** - Product showcases, lifestyle content

### 4. **Choose Appropriate Sizes**
- **Small** - Thumbnails, social media posts
- **Medium** - Blog featured images, inline content
- **Large** - Banners, infographics, detailed visuals

### 5. **Use Templates**
Start with SEO templates for faster, consistent results:
```typescript
// Instead of writing from scratch
const prompt = SEOPrompts.blogFeatured("Your Topic", ["keyword1", "keyword2"])

// Then customize
generateImageWithGemini({
  prompt: prompt + " with blue color scheme",
  style: "realistic"
})
```

---

## 🚀 Integration Examples

### In a React Component
```tsx
import { useState } from 'react'
import { generateImageWithGemini } from '@/lib/ai/image-generation'

export function MyComponent() {
  const [image, setImage] = useState<string | null>(null)

  const handleGenerate = async () => {
    const result = await generateImageWithGemini({
      prompt: "SEO dashboard",
      style: "realistic",
      type: "blog",
      size: "medium"
    })

    const blob = new Blob([result.data], { type: result.mediaType })
    setImage(URL.createObjectURL(blob))
  }

  return (
    <div>
      <button onClick={handleGenerate}>Generate</button>
      {image && <img src={image} alt="Generated" />}
    </div>
  )
}
```

### In a Next.js API Route
```typescript
// app/api/my-route/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateImageWithGemini } from '@/lib/ai/image-generation'

export async function POST(req: NextRequest) {
  const { topic } = await req.json()

  const image = await generateImageWithGemini({
    prompt: SEOPrompts.blogFeatured(topic, [topic]),
    style: 'realistic',
    type: 'blog',
    size: 'large'
  })

  return NextResponse.json({
    success: true,
    imageId: image.id,
    prompt: image.prompt
  })
}
```

---

## 📈 Benefits for Article Writers

### 1. **Save Time**
- No need to search for stock images
- Generate custom images in seconds
- Multiple variations instantly

### 2. **Brand Consistency**
- Control over style and colors
- Match your brand voice
- Consistent look and feel

### 3. **SEO Optimized**
- Templates designed for SEO
- Keyword integration
- Professional appearance

### 4. **Cost Effective**
- No stock image subscriptions
- Unlimited generation
- High-quality results

### 5. **No Attribution Required**
- Fully custom images
- No licensing issues
- Complete ownership

---

## 🔥 Example Workflow

### Blog Article Creation

1. **Write Your Article**
   - Create content about "SEO Tools Comparison"
   - Identify key keywords: "SEO tools", "rank tracking", "keyword research"

2. **Generate Featured Image**
   ```typescript
   await generateImageWithGemini({
     prompt: SEOPrompts.blogFeatured(
       "Best SEO Tools Compared",
       ["SEO tools", "rank tracking", "keyword research"]
     ),
     style: "realistic",
     type: "blog",
     size: "large"
   })
   ```

3. **Create Social Media Graphics**
   ```typescript
   await generateImageWithGemini({
     prompt: SEOPrompts.socialShare(
       "Top 10 SEO Tools of 2024",
       "YourBrand"
     ),
     style: "artistic",
     type: "social",
     size: "medium"
   })
   ```

4. **Add Infographics**
   ```typescript
   await generateImageWithGemini({
     prompt: SEOPrompts.infographic(
       "SEO Statistics 2024",
       [
         "75% users never scroll past first page",
         "Mobile searches increased 200%",
         "Video content gets 50% more engagement"
       ]
     ),
     style: "illustrated",
     type: "infographic",
     size: "large"
   })
   ```

5. **Download and Use**
   - One-click download
   - Copy as Markdown
   - Ready to use in your CMS

---

## 🎉 Summary

The AI Image Generation feature provides:

✅ **Gemini 2.5 Flash Integration** - Latest AI model
✅ **SEO-Optimized Templates** - Pre-built prompts
✅ **Multiple Styles** - Realistic, artistic, illustrated, photographic
✅ **Flexible Sizes** - Small, medium, large
✅ **Easy to Use** - Simple API and UI
✅ **Fast Generation** - Quick results
✅ **No Attribution** - Fully custom images
✅ **Perfect for Writers** - Designed for content creators

**Total Files Added/Modified:**
- 1 core service file
- 1 API route (updated)
- 1 React component
- 1 dedicated page
- 1 documentation file

**Access the feature:**
- UI: `/images`
- API: `/api/images/generate`
- Functions: `lib/ai/image-generation.ts`

Start generating custom images for your articles today! 🚀
