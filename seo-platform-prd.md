# Product Requirements Document: AI-Powered SEO & Content Creation Platform

## Executive Summary
An intelligent SEO and content creation platform that combines competitive analysis, keyword research, and AI-powered writing to help businesses create optimized content that ranks. The platform uses a conversational AI interface powered by Vercel AI SDK, with RAG technology for customizable writing frameworks, automated brand voice extraction, and direct CMS integration for seamless publishing.

## Product Vision
**Mission:** Empower businesses of all sizes to compete in search rankings by democratizing enterprise-level SEO tools and AI content creation through an intuitive conversational interface.

**Value Proposition:** A comprehensive platform that eliminates the complexity of SEO by automatically analyzing competitors, identifying keyword opportunities, understanding brand voice, and generating publication-ready content—all through natural conversation with an AI assistant.

## User Personas

### Primary Persona: Small Business Owner / Marketing Manager
- **Goals:** Improve search rankings, drive organic traffic, create consistent content
- **Pain Points:** Limited SEO knowledge, time constraints, expensive agency costs, inconsistent brand voice, overwhelmed by complex tools
- **Tech Savviness:** Moderate
- **Preference:** Conversational guidance over forms and dashboards

### Secondary Persona: Content Marketer / SEO Specialist
- **Goals:** Scale content production, identify untapped opportunities, maintain quality at volume
- **Pain Points:** Manual research processes, coordinating multiple tools, maintaining brand consistency
- **Tech Savviness:** High
- **Preference:** Efficiency with option for advanced controls

### Tertiary Persona: Agency Professional
- **Goals:** Manage multiple clients efficiently, demonstrate ROI, deliver consistent results
- **Pain Points:** Tool fragmentation, client onboarding overhead, reporting complexity
- **Tech Savviness:** Very High
- **Preference:** Quick switching between clients, bulk operations

---

## Core Features & User Journey

## Phase 0: Landing Page Experience

### Hero Section
**Layout:**
- Full-screen hero with gradient background (purple-blue AI theme)
- Animated typing effect showing different use cases:
  - "Find untapped keyword opportunities in your niche..."
  - "Generate SEO-optimized content in minutes..."
  - "Outrank your competitors with AI-powered insights..."
  - "Automate your content strategy end-to-end..."

**Primary Headline:** "Your AI SEO Assistant That Actually Ranks"

**Subheadline:** "Just talk to us. We'll analyze your competitors, find opportunities, and create content that ranks—all in one conversation."

**CTA Buttons:**
- Primary: "Start Free" (opens signup modal)
- Secondary: "Watch 2-Min Demo" (inline video player)

**Trust Signals:**
- "No credit card required"
- "5-minute setup"
- Social proof: "Join 2,000+ businesses ranking higher"

### Feature Highlights Section
**Three-column layout with icons:**

1. **Talk, Don't Type Forms**
   - "Our AI assistant guides you through setup like a conversation, not a questionnaire"
   - Icon: Chat bubble with sparkles

2. **Instant Competitor Intelligence**
   - "We analyze your competitors' strategies while you chat, finding gaps you can exploit"
   - Icon: Target with magnifying glass

3. **Publish-Ready Content**
   - "Generate optimized articles that match your brand voice and connect directly to your CMS"
   - Icon: Document with checkmark

### How It Works (Animated Timeline)
**Horizontal scroll/fade sequence:**

1. **Sign Up & Chat** → "Tell our AI about your business in a natural conversation"
2. **We Analyze Everything** → "While you answer a few questions, we're crawling competitors, finding keywords, learning your voice"
3. **Get Opportunities** → "Receive personalized content opportunities ranked by potential impact"
4. **Create & Publish** → "Generate optimized content and publish directly to your site"

### Social Proof Section
- Customer testimonials (3-4 cards)
- Before/after metrics (traffic increases)
- Logos of businesses using the platform

### Pricing Teaser
- "Start Free, Scale As You Grow"
- Simple 3-tier preview (Free → Pro → Agency)
- Link to full pricing page

### Final CTA Section
- **Headline:** "Ready to Rank Higher?"
- **Subtext:** "Your AI SEO assistant is waiting to help you outrank competitors"
- **CTA:** "Get Started Free" → Opens signup

### Footer
- Links: Features, Pricing, Blog, Documentation, API
- Legal: Privacy Policy, Terms of Service
- Social media links

---

## Phase 1: Conversational Onboarding (5-7 minutes)

### Entry Point: Post-Signup
**User Flow:**
1. User signs up (email/password or OAuth via Supabase Auth)
2. Email verification (if required)
3. Immediately redirected to `/onboarding` chat interface

### Onboarding Interface Layout

**Top Bar (Fixed):**
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]                                     [Profile Icon]  │
└─────────────────────────────────────────────────────────────┘
```

**Progress Indicator (Fixed below top bar):**
```
┌─────────────────────────────────────────────────────────────┐
│  ●━━━━━ ○━━━━━ ○━━━━━ ○━━━━━ ○━━━━━ ○                      │
│  Step 1  Step 2  Step 3  Step 4  Step 5  Complete           │
│  Business Profile                                            │
│                                                              │
│  [████████░░░░░░░░░░░░░░░░░░░░] 20% Complete                │
└─────────────────────────────────────────────────────────────┘
```

**Steps:**
1. **Business Profile** (Brand basics)
2. **Brand Voice** (Social media analysis)
3. **Competition** (Competitor identification)
4. **Goals & Targeting** (SEO objectives)
5. **Integration** (CMS connection)
6. **Complete** (Summary & launch)

**Chat Interface (Main Area):**
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  [Chat messages scroll area]                                │
│  - AI assistant messages (left-aligned, purple bubble)      │
│  - User responses (right-aligned, gray bubble)              │
│  - Rich interactive components (centered)                   │
│                                                              │
│                                                              │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Type your message...                      [Send →] │     │
│  └────────────────────────────────────────────────────┘     │
│  [Skip this step]                                           │
└─────────────────────────────────────────────────────────────┘
```

---

### Step 1: Business Profile (20% → 40%)

**AI Opening Message:**
```
👋 Hi! I'm your AI SEO assistant. I'm here to help you rank higher in Google 
and create content that actually converts.

Let's start simple—what's your website URL? I'll take a look and learn about 
your business.
```

**User Input:**
- Text field with URL validation
- Example: "https://yourwebsite.com"

**AI Response (After URL submission):**
```
✓ Great! I'm analyzing yourwebsite.com now...

[Loading animation: "Crawling your site..."]
[Loading animation: "Analyzing content..."]
[Loading animation: "Detecting industry..."]

✓ Done! I can see you're in the [detected industry] space. 

Here's what I found:
• Industry: E-commerce - Sustainable Fashion
• Current Pages: 47
• Existing Blog Posts: 12
• Primary Topics: Organic clothing, eco-friendly materials

Does this look right? (Yes / Let me correct something)
```

**If user confirms:**
```
Perfect! Now, what are your primary business goals? Select all that apply:

[Interactive card selection - multi-select with visual feedback]
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 🎯 Generate  │ │ 📈 Increase  │ │ 🌍 Enter New │
│    Leads     │ │   Traffic    │ │   Markets    │
└──────────────┘ └──────────────┘ └──────────────┘
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 🏆 Outrank   │ │ 📍 Local SEO │ │ 💼 Build     │
│ Competitors  │ │              │ │    Authority │
└──────────────┘ └──────────────┘ └──────────────┘

[Selected cards have checkmarks and purple border]
```

**After goal selection:**
```
Excellent choices! And where are most of your customers located?

[Interactive location picker]
Primary Location: [Dropdown: Country] → [Region/State] → [City (optional)]

☑ I serve multiple locations (adds additional location fields)
☑ I operate internationally

[Continue button appears when at least one location selected]
```

**AI Confirmation:**
```
✓ Step 1 Complete!

Here's your business profile:
• Website: yourwebsite.com
• Industry: Sustainable Fashion E-commerce
• Goals: Generate leads, Increase traffic, Build authority
• Location: United States → California → San Francisco

Ready to move on? I'll help you capture your unique brand voice next.

[Continue to Step 2 →]
```

**Progress updates to 40%**

---

### Step 2: Brand Voice Extraction (40% → 60%)

**AI Message:**
```
Now for the fun part—teaching me to write like you! 🎨

I can learn your brand's voice by analyzing your social media posts. This way, 
any content I create will sound authentically like your brand.

Which platforms would you like me to analyze?

[Social media connection cards]
┌─────────────────┐ ┌─────────────────┐
│  [LinkedIn]     │ │   [Twitter/X]   │
│  ☐ Connect      │ │  ☐ Connect      │
└─────────────────┘ └─────────────────┘
┌─────────────────┐ ┌─────────────────┐
│  [Instagram]    │ │   [Facebook]    │
│  ☐ Connect      │ │  ☐ Connect      │
└─────────────────┘ └─────────────────┘

Or paste profile URLs manually:
[Text input with validation]

⚠️ Don't have social media? [Answer a few questions instead]
```

**If user connects via OAuth (Supabase Auth):**
```
[OAuth modal opens]
→ User authorizes
→ Returns to chat

✓ Connected to LinkedIn!

[Loading animation: "Reading your recent posts..."]
[Loading animation: "Analyzing tone and style..."]
[Loading animation: "Building your voice profile..."]

✓ Analysis complete! Here's what I learned:

📊 Voice Analysis:
• Tone: Professional yet approachable
• Style: Educational with storytelling elements
• Common themes: Sustainability, transparency, craftsmanship
• Personality: Authentic, passionate, informative

Sample phrases I noticed:
• "We believe in radical transparency"
• "Made with love, made to last"
• "Fashion that doesn't cost the earth"

Does this capture your brand voice? 
[Yes, perfect!] [Needs adjustment] [Start over]
```

**If user clicks "Needs adjustment":**
```
No problem! Help me understand what to adjust:

Should I be more:
• Formal ←─────●─────→ Casual
• Technical ←─────●─────→ Simple
• Serious ←─────●─────→ Playful

Any specific words or phrases I should always use?
[Text area]

Any words or phrases I should never use?
[Text area]
```

**If user skips social media:**
```
No worries! Let me ask you directly:

1. How would you describe your brand's personality in 3 words?
[Text input]

2. If your brand were a person, who would they be?
• A trusted advisor
• An enthusiastic friend
• A knowledgeable expert
• A bold innovator
• Something else: [Text input]

3. Show me an example of content that sounds like your brand:
[Text area]
```

**AI Confirmation:**
```
✓ Step 2 Complete!

Your brand voice profile is saved. I'll use this to ensure all content I 
create matches your unique style.

Next up: Let's see who you're competing against 👀

[Continue to Step 3 →]
```

**Progress updates to 60%**

---

### Step 3: Competitor Intelligence (60% → 75%)

**AI Message:**
```
Time to understand your competitive landscape! 🔍

I can automatically find your main competitors by analyzing who ranks for 
similar keywords in your industry.

[Start Automatic Analysis] 

Or if you already know your competitors, add them manually:
[+ Add competitor URL]
```

**If user clicks "Start Automatic Analysis":**
```
[Loading animation: "Analyzing your industry..."]
[Loading animation: "Finding competitor keywords..."]
[Loading animation: "Ranking by relevance..."]

✓ Found your top competitors!

I analyzed the search landscape and found these businesses competing for 
the same keywords as you:

[Competitor cards - scrollable horizontal list]
┌─────────────────────────────────────────┐
│  everlane.com                      ☑    │
│  ─────────────────────────────────      │
│  Domain Authority: 72               │
│  Shared Keywords: 847               │
│  Monthly Traffic: ~2.1M             │
│  Content Frequency: 3x/week         │
│                                         │
│  Top Ranking Keywords:              │
│  • sustainable clothing (Position 3) │
│  • ethical fashion (Position 2)     │
│  • organic cotton (Position 5)      │
└─────────────────────────────────────────┘

[5-8 similar cards with checkboxes]

☑ Select all  |  [✓ 4 selected]

I recommend tracking your top 5-10 competitors. Ready to move forward?

[Add more manually] [Continue with selected →]
```

**If user adds manually:**
```
Great! Paste competitor URLs below (one per line):

[Text area with URL validation]
patagonia.com
reformation.com

[Analyzing button]

[After analysis, shows same competitor cards as above]
```

**AI Follow-up:**
```
Perfect! I'll monitor these competitors for:
• New content they publish
• Keywords they start ranking for
• Backlinks they acquire
• Content gaps you can exploit

You can always add or remove competitors later from your dashboard.

[Continue to Step 4 →]
```

**Progress updates to 75%**

---

### Step 4: Goals & Targeting (75% → 85%)

**AI Message:**
```
Almost there! Let's fine-tune your targeting. 🎯

What types of content do you want to create? (Select all that apply)

[Multi-select cards with icons]
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 📝 Blog      │ │ 🛍️ Product   │ │ 📄 Landing   │
│    Posts     │ │    Pages     │ │    Pages     │
└──────────────┘ └──────────────┘ └──────────────┘
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ ❓ FAQs      │ │ 📊 Compare   │ │ 📚 Guides    │
│              │ │    Articles  │ │              │
└──────────────┘ └──────────────┘ └──────────────┘

---

And what's your content creation frequency?

○ Daily (High volume, need automation)
○ 2-3 times/week (Steady publishing)
○ Weekly (Quality over quantity)
○ Bi-weekly (Limited resources)
○ As needed (Ad-hoc basis)

---

Finally, do you want to focus on specific topics or let me recommend 
opportunities?

○ Show me all opportunities (I'll find the best keywords)
○ Focus on specific topics: [Text input: e.g., "vegan leather, recycling"]

```

**AI Confirmation:**
```
✓ Perfect! Here's your content strategy:

Content Types: Blog posts, Product pages, Guides
Publishing: 2-3 times per week
Focus: All opportunities (AI-recommended)

I'll prioritize keywords with:
• High search volume
• Low-to-medium competition
• Strong buyer intent
• Topics your competitors are missing

One more step—let's connect your website for publishing! 

[Continue to Step 5 →]
```

**Progress updates to 85%**

---

### Step 5: CMS Integration (85% → 95%)

**AI Message:**
```
Last step! Let's connect your website so I can publish content directly. 🚀

What platform is your website built on?

[Platform selection cards - auto-detect if possible]
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   WordPress     │ │    Webflow      │ │    Shopify      │
│   [Connect]     │ │   [Connect]     │ │   [Connect]     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    HubSpot      │ │   Custom CMS    │ │   Not sure      │
│   [Connect]     │ │   [Connect]     │ │   [Skip]        │
└─────────────────┘ └─────────────────┘ └─────────────────┘

⚠️ Don't want to connect now? You can export content manually later.
[Skip this step]
```

**If user selects WordPress:**
```
Great! To connect WordPress, I'll need:

1. Install our plugin (automatic):
   [Download WP Plugin] 
   → Upload to WordPress at Plugins → Add New → Upload Plugin

2. Or connect via Application Password:
   
   Your WordPress URL:
   [Text input: https://yoursite.com]
   
   Username:
   [Text input]
   
   Application Password:
   [Password input]
   [How to create an application password?]

[Test Connection]
```

**If connection successful:**
```
✓ Connected to yourwebsite.com!

Publishing preferences:
☑ Save as Draft (you review before publishing)
○ Publish Immediately

Default Category:
[Dropdown: Blog, News, Resources, etc.]

Default Author:
[Dropdown: Admin, Editor, etc.]

[Save Preferences]
```

**If user selects "Webflow" (OAuth):**
```
[OAuth modal opens]
→ User authorizes Webflow integration
→ Returns to chat

✓ Connected to Webflow!

Select your site:
[Dropdown: List of user's Webflow sites]

Default collection for blog posts:
[Dropdown: Blog Posts, Articles, Resources]

[Save Preferences]
```

**If user skips:**
```
No problem! You can still:
• Export content as Google Docs
• Download as HTML/Markdown
• Copy and paste directly

You can connect your CMS anytime from Settings.

[Continue to Complete →]
```

**Progress updates to 95%**

---

### Step 6: Onboarding Complete (95% → 100%)

**AI Message:**
```
🎉 You're all set! Here's what we've accomplished:

┌─────────────────────────────────────────────────────────────┐
│  Your SEO Command Center                                    │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  ✓ Business Profile                                         │
│    yourwebsite.com • Sustainable Fashion • San Francisco    │
│                                                              │
│  ✓ Brand Voice                                              │
│    Professional yet approachable • Storytelling style       │
│                                                              │
│  ✓ Competitor Tracking                                      │
│    4 competitors monitored • 2,100+ shared keywords         │
│                                                              │
│  ✓ Content Strategy                                         │
│    Blog posts • 2-3x/week • AI-optimized opportunities      │
│                                                              │
│  ✓ CMS Integration                                          │
│    WordPress connected • Auto-save as drafts                │
│                                                              │
└─────────────────────────────────────────────────────────────┘

While we were chatting, I've been working behind the scenes:

[Real-time status cards]
┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
│ ✓ Analyzed         │ │ ✓ Found            │ │ ✓ Identified       │
│   Competitors      │ │   Keywords         │ │   Quick Wins       │
│   4 sites crawled  │ │   847 opportunities│ │   12 ready to rank │
└────────────────────┘ └────────────────────┘ └────────────────────┘

Your Opportunities Dashboard:

📊 SEO Health Score: 64/100 (Good foundation!)

Top 3 Quick Wins:
1. 🎯 "sustainable activewear brands" 
   • Volume: 2,400/mo • Difficulty: Medium • You rank #11
   
2. 🎯 "organic cotton vs recycled polyester"
   • Volume: 1,800/mo • Difficulty: Low • Competitors missing this
   
3. 🎯 "ethical fashion guide 2025"
   • Volume: 3,200/mo • Difficulty: Medium • Trending topic

Ready to create your first piece of content?

[View All Opportunities] [Create Content Now] [Take a Tour]
```

**Progress updates to 100%**

**After completion:**
- Confetti animation
- Badge unlock: "🎓 Onboarding Complete"
- Redirect to main dashboard in 3 seconds (or immediately if user clicks button)

---

## Phase 2: Conversational Dashboard Experience

### Layout Transition
After onboarding, user enters the main application with a **persistent AI assistant chat** available at all times.

**Primary Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] [Opportunities] [Content] [Analytics] [🔍]  [👤]    │
└─────────────────────────────────────────────────────────────┘
┌──────────────┬──────────────────────────────────────────────┐
│              │                                               │
│  Sidebar     │         Main Content Area                    │
│  Navigation  │                                               │
│              │                                               │
│  • Dashboard │         [Dashboard widgets/views]            │
│  • Opportun. │                                               │
│  • Content   │                                               │
│  • Analytics │                                               │
│  • Competit. │                                               │
│              │                                               │
│              │                                               │
├──────────────┴──────────────────────────────────────────────┤
│  💬 Chat with AI Assistant                        [Expand]  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Ask me anything...                              [Send] │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**AI Assistant (Minimized state):**
- Fixed bottom bar (like Intercom/Drift)
- Shows avatar + "Ask me anything..."
- Click to expand to full chat panel

**AI Assistant (Expanded state):**
- Slides up to take 50% of screen height
- Full chat history preserved
- Context-aware (knows what page user is on)
- Can trigger actions (create content, run analysis, update settings)

---

### Conversational Interactions Throughout Platform

**Example 1: User lands on Dashboard**

**AI Proactive Message (appears in chat):**
```
Good morning! 👋

I've been analyzing your opportunities overnight. Here's what's new:

• 3 new high-priority keywords found
• Your article "Sustainable Fashion Guide" moved from #12 → #8 🎉
• Competitor "everlane.com" published 2 new articles (gaps we can exploit)

What would you like to focus on today?

[Show me new keywords] [Analyze competitor content] [Create new article]
```

**Example 2: User clicks "Show me new keywords"**

**AI Response:**
```
Here are the 3 hottest opportunities right now:

1. 🔥 "vegan leather alternatives 2025"
   • Search Volume: 4,200/month
   • Difficulty: Low-Medium
   • Your competitors aren't ranking for this yet
   • Est. Traffic: ~850 visits/month if you rank top 5
   
   [Write about this] [Save for later] [More details]

2. 📈 "sustainable fashion statistics"
   • Search Volume: 3,800/month
   • Difficulty: Low
   • You have authority in this topic
   • Quick win: You could rank in 2-4 weeks
   
   [Write about this] [Save for later] [More details]

3. 💎 "circular fashion brands"
   • Search Volume: 2,100/month
   • Difficulty: Medium
   • Trending upward (↑ 40% this quarter)
   • Competitor gap: Everlane ranks #3, you're not on page 1
   
   [Write about this] [Save for later] [More details]

Which one excites you? Or want me to find more?
```

---

## Phase 3: AI-Powered Content Creation (Conversational)

### Trigger Points
1. User clicks "Create Content" from opportunity card
2. User asks AI: "Write an article about sustainable fashion"
3. User types in chat: "I need a blog post"

### Content Creation Conversation Flow

**AI Opening:**
```
Let's create some amazing content! ✍️

What would you like to write about? You can:
• Choose from recommended opportunities
• Enter a custom topic
• Paste a competitor URL to outrank

[Browse opportunities] [Enter topic] [Beat a competitor]
```

**If user enters topic: "vegan leather alternatives"**

**AI Response:**
```
Great topic! I found the keyword "vegan leather alternatives" with:
• 4,200 searches/month
• Low-Medium difficulty
• Strong commercial intent

I also found related keywords:
• "best vegan leather alternatives" (1,800/mo)
• "vegan leather vs real leather" (2,400/mo)
• "sustainable leather alternatives" (3,100/mo)

Should I optimize for all of these, or focus on just the main keyword?

○ Target all related keywords (comprehensive guide)
○ Focus on main keyword only (shorter, focused article)
```

**AI Continues:**
```
Perfect! Now, what type of content works best here?

I analyzed the top 10 results and found:
• Most are How-to Guides (60%)
• Average length: 2,100 words
• Common format: Comparison style with pros/cons

My recommendation:
📋 Comparison Guide + Buyer's Guide hybrid
   "Best Vegan Leather Alternatives 2025: Complete Guide"

Sound good? Or prefer a different angle?

[Use recommended] [Different format] [Show me top competitors]
```

**If user clicks "Show me top competitors":**

**AI Response:**
```
Here's what currently ranks for "vegan leather alternatives":

Top 3 Articles:
1. goodonyou.eco/vegan-leather-alternatives (Position #1)
   • 2,400 words
   • Covers: Mushroom leather, pineapple leather, cork
   • Missing: Cost comparison, durability testing, where to buy
   
2. sustainablejungle.com/sustainable-fashion/vegan-leather (Position #2)
   • 1,900 words
   • Covers: Environmental impact, types of materials
   • Missing: Real product recommendations, care instructions
   
3. treehugger.com/vegan-leather-alternatives (Position #3)
   • 1,600 words
   • Covers: 5 material types
   • Missing: Brand examples, price points, styling tips

💡 Opportunity: None of them have a comprehensive buying guide with actual 
product recommendations and price comparisons. That's your edge!

Should I create an article that fills these gaps?

[Yes, write it] [Adjust approach] [Analyze more competitors]
```

**AI Continues:**
```
Awesome! A few more quick things:

Word count target:
○ Short & scannable (~1,200 words)
● Comprehensive (~2,200 words) ← Recommended for this topic
○ Ultimate guide (~3,500 words)

Include these sections?
☑ Introduction
☑ What is vegan leather? (basics)
☑ Types of vegan leather alternatives (main content)
☑ Comparison table
☑ Best brands and products
☑ Price guide
☑ Care & maintenance
☑ Environmental impact
☑ FAQ section
☑ Conclusion with CTA

Tone & style: Professional yet approachable ✓ (Your brand voice)

Call-to-action:
[Text input: e.g., "Shop our vegan leather collection"]

Ready to generate?

[Generate content] [Adjust settings]
```

**AI Generating Content:**
```
🔨 Creating your article...

[Progress indicators with fun copy]
✓ Researching latest vegan leather innovations...
✓ Analyzing top-ranking competitors...
✓ Querying Perplexity for 2025 statistics...
✓ Building article structure...
✓ Writing introduction...
✓ Creating comparison table...
✓ Writing main sections... (3 of 8 complete)
✓ Generating FAQ section...
✓ Optimizing for SEO...
✓ Adding internal link suggestions...
✓ Creating meta tags...

⏱️ This takes about 90 seconds...

[Cancel generation]
```

**Content Ready:**
```
✨ Your article is ready!

"Best Vegan Leather Alternatives 2025: Complete Buyer's Guide"

📊 SEO Score: 87/100 (Excellent!)

Preview:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Title] Best Vegan Leather Alternatives 2025: Complete Buyer's Guide
[Meta Description preview]
[First paragraph preview...]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Quick Stats:
• Word count: 2,247 words
• Reading time: 9 minutes
• Target keywords: ✓ All included naturally
• Readability: Grade 8 (Perfect for web)
• Internal links: 5 suggestions added
• Images needed: 6 (I've added placeholders)

What would you like to do?

[Edit in full editor] [Publish now] [Save as draft] [Start over]
```

---

### Full Content Editor (If user clicks "Edit in full editor")

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Back] Best Vegan Leather Alternatives...    [Publish ▼]   │
└─────────────────────────────────────────────────────────────┘
┌────────────────────────────────┬────────────────────────────┐
│                                 │  💬 AI Assistant           │
│  Rich Text Editor (WYSIWYG)    │  ────────────────────────  │
│  ────────────────────────────  │                            │
│                                 │  SEO Score: 87/100         │
│  [H1] Best Vegan Leather...    │  ━━━━━━━━━━━━━━━━━━━━     │
│                                 │                            │
│  [Paragraph] Looking for...    │  ✓ Target keyword used     │
│                                 │  ✓ Meta tags optimized     │
│  [H2] What Is Vegan Leather?   │  ✓ Headers structured well │
│                                 │  ⚠ Add 2 more internal links│
│  [Paragraph] Vegan leather...  │                            │
│                                 │  Quick Actions:            │
│  [Image placeholder]            │  • Regenerate section      │
│                                 │  • Expand paragraph        │
│  [H2] Types of Alternatives    │  • Simplify language       │
│                                 │  • Add FAQ item            │
│  [Drag to reorder sections]    │  • Insert image            │
│                                 │                            │
│  [Toolbar: Bold, Italic, Link, │  Ask me anything:          │
│   Image, Heading, List, etc.]  │  [Type here...]   [Send]   │
│                                 │                            │
└────────────────────────────────┴────────────────────────────┘
```

**Conversational Editing Examples:**

**User types in chat:** "Make the introduction more engaging"

**AI Response:**
```
On it! I've rewritten your introduction with a hook:

Old version:
"Looking for vegan leather alternatives? This guide covers everything..."

New version:
"Imagine wearing a jacket made from mushrooms, or carrying a bag crafted 
from pineapple leaves. Sound like science fiction? It's not—welcome to the 
world of vegan leather alternatives..."

[Apply changes] [Try another version] [Keep original]
```

**User types:** "Add a section about cost comparison"

**AI Response:**
```
Great idea! I'll add a new section comparing costs. Where should I place it?

○ After "Types of Alternatives" (recommended)
○ Before the FAQ section
○ At the end before conclusion
○ Let me decide

What should I compare?
☑ Material costs (per square foot)
☑ Product price ranges (bags, shoes, etc.)
☑ Long-term value (durability)
☑ Cost vs. real leather

[Generate section]
```

**User selects text and right-clicks:**
```
[Context menu appears]
• ✨ Rewrite with AI
• 📝 Expand this
• ✂️ Make shorter
• 🎯 Simplify language
• 🔄 Change tone
• 💡 Add examples
```

**User clicks "Rewrite with AI":**

**AI in chat:**
```
I'll rewrite that paragraph for you. Any specific direction?

○ More detailed/technical
○ More conversational
○ Add statistics/data
○ Include storytelling
○ Just make it better

[Or type custom instructions: ________________]
```

---

### Publishing Workflow (Conversational)

**User clicks "Publish" dropdown:**
```
[Dropdown menu]
• ✓ Publish to WordPress now
• 📅 Schedule for later
• 💾 Save as draft in WordPress
• 📤 Export (Docs, HTML, Markdown)
• 🔗 Copy to clipboard
```

**If user selects "Publish to WordPress now":**

**AI Confirmation Dialog:**
```
Ready to publish to yourwebsite.com? 📢

Final checklist:
✓ SEO score: 87/100
✓ All images have alt text
✓ Internal links added (5)
✓ Meta tags optimized
⚠ Featured image not set (optional)
⚠ Categories not assigned (optional)

Settings:
• Status: Published
• Author: Admin
• Category: [Dropdown: Blog, Resources, etc.]
• Tags: vegan leather, sustainable fashion, alternatives
• Featured image: [Upload or skip]

[Publish now] [Cancel]
```

**After publishing:**

**AI Success Message:**
```
🎉 Published successfully!

Your article is now live at:
🔗 yourwebsite.com/blog/vegan-leather-alternatives-2025

What's next?

I can help you:
• 📱 Create social media posts to promote it
• 🔗 Find internal linking opportunities
• 📊 Set up tracking to monitor performance
• ✍️ Write a follow-up article on a related topic

Or just say "thanks" and I'll let you celebrate! 🎊

[Create social posts] [Find linking opportunities] [Dashboard]
```

---

## Phase 4: Conversational Link Building

### Entry via Chat

**User asks:** "How can I get more backlinks?"

**AI Response:**
```
Great question! Backlinks are crucial for SEO. Let me analyze your current 
backlink profile first...

[Analyzing with DataForSEO...]

📊 Your Current Backlink Profile:
• Total backlinks: 347
• Referring domains: 89
• Domain Authority: 34/100
• Quality distribution:
  - High quality: 12 (14%)
  - Medium quality: 54 (61%)
  - Low quality: 23 (25%)

You're doing okay, but there's huge opportunity here! 🚀

I found several strategies that could work for you:

1. 🎯 Competitor Backlinks (Easiest win)
   → 47 sites link to your competitors but not to you
   
2. 🔗 Broken Link Building
   → 23 broken links on high-authority sites in your niche
   
3. 📰 Digital PR Opportunities
   → 8 journalists recently wrote about sustainable fashion
   
4. ✍️ Guest Post Opportunities
   → 12 sites accepting guest posts (DA 40+)

Which strategy interests you most?

[Competitor backlinks] [Broken links] [Digital PR] [Guest posts] [Show all]
```

**User selects: "Competitor backlinks"**

**AI Response:**
```
Smart choice! This is usually the fastest way to get quality links.

I analyzed the backlink profiles of your 4 main competitors and found 47 
websites that link to multiple competitors but NOT to you.

Here are the top opportunities:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. sustainablebrand.com/resources
   • DA: 68 (High authority!)
   • Links to: Everlane, Patagonia, Reformation
   • Type: Resource page
   • Why they'd link to you: You have similar content quality
   • Contact: editor@sustainablebrand.com
   
   [Draft outreach email] [Mark as contacted] [Skip]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. ethicalfashionblog.com/recommended-brands
   • DA: 52
   • Links to: Everlane, Reformation
   • Type: Recommended brands list
   • Why they'd link to you: You fit their criteria perfectly
   • Contact: [Found: Sarah Johnson - sarah@...]
   
   [Draft outreach email] [Mark as contacted] [Skip]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Show next 5 opportunities] [Export all 47]

Want me to draft personalized outreach emails for these?
```

**User clicks: "Draft outreach email" for first opportunity**

**AI Response:**
```
I'll write a personalized outreach email. Give me a moment to research 
their site...

[Analyzing target site...]
[Reading recent articles...]
[Identifying best angle...]

✨ Draft Email:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To: editor@sustainablebrand.com
Subject: Resource suggestion for your sustainable fashion page

Hi [First name],

I've been following Sustainable Brand for a while—your recent article on 
circular fashion initiatives was really insightful.

I noticed your resources page links to Everlane and Patagonia (both great 
choices!). I thought you might be interested in [Your Brand], as we share 
the same commitment to transparency and sustainability.

We recently published a comprehensive guide on vegan leather alternatives 
that your readers might find valuable: [link]

Our approach focuses on [unique angle from your brand voice].

Would this be a good fit for your resources page? Happy to provide any 
additional information.

Best,
[Your name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

How's this? I can:
• Make it shorter/longer
• More casual/formal
• Different angle (mention specific content, offer collaboration, etc.)
• Add more personalization

[Send this] [Revise] [Save as template] [Copy to clipboard]
```

**User sends email:**

**AI Tracking:**
```
✓ Email sent and tracked!

I'll monitor this outreach and remind you to follow up in 7 days if you 
don't hear back.

Status: Awaiting response
Sent: Oct 30, 2025
Follow-up scheduled: Nov 6, 2025

Want to reach out to more opportunities while we wait?

[Draft next email] [View all campaigns] [Back to opportunities]
```

---

## Phase 5: Conversational Analytics

### Proactive AI Updates

**AI sends notification (appears in chat):**
```
📈 Daily Update - Thursday, Oct 30

Good morning! Here's what happened overnight:

WINS 🎉
• "sustainable activewear" moved from #11 → #8 (3 positions!)
• Your article got 127 new visitors yesterday (+23%)
• Gained 2 new backlinks from medium-authority sites

NEEDS ATTENTION ⚠️
• "organic cotton guide" dropped from #5 → #7
• Page speed on mobile dipped to 68/100
• Competitor published new content targeting your keywords

OPPORTUNITIES 💡
• 5 new keyword opportunities found (trending topics)
• 2 broken backlink chances on high-DA sites

What should we tackle first?

[Fix the ranking drop] [Check new keywords] [Improve page speed]
```

**User clicks: "Fix the ranking drop"**

**AI Response:**
```
Let me analyze why "organic cotton guide" dropped...

[Analyzing SERP changes...]
[Comparing to competitors...]
[Checking page metrics...]

📊 Diagnosis:

Your article: yourwebsite.com/organic-cotton-guide
• Current position: #7 (was #5)
• Published: 6 months ago
• Word count: 1,400 words
• Last updated: 6 months ago

What changed:
1. Two competitors updated their content with 2025 data
   - greenmatters.com added new statistics (2,200 words)
   - sustainablejungle.com added video content

2. Your content is getting stale
   - Statistics from 2024 (outdated)
   - Missing recent industry developments
   - Competitors now have fresher content signals

🎯 Recommended actions:

Option 1: Quick Update (30 min)
• Add 2025 statistics
• Update introduction
• Refresh meta description
• Estimated impact: Back to #5-6

Option 2: Comprehensive Refresh (2 hours)
• Expand to 2,000+ words
• Add comparison tables
• Include recent case studies
• Add FAQ section
• Estimated impact: Potential #3-4

Option 3: Complete Rewrite (4 hours)
• New angle that competitors don't have
• Add original research/data
• Multimedia content (infographics, videos)
• Estimated impact: Potential #1-2

Which approach works for you?

[Quick update] [Comprehensive refresh] [Complete rewrite] [Just monitor]
```

**User selects: "Quick update"**

**AI Response:**
```
Smart choice! Let me gather the latest information...

[Querying Perplexity for 2025 organic cotton statistics...]
[Analyzing competitor updates...]
[Preparing content updates...]

✨ I've prepared these updates:

1. New Introduction (replacing old):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Old: "Organic cotton is becoming popular..."

New: "Organic cotton production reached 342,000 tonnes in 2025, marking 
a 23% increase from last year as consumers increasingly demand sustainable 
textiles. Here's everything you need to know about this eco-friendly 
alternative..."
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. Updated Statistics Section:
• Global market size: $2.1B (2025) ← Add
• Top producing countries updated ← Add
• Price comparison 2024 vs 2025 ← Add

3. New Meta Description:
"Complete 2025 guide to organic cotton: latest statistics, environmental 
impact, and how it compares to conventional cotton. Updated with current 
market trends."

4. Additional Updates:
• Refresh "Last updated" date
• Add trending FAQ: "Is organic cotton worth the extra cost in 2025?"
• Update internal links to newer content

Apply all updates?

[Apply all] [Review individually] [Customize]
```

**User clicks: "Apply all"**

**AI Applies Updates:**
```
🔄 Updating your article...

✓ Content updated
✓ Meta tags refreshed
✓ New statistics added
✓ FAQ section expanded
✓ Last modified date updated

Ready to publish?

[Update on WordPress] [Preview changes] [Revert]
```

**User publishes:**

**AI Confirmation:**
```
✓ Published! Your refreshed article is now live.

I'll monitor its performance over the next 7-14 days and report back on 
ranking changes.

Expected timeline:
• 2-3 days: Google recrawls and reindexes
• 7-10 days: Ranking improvements start showing
• 14 days: Full impact visible

Set a reminder?

[Remind me in 1 week] [Remind me in 2 weeks] [I'll check myself]
```

---

## Technical Architecture (Updated with Vercel, Supabase, AI SDK)

### System Stack Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
│  ─────────────────────────────────────────────────────────  │
│  • Next.js 14+ (App Router)                                │
│  • React 18+ with Server Components                        │
│  • TailwindCSS + shadcn/ui                                 │
│  • Vercel AI SDK (chat interface, streaming)               │
│  • TanStack Query (data fetching/caching)                  │
│  • React Hook Form (forms)                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                    API/Backend Layer                        │
│  ─────────────────────────────────────────────────────────  │
│  • Next.js API Routes (REST endpoints)                     │
│  • tRPC (type-safe API calls, optional)                    │
│  • Vercel Edge Functions (low-latency operations)          │
│  • Middleware (auth, rate limiting)                        │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                   Database & Storage                        │
│  ─────────────────────────────────────────────────────────  │
│  • Supabase PostgreSQL (primary database)                  │
│  • pgvector extension (embeddings for RAG)                 │
│  • Supabase Auth (user authentication)                     │
│  • Supabase Storage (file uploads, images)                 │
│  • Supabase Realtime (collaborative features)              │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                    AI & RAG System                          │
│  ─────────────────────────────────────────────────────────  │
│  • Vercel AI SDK (chat completions, streaming)             │
│  • Gemini API (content generation)                         │
│  • pgvector (vector similarity search)                     │
│  • LangChain.js (optional: complex RAG pipelines)          │
│  • Embeddings: text-embedding-004 (Gemini)                 │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                  Background Jobs Layer                      │
│  ─────────────────────────────────────────────────────────  │
│  • Inngest or Trigger.dev (job orchestration)              │
│  • Supabase Edge Functions (alternative for simple jobs)   │
│  • Cron jobs (scheduled tasks)                             │
│  • Queue system for:                                       │
│    - Website crawling                                      │
│    - Competitor monitoring                                 │
│    - Content generation                                    │
│    - Social media extraction                               │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                  External Integrations                      │
│  ─────────────────────────────────────────────────────────  │
│  • DataForSEO (keyword research, competitor analysis)      │
│  • Apify (social media scraping)                           │
│  • Jina (content extraction)                               │
│  • Perplexity (real-time research)                         │
│  • CMS APIs (WordPress, Webflow, Shopify, etc.)            │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                      Hosting Layer                          │
│  ─────────────────────────────────────────────────────────  │
│  • Vercel (Next.js app hosting)                            │
│  • Vercel Edge Network (CDN)                               │
│  • Supabase Cloud (database hosting)                       │
│  • Vercel Blob Storage (alternative for files)             │
└─────────────────────────────────────────────────────────────┘
```

---

### Database Schema (Supabase PostgreSQL)

**Core Tables:**

```sql
-- Users (managed by Supabase Auth)
users (
  id uuid PRIMARY KEY,
  email text UNIQUE,
  created_at timestamp,
  -- Supabase Auth handles this table
)

-- Business Profiles
business_profiles (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  website_url text,
  industry text,
  locations jsonb, -- [{country, region, city}]
  goals jsonb, -- ["increase_traffic", "generate_leads"]
  content_frequency text,
  created_at timestamp,
  updated_at timestamp
)

-- Brand Voice
brand_voices (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  tone text, -- "professional_approachable"
  style text, -- "educational_storytelling"
  personality jsonb,
  sample_phrases text[],
  embedding vector(1536), -- pgvector for similarity search
  source text, -- "social_media", "manual"
  created_at timestamp
)

-- Social Media Connections
social_connections (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  platform text, -- "linkedin", "twitter", "instagram"
  profile_url text,
  access_token text ENCRYPTED,
  posts_analyzed int,
  last_synced_at timestamp,
  created_at timestamp
)

-- Competitors
competitors (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  domain text,
  domain_authority int,
  monthly_traffic bigint,
  priority text, -- "primary", "secondary"
  metadata jsonb, -- {top_keywords, content_frequency}
  created_at timestamp,
  updated_at timestamp
)

-- Keywords
keywords (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  keyword text,
  search_volume int,
  keyword_difficulty int,
  current_ranking int,
  intent text, -- "informational", "commercial", "transactional"
  priority text, -- "high", "medium", "low"
  metadata jsonb, -- {related_keywords, serp_features}
  status text, -- "opportunity", "tracking", "ranked"
  created_at timestamp,
  updated_at timestamp
)

-- Content Library
content (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  title text,
  slug text,
  content_type text, -- "blog_post", "product_page", "landing_page"
  target_keyword text,
  word_count int,
  seo_score int,
  status text, -- "draft", "published", "scheduled"
  published_url text,
  published_at timestamp,
  cms_id text, -- ID in connected CMS
  metadata jsonb, -- {reading_time, readability_score, internal_links}
  created_at timestamp,
  updated_at timestamp
)

-- Content Versions (for revision history)
content_versions (
  id uuid PRIMARY KEY,
  content_id uuid REFERENCES content(id),
  content_html text,
  content_markdown text,
  meta_title text,
  meta_description text,
  version_number int,
  created_by uuid REFERENCES users(id),
  created_at timestamp
)

-- Writing Frameworks (RAG Knowledge Base)
writing_frameworks (
  id uuid PRIMARY KEY,
  name text, -- "AIDA", "PAS", "BAB"
  description text,
  structure jsonb, -- {sections: [...], guidelines: [...]}
  example text,
  embedding vector(1536), -- For RAG retrieval
  is_custom boolean, -- User-created vs. system
  user_id uuid REFERENCES users(id), -- NULL for system frameworks
  usage_count int DEFAULT 0,
  created_at timestamp
)

-- CMS Integrations
cms_integrations (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  platform text, -- "wordpress", "webflow", "shopify"
  site_url text,
  credentials jsonb ENCRYPTED, -- API keys, tokens
  settings jsonb, -- {default_category, author, etc.}
  is_active boolean,
  last_synced_at timestamp,
  created_at timestamp
)

-- Link Building Opportunities
link_opportunities (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  strategy_type text, -- "competitor_backlink", "broken_link", "guest_post"
  target_domain text,
  domain_authority int,
  contact_info jsonb, -- {email, name, role}
  status text, -- "identified", "outreach_sent", "responded", "link_acquired"
  notes text,
  outreach_sent_at timestamp,
  response_received_at timestamp,
  link_acquired_at timestamp,
  created_at timestamp
)

-- Outreach Campaigns
outreach_campaigns (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  link_opportunity_id uuid REFERENCES link_opportunities(id),
  email_subject text,
  email_body text,
  sent_at timestamp,
  opened_at timestamp,
  clicked_at timestamp,
  replied_at timestamp,
  status text, -- "sent", "opened", "clicked", "replied", "bounced"
)

-- Analytics Snapshots (daily rollups)
analytics_snapshots (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  snapshot_date date,
  metrics jsonb, -- {organic_traffic, keyword_rankings, backlinks, etc.}
  created_at timestamp,
  UNIQUE(user_id, snapshot_date)
)

-- Chat History (for conversational interface)
chat_messages (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  role text, -- "user", "assistant", "system"
  content text,
  metadata jsonb, -- {context, actions_taken, etc.}
  created_at timestamp
)

-- Notifications / Tasks
notifications (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  type text, -- "ranking_change", "new_opportunity", "follow_up_reminder"
  title text,
  message text,
  action_url text,
  is_read boolean DEFAULT false,
  created_at timestamp
)
```

---

### AI SDK Implementation Details

**Chat Interface with Vercel AI SDK:**

```typescript
// app/api/chat/route.ts (Next.js API route)
import { streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY
})

export async function POST(req: Request) {
  const { messages, context } = await req.json()
  
  // Retrieve relevant context from RAG system
  const relevantFrameworks = await retrieveFrameworks(context)
  const brandVoice = await getBrandVoice(userId)
  
  // Build enhanced system prompt with context
  const systemPrompt = buildSystemPrompt({
    frameworks: relevantFrameworks,
    brandVoice,
    userContext: context
  })
  
  const result = await streamText({
    model: google('gemini-2.0-flash-exp'),
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    tools: {
      analyzeKeyword: {
        description: 'Analyze keyword opportunity',
        parameters: z.object({
          keyword: z.string()
        }),
        execute: async ({ keyword }) => {
          return await analyzeKeywordWithDataForSEO(keyword)
        }
      },
      generateContent: {
        description: 'Generate SEO-optimized content',
        parameters: z.object({
          keyword: z.string(),
          contentType: z.string(),
          framework: z.string()
        }),
        execute: async (params) => {
          return await generateOptimizedContent(params)
        }
      },
      // More tools...
    }
  })
  
  return result.toDataStreamResponse()
}
```

**RAG System with pgvector:**

```typescript
// lib/rag/retrieve-frameworks.ts
import { createClient } from '@supabase/supabase-js'
import { embed } from 'ai'
import { google } from '@ai-sdk/google'

export async function retrieveFrameworks(query: string) {
  // Generate embedding for query
  const { embedding } = await embed({
    model: google.textEmbeddingModel('text-embedding-004'),
    value: query
  })
  
  // Query pgvector for similar frameworks
  const { data } = await supabase.rpc('match_frameworks', {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: 3
  })
  
  return data
}

// SQL function in Supabase
/*
CREATE FUNCTION match_frameworks (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  name text,
  structure jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $
BEGIN
  RETURN QUERY
  SELECT
    writing_frameworks.id,
    writing_frameworks.name,
    writing_frameworks.structure,
    1 - (writing_frameworks.embedding <=> query_embedding) AS similarity
  FROM writing_frameworks
  WHERE 1 - (writing_frameworks.embedding <=> query_embedding) > match_threshold
  ORDER BY writing_frameworks.embedding <=> query_embedding
  LIMIT match_count;
END;
$;
*/
```

---

### Background Job Architecture

**Using Inngest for orchestration:**

```typescript
// inngest/functions.ts
import { inngest } from './client'

export const analyzeCompetitors = inngest.createFunction(
  { id: 'analyze-competitors' },
  { cron: '0 2 * * *' }, // Daily at 2 AM
  async ({ event, step }) => {
    const users = await step.run('fetch-users', async () => {
      return await fetchActiveUsers()
    })
    
    for (const user of users) {
      await step.run(`analyze-${user.id}`, async () => {
        // Fetch competitor data from DataForSEO
        const competitors = await getCompetitors(user.id)
        
        for (const competitor of competitors) {
          const analysis = await analyzeCompetitorWithDataForSEO(
            competitor.domain
          )
          
          // Store results in Supabase
          await storeCompetitorAnalysis(user.id, competitor.id, analysis)
          
          // Check for new opportunities
          const opportunities = await findNewOpportunities(
            user.id,
            competitor.id,
            analysis
          )
          
          if (opportunities.length > 0) {
            await sendNotification(user.id, {
              type: 'new_opportunities',
              count: opportunities.length
            })
          }
        }
      })
    }
  }
)

export const generateContent = inngest.createFunction(
  { id: 'generate-content' },
  { event: 'content/generate.requested' },
  async ({ event, step }) => {
    const { userId, keyword, framework, settings } = event.data
    
    // Step 1: Research phase
    const research = await step.run('research', async () => {
      const [competitors, trends, data] = await Promise.all([
        analyzeCompetitorContent(keyword),
        getTrendingTopics(keyword),
        fetchRealTimeData(keyword) // Perplexity
      ])
      
      return { competitors, trends, data }
    })
    
    // Step 2: Generate outline
    const outline = await step.run('outline', async () => {
      return await generateOutline({
        keyword,
        framework,
        research,
        brandVoice: await getBrandVoice(userId)
      })
    })
    
    // Step 3: Generate full content
    const content = await step.run('generate', async () => {
      return await generateFullContent({
        outline,
        research,
        settings,
        brandVoice: await getBrandVoice(userId)
      })
    })
    
    // Step 4: SEO optimization
    const optimized = await step.run('optimize', async () => {
      return await optimizeForSEO(content, {
        targetKeyword: keyword,
        competitors: research.competitors,
        internalLinks: await suggestInternalLinks(userId, keyword)
      })
    })
    
    // Step 5: Save to database
    await step.run('save', async () => {
      return await saveContent(userId, {
        content: optimized.html,
        metadata: optimized.metadata,
        seo_score: optimized.score
      })
    })
    
    // Step 6: Notify user
    await step.run('notify', async () => {
      await sendNotification(userId, {
        type: 'content_ready',
        contentId: optimized.id,
        seoScore: optimized.score
      })
    })
  }
)

export const extractBrandVoice = inngest.createFunction(
  { id: 'extract-brand-voice' },
  { event: 'brand-voice/extract.requested' },
  async ({ event, step }) => {
    const { userId, platform, accessToken } = event.data
    
    // Step 1: Extract social media posts
    const posts = await step.run('extract-posts', async () => {
      // Use Apify to scrape posts
      const apifyResult = await runApifyScraper(platform, accessToken)
      return apifyResult.posts.slice(0, 100) // Last 100 posts
    })
    
    // Step 2: Analyze with AI
    const analysis = await step.run('analyze', async () => {
      const prompt = `Analyze these ${posts.length} social media posts and extract:
1. Tone (professional, casual, humorous, technical, etc.)
2. Writing style
3. Common phrases and terminology
4. Personality traits
5. Topics and themes

Posts: ${JSON.stringify(posts.map(p => p.text))}`
      
      const result = await generateText({
        model: google('gemini-2.0-flash-exp'),
        prompt
      })
      
      return JSON.parse(result.text)
    })
    
    // Step 3: Generate embedding
    const voiceEmbedding = await step.run('embed', async () => {
      const voiceDescription = `${analysis.tone}, ${analysis.style}, ${analysis.personality}`
      
      const { embedding } = await embed({
        model: google.textEmbeddingModel('text-embedding-004'),
        value: voiceDescription
      })
      
      return embedding
    })
    
    // Step 4: Save to database
    await step.run('save', async () => {
      await supabase.from('brand_voices').upsert({
        user_id: userId,
        tone: analysis.tone,
        style: analysis.style,
        personality: analysis.personality,
        sample_phrases: analysis.phrases,
        embedding: voiceEmbedding,
        source: 'social_media'
      })
    })
  }
)
```

---

### Frontend Implementation Examples

**Onboarding Progress Component:**

```typescript
// components/onboarding/progress-bar.tsx
'use client'

import { motion } from 'framer-motion'

interface Step {
  id: number
  name: string
  description: string
}

interface ProgressBarProps {
  currentStep: number
  steps: Step[]
}

export function OnboardingProgressBar({ currentStep, steps }: ProgressBarProps) {
  const progress = (currentStep / steps.length) * 100
  
  return (
    <div className="w-full px-8 py-6 bg-white border-b border-gray-200">
      {/* Step Indicators */}
      <div className="flex justify-between items-center mb-4">
        {steps.map((step, index) => {
          const isActive = index + 1 === currentStep
          const isComplete = index + 1 < currentStep
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Circle */}
              <div className="relative">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    font-semibold text-sm transition-all duration-300
                    ${isComplete ? 'bg-purple-600 text-white' : ''}
                    ${isActive ? 'bg-purple-600 text-white ring-4 ring-purple-100' : ''}
                    ${!isActive && !isComplete ? 'bg-gray-200 text-gray-500' : ''}
                  `}
                >
                  {isComplete ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                
                {/* Label */}
                <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <p className={`text-xs font-medium ${isActive ? 'text-purple-600' : 'text-gray-500'}`}>
                    {step.name}
                  </p>
                </div>
              </div>
              
              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 bg-gray-200 mx-2">
                  <motion.div
                    className="h-full bg-purple-600"
                    initial={{ width: '0%' }}
                    animate={{ width: isComplete ? '100%' : '0%' }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Progress Bar */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-medium text-gray-700">
            {steps[currentStep - 1]?.description}
          </p>
          <p className="text-sm font-semibold text-purple-600">
            {Math.round(progress)}% Complete
          </p>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  )
}
```

**Chat Interface Component with AI SDK:**

```typescript
// components/chat/ai-chat-interface.tsx
'use client'

import { useChat } from 'ai/react'
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function AIChatInterface({ context }: { context?: any }) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: { context },
    onFinish: (message) => {
      // Handle any post-message actions
      scrollToBottom()
    }
  })
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[80%] rounded-2xl px-4 py-3
                  ${message.role === 'user'
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-purple-600 text-white'
                  }
                `}
              >
                {/* Render message content */}
                {message.content}
                
                {/* Render any tool calls/actions */}
                {message.toolInvocations?.map((toolInvocation) => (
                  <div key={toolInvocation.toolCallId} className="mt-2">
                    {toolInvocation.state === 'result' && (
                      <ToolResult result={toolInvocation.result} />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-purple-600 text-white rounded-2xl px-4 py-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send →
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send • Shift + Enter for new line
        </p>
      </div>
    </div>
  )
}
```

**Interactive Card Selection Component:**

```typescript
// components/onboarding/card-selector.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface Option {
  id: string
  label: string
  icon: string
  description?: string
}

interface CardSelectorProps {
  options: Option[]
  multiSelect?: boolean
  onSelect: (selected: string[]) => void
}

export function CardSelector({ options, multiSelect = false, onSelect }: CardSelectorProps) {
  const [selected, setSelected] = useState<string[]>([])
  
  const handleSelect = (id: string) => {
    let newSelected: string[]
    
    if (multiSelect) {
      newSelected = selected.includes(id)
        ? selected.filter(s => s !== id)
        : [...selected, id]
    } else {
      newSelected = [id]
    }
    
    setSelected(newSelected)
    onSelect(newSelected)
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {options.map((option) => {
        const isSelected = selected.includes(option.id)
        
        return (
          <motion.button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative p-6 rounded-xl border-2 text-left transition-all
              ${isSelected
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
            `}
          >
            {/* Checkmark */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 right-3 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </motion.div>
            )}
            
            {/* Icon */}
            <div className="text-4xl mb-3">{option.icon}</div>
            
            {/* Label */}
            <h3 className="font-semibold text-gray-900 mb-1">{option.label}</h3>
            
            {/* Description */}
            {option.description && (
              <p className="text-sm text-gray-600">{option.description}</p>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
```

---

### Data Flow Architecture

**Complete User Journey Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│                    User Signs Up                            │
│                                                              │
│  1. Supabase Auth creates user account                      │
│  2. User redirected to /onboarding                          │
│  3. Chat interface loads with welcome message               │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│              Step 1: Business Profile                       │
│                                                              │
│  User → Enters website URL                                  │
│  System → Triggers background job:                          │
│    • Crawl website (Inngest job)                            │
│    • Analyze industry (Gemini API)                          │
│    • Detect content (content_analysis table)                │
│  AI → Presents findings in chat                             │
│  User → Confirms or corrects                                │
│  System → Saves to business_profiles table                  │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│              Step 2: Brand Voice                            │
│                                                              │
│  User → Connects social media (Supabase OAuth)              │
│  System → Triggers extractBrandVoice Inngest function       │
│    • Apify extracts posts                                   │
│    • Gemini analyzes tone/style                             │
│    • Generate embedding (text-embedding-004)                │
│    • Store in brand_voices + pgvector                       │
│  AI → Shows analysis results                                │
│  User → Approves or adjusts                                 │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│              Step 3: Competitors                            │
│                                                              │
│  User → Clicks "Auto-discover" or enters manually           │
│  System → DataForSEO API call:                              │
│    • Find domains with overlapping keywords                 │
│    • Get domain authority, traffic estimates                │
│    • Identify top keywords                                  │
│  AI → Presents competitor cards                             │
│  User → Selects competitors to track                        │
│  System → Saves to competitors table                        │
│           Schedules daily monitoring (Inngest cron)         │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│           Step 4: Goals & Targeting                         │
│                                                              │
│  User → Selects content types, frequency, topics            │
│  System → Updates business_profiles                         │
│  AI → Configures recommendation algorithm                   │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│           Step 5: CMS Integration                           │
│                                                              │
│  User → Connects WordPress/Webflow/etc.                     │
│  System → OAuth flow or API key validation                  │
│           Stores in cms_integrations (encrypted)            │
│  AI → Tests connection, confirms success                    │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│              Onboarding Complete                            │
│                                                              │
│  System → Triggers initial analysis jobs:                   │
│    • Keyword research (DataForSEO)                          │
│    • Competitor content analysis (Jina)                     │
│    • Opportunity ranking algorithm                          │
│    • Generate SEO health score                              │
│  User → Redirected to dashboard                             │
│  AI → Presents initial opportunities                        │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│              Daily Operations                               │
│                                                              │
│  Background Jobs (Inngest):                                 │
│    • Monitor competitor changes (2 AM daily)                │
│    • Update keyword rankings (3 AM daily)                   │
│    • Find trending topics (Perplexity, 4 AM)                │
│    • Analyze backlink profile (5 AM daily)                  │
│    • Generate daily digest notification                     │
│                                                              │
│  Real-time Operations:                                      │
│    • User asks AI for content → generateContent job         │
│    • User requests analysis → Immediate API calls           │
│    • Content published → Webhook to CMS                     │
│    • Rankings change → Update analytics_snapshots           │
└─────────────────────────────────────────────────────────────┘
```

---

### User Experience Enhancements

#### Conversational Shortcuts & Natural Language Commands

**Examples of natural language the AI should understand:**

```
User: "Show me my best opportunities"
AI: [Fetches top opportunities from keywords table, displays cards]

User: "Write about sustainable fashion"
AI: [Initiates content creation flow]

User: "How am I doing this week?"
AI: [Queries analytics_snapshots, shows summary]

User: "Find articles I can update"
AI: [Queries content table for declining rankings, presents list]

User: "What are my competitors doing?"
AI: [Fetches recent competitor activities from monitoring data]

User: "Schedule a post for Monday"
AI: [Opens scheduling interface with pre-filled Monday date]

User: "I need to rank for [keyword]"
AI: [Analyzes keyword, shows difficulty, suggests strategy]

User: "Export my content calendar"
AI: [Generates CSV/PDF of scheduled content]

User: "Show me my link building campaigns"
AI: [Fetches outreach_campaigns, shows status dashboard]

User: "Remind me to follow up on those emails"
AI: [Creates notifications for follow-ups]
```

#### Proactive AI Suggestions

**AI should initiate conversations based on triggers:**

```typescript
// Trigger: User hasn't logged in for 3 days
AI Message: "Welcome back! While you were away, I found 8 new keyword 
opportunities and one of your articles jumped to #5. Want to see what's new?"

// Trigger: Content ranking dropped significantly
AI Message: "⚠️ Heads up: Your article 'Sustainable Fashion Guide' dropped 
from #5 to #12. This might be because competitors updated their content. 
Should we refresh it?"

// Trigger: Competitor published new content
AI Message: "🔔 Everlane just published a new guide on circular fashion. 
They're targeting keywords you rank for. Want me to analyze it and suggest 
a response strategy?"

// Trigger: Trending topic detected in user's niche
AI Message: "🔥 'Vegan leather alternatives' is trending (↑ 47% this week). 
You could capitalize on this with a timely article. Interested?"

// Trigger: Link building outreach got a response
AI Message: "📧 Good news! SustainableBrand.com responded to your outreach. 
They're interested in featuring your brand. Want me to draft a follow-up?"

// Trigger: User completed content but didn't publish
AI Message: "I see you finished that article on organic cotton yesterday but 
haven't published it yet. Everything okay? Need any final adjustments?"

// Trigger: Scheduled content due soon
AI Message: "⏰ Reminder: You have 2 articles scheduled to publish tomorrow. 
Want to review them one more time?"

// Trigger: SEO health score improved
AI Message: "📈 Great work! Your SEO health score improved from 64 to 71 this 
month. Your keyword rankings are trending up. Keep it going!"
```

#### Contextual Help & Tooltips

Throughout the platform, contextual help appears when users seem stuck:

```
Example 1: User hovers over "Domain Authority"
Tooltip: "Domain Authority (DA) is a score from 0-100 that predicts how well 
a website will rank. Higher is better. Your DA: 34"

Example 2: User stares at empty content editor for 30+ seconds
AI Message (pops up): "Need help getting started? I can:
• Generate an outline based on top-ranking articles
• Show you what competitors cover on this topic
• Suggest a writing framework
Just ask!"

Example 3: User clicks "SEO Score" with confused expression
AI Message: "Your SEO score measures how well-optimized your content is. 
Here's what impacts it: [expandable list]. Want me to improve it 
automatically?"
```

#### Mobile-Responsive Conversational Experience

**Mobile layout adjustments:**

```
┌─────────────────┐
│ [☰] Logo    [👤]│
├─────────────────┤
│                 │
│  Chat Messages  │
│  (Full screen)  │
│                 │
│                 │
│                 │
│                 │
├─────────────────┤
│ [Type message...│
│           [→ ]]│
└─────────────────┘

Mobile Interactions:
• Swipe left/right to navigate between sections
• Tap cards to expand details
• Voice input option for messages
• Push notifications for important updates
• Simplified forms (fewer fields, more steps)
• Bottom sheet modals for selections
```

---

### Performance Optimizations

#### Caching Strategy

```typescript
// lib/cache/strategy.ts

// Cache keyword research results (1 hour)
export const cacheKeywordResearch = async (keyword: string) => {
  const cacheKey = `keyword:${keyword}`
  const cached = await redis.get(cacheKey)
  
  if (cached) return JSON.parse(cached)
  
  const data = await fetchFromDataForSEO(keyword)
  await redis.set(cacheKey, JSON.stringify(data), 'EX', 3600)
  
  return data
}

// Cache competitor analysis (24 hours)
export const cacheCompetitorAnalysis = async (domain: string) => {
  const cacheKey = `competitor:${domain}`
  const cached = await redis.get(cacheKey)
  
  if (cached) return JSON.parse(cached)
  
  const data = await analyzeCompetitor(domain)
  await redis.set(cacheKey, JSON.stringify(data), 'EX', 86400)
  
  return data
}

// Cache user's brand voice (7 days, invalidate on update)
export const cacheBrandVoice = async (userId: string) => {
  const cacheKey = `brand_voice:${userId}`
  const cached = await redis.get(cacheKey)
  
  if (cached) return JSON.parse(cached)
  
  const data = await supabase
    .from('brand_voices')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  await redis.set(cacheKey, JSON.stringify(data), 'EX', 604800)
  
  return data
}
```

#### Streaming for Long Operations

```typescript
// All content generation uses streaming
export async function streamContentGeneration(params) {
  const stream = await streamText({
    model: google('gemini-2.0-flash-exp'),
    messages: buildContentPrompt(params),
    onChunk: ({ chunk }) => {
      // Send chunk to client via WebSocket or SSE
      sendChunkToClient(params.userId, chunk)
    }
  })
  
  return stream
}

// Research operations show progress
export async function researchWithProgress(keyword: string, userId: string) {
  const steps = [
    { name: 'Analyzing keyword', fn: () => analyzeKeyword(keyword) },
    { name: 'Fetching competitors', fn: () => getCompetitors(keyword) },
    { name: 'Getting trends', fn: () => getTrends(keyword) },
    { name: 'Finding opportunities', fn: () => findOpportunities(keyword) }
  ]
  
  for (const [index, step] of steps.entries()) {
    sendProgress(userId, {
      step: step.name,
      progress: ((index + 1) / steps.length) * 100
    })
    
    await step.fn()
  }
}
```

#### Database Query Optimizations

```sql
-- Indexes for common queries
CREATE INDEX idx_keywords_user_priority ON keywords(user_id, priority, search_volume DESC);
CREATE INDEX idx_content_user_status ON content(user_id, status, created_at DESC);
CREATE INDEX idx_competitors_user ON competitors(user_id, priority);
CREATE INDEX idx_analytics_user_date ON analytics_snapshots(user_id, snapshot_date DESC);

-- Vector similarity index for RAG
CREATE INDEX idx_brand_voice_embedding ON brand_voices 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_frameworks_embedding ON writing_frameworks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Materialized view for dashboard stats
CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT 
  user_id,
  COUNT(*) FILTER (WHERE status = 'published') as published_count,
  COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
  AVG(seo_score) as avg_seo_score,
  COUNT(DISTINCT target_keyword) as keywords_targeted
FROM content
GROUP BY user_id;

-- Refresh hourly
CREATE UNIQUE INDEX ON dashboard_stats (user_id);
REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
```

---

### Security & Privacy Considerations

#### Data Protection

```typescript
// Encrypt sensitive data before storing
import { encrypt, decrypt } from '@/lib/encryption'

// Store CMS credentials encrypted
export async function storeCMSCredentials(userId: string, credentials: any) {
  const encrypted = await encrypt(JSON.stringify(credentials))
  
  await supabase.from('cms_integrations').insert({
    user_id: userId,
    credentials: encrypted,
    // ...other fields
  })
}

// Row Level Security (RLS) policies in Supabase
/*
-- Users can only see their own data
CREATE POLICY "Users see own business_profiles"
ON business_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users see own content"
ON content FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users see own keywords"
ON keywords FOR SELECT
USING (auth.uid() = user_id);

-- Similar policies for INSERT, UPDATE, DELETE
*/

// Rate limiting on API routes
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
})

export async function rateLimitedRoute(req: Request) {
  const identifier = req.headers.get('x-forwarded-for') || 'anonymous'
  const { success } = await ratelimit.limit(identifier)
  
  if (!success) {
    return new Response('Too Many Requests', { status: 429 })
  }
  
  // Continue with request...
}
```

#### API Key Management

```typescript
// Store external API keys in environment variables
// Never expose them to client-side code

// .env.local
GOOGLE_API_KEY=your_gemini_key
DATAFORSEO_LOGIN=your_login
DATAFORSEO_PASSWORD=your_password
APIFY_API_KEY=your_apify_key
JINA_API_KEY=your_jina_key
PERPLEXITY_API_KEY=your_perplexity_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

// For user-specific API keys (e.g., WordPress credentials)
// Use Supabase Vault or encrypted database fields
```

---

### Testing Strategy

#### E2E Testing (Playwright)

```typescript
// tests/e2e/onboarding.spec.ts
import { test, expect } from '@playwright/test'

test('complete onboarding flow', async ({ page }) => {
  // Sign up
  await page.goto('/signup')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'SecurePass123!')
  await page.click('button[type="submit"]')
  
  // Wait for redirect to onboarding
  await page.waitForURL('/onboarding')
  
  // Step 1: Business Profile
  await expect(page.locator('text=Step 1')).toBeVisible()
  await page.fill('input[placeholder*="website URL"]', 'https://example.com')
  await page.click('button:has-text("Continue")')
  
  // Wait for AI analysis
  await expect(page.locator('text=Analyzing')).toBeVisible()
  await expect(page.locator('text=✓ Done')).toBeVisible({ timeout: 10000 })
  
  // Confirm detection
  await page.click('button:has-text("Yes")')
  
  // Select goals
  await page.click('[data-testid="goal-increase-traffic"]')
  await page.click('[data-testid="goal-generate-leads"]')
  await page.click('button:has-text("Continue")')
  
  // Step 2: Brand Voice
  await expect(page.locator('text=Step 2')).toBeVisible()
  await page.click('button:has-text("Answer a few questions instead")')
  
  await page.fill('input[placeholder*="3 words"]', 'Professional, Friendly, Expert')
  await page.click('button:has-text("Continue")')
  
  // Step 3: Competitors
  await expect(page.locator('text=Step 3')).toBeVisible()
  await page.click('button:has-text("Start Automatic Analysis")')
  
  // Wait for competitor discovery
  await expect(page.locator('text=Found your top competitors')).toBeVisible({ timeout: 15000 })
  
  // Select competitors
  await page.click('[data-testid="competitor-0"]')
  await page.click('[data-testid="competitor-1"]')
  await page.click('button:has-text("Continue with selected")')
  
  // Step 4: Goals & Targeting
  await expect(page.locator('text=Step 4')).toBeVisible()
  await page.click('[data-testid="content-type-blog"]')
  await page.click('[data-testid="frequency-weekly"]')
  await page.click('button:has-text("Continue")')
  
  // Step 5: CMS Integration
  await expect(page.locator('text=Step 5')).toBeVisible()
  await page.click('button:has-text("Skip this step")')
  
  // Completion
  await expect(page.locator('text=You\'re all set!')).toBeVisible()
  await page.click('button:has-text("View All Opportunities")')
  
  // Should redirect to dashboard
  await page.waitForURL('/dashboard')
  await expect(page.locator('text=SEO Health Score')).toBeVisible()
})

test('conversational content creation', async ({ page }) => {
  // Assume user is logged in and on dashboard
  await page.goto('/dashboard')
  
  // Click opportunity card
  await page.click('[data-testid="opportunity-card-0"]')
  
  // Content creation flow
  await expect(page.locator('text=Let\'s create some amazing content')).toBeVisible()
  
  // AI should show keyword info
  await expect(page.locator('text=Search volume')).toBeVisible()
  
  // Select content type
  await page.click('button:has-text("Use recommended")')
  
  // Wait for settings
  await page.click('[data-testid="word-count-comprehensive"]')
  await page.click('button:has-text("Generate content")')
  
  // Wait for generation (with progress indicators)
  await expect(page.locator('text=Creating your article')).toBeVisible()
  await expect(page.locator('text=Your article is ready')).toBeVisible({ timeout: 120000 })
  
  // Check SEO score displayed
  await expect(page.locator('text=SEO Score:')).toBeVisible()
  
  // Open editor
  await page.click('button:has-text("Edit in full editor")')
  
  // Verify editor loaded
  await expect(page.locator('[data-testid="content-editor"]')).toBeVisible()
  await expect(page.locator('text=SEO Score:')).toBeVisible()
})
```

#### Unit Testing (Vitest)

```typescript
// lib/rag/__tests__/retrieve-frameworks.test.ts
import { describe, it, expect, vi } from 'vitest'
import { retrieveFrameworks } from '../retrieve-frameworks'

describe('retrieveFrameworks', () => {
  it('should retrieve relevant frameworks based on query', async () => {
    const query = 'how to write persuasive sales copy'
    const frameworks = await retrieveFrameworks(query)
    
    expect(frameworks).toHaveLength(3)
    expect(frameworks[0].name).toBe('AIDA')
    expect(frameworks[0].similarity).toBeGreaterThan(0.7)
  })
  
  it('should return empty array if no matches above threshold', async () => {
    const query = 'completely unrelated quantum physics topic'
    const frameworks = await retrieveFrameworks(query)
    
    expect(frameworks).toHaveLength(0)
  })
})

// lib/seo/__tests__/keyword-analysis.test.ts
describe('analyzeKeyword', () => {
  it('should return keyword metrics from DataForSEO', async () => {
    const result = await analyzeKeyword('sustainable fashion')
    
    expect(result).toHaveProperty('search_volume')
    expect(result).toHaveProperty('keyword_difficulty')
    expect(result).toHaveProperty('competition')
    expect(result.search_volume).toBeGreaterThan(0)
  })
  
  it('should handle keywords with no data gracefully', async () => {
    const result = await analyzeKeyword('xyzabc123nonexistent')
    
    expect(result).toHaveProperty('search_volume')
    expect(result.search_volume).toBe(0)
  })
})

// components/__tests__/progress-bar.test.tsx
describe('OnboardingProgressBar', () => {
  it('should display correct progress percentage', () => {
    const steps = [
      { id: 1, name: 'Step 1', description: 'Description' },
      { id: 2, name: 'Step 2', description: 'Description' },
      { id: 3, name: 'Step 3', description: 'Description' },
    ]
    
    const { getByText } = render(
      <OnboardingProgressBar currentStep={2} steps={steps} />
    )
    
    expect(getByText('67% Complete')).toBeInTheDocument()
  })
  
  it('should show completed steps with checkmarks', () => {
    const steps = [
      { id: 1, name: 'Step 1', description: 'Description' },
      { id: 2, name: 'Step 2', description: 'Description' },
    ]
    
    const { container } = render(
      <OnboardingProgressBar currentStep={2} steps={steps} />
    )
    
    const checkmarks = container.querySelectorAll('svg')
    expect(checkmarks).toHaveLength(1) // One completed step
  })
})
```

#### Integration Testing

```typescript
// tests/integration/content-generation.test.ts
describe('Content Generation Pipeline', () => {
  it('should complete full content generation workflow', async () => {
    // Setup test user and data
    const user = await createTestUser()
    const brandVoice = await createBrandVoice(user.id)
    
    // Trigger content generation
    const job = await triggerContentGeneration({
      userId: user.id,
      keyword: 'test keyword',
      framework: 'AIDA',
      settings: { wordCount: 1500 }
    })
    
    // Wait for job completion
    await waitForJobCompletion(job.id, { timeout: 60000 })
    
    // Verify content created
    const content = await getContent(job.contentId)
    expect(content).toBeDefined()
    expect(content.word_count).toBeGreaterThan(1400)
    expect(content.word_count).toBeLessThan(1600)
    expect(content.seo_score).toBeGreaterThan(70)
  })
})

// tests/integration/api-routes.test.ts
describe('API Routes', () => {
  it('POST /api/chat should stream responses', async () => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
        context: { userId: 'test-user' }
      })
    })
    
    expect(response.headers.get('Content-Type')).toContain('text/plain')
    
    const reader = response.body.getReader()
    const chunks = []
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    
    expect(chunks.length).toBeGreaterThan(0)
  })
})
```

---

## Deployment & Infrastructure

### Vercel Deployment Configuration

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  },
  "crons": [
    {
      "path": "/api/cron/daily-analysis",
      "schedule": "0 2 * * *"
    }
  ],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key",
    "GOOGLE_API_KEY": "@google_api_key",
    "DATAFORSEO_LOGIN": "@dataforseo_login",
    "DATAFORSEO_PASSWORD": "@dataforseo_password"
  }
}
```

### Environment Variables Checklist

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Services
GOOGLE_API_KEY=
OPENAI_API_KEY= # Backup/alternative

# SEO & Research APIs
DATAFORSEO_LOGIN=
DATAFORSEO_PASSWORD=
APIFY_API_KEY=
JINA_API_KEY=
PERPLEXITY_API_KEY=

# CMS Integrations
WORDPRESS_OAUTH_CLIENT_ID=
WORDPRESS_OAUTH_CLIENT_SECRET=
WEBFLOW_CLIENT_ID=
WEBFLOW_CLIENT_SECRET=
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=

# Background Jobs
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Redis (for caching/rate limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Monitoring & Analytics
SENTRY_DSN= # Error tracking
POSTHOG_KEY= # Product analytics

# Email (for notifications)
RESEND_API_KEY=
```

### Supabase Setup

```sql
-- Run these migrations in Supabase SQL Editor

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- Create tables (from schema above)
-- ... (all table definitions)

-- Set up Row Level Security
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
-- ... enable RLS on all tables

-- Create RLS policies
CREATE POLICY "Users can view own business profiles"
  ON business_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business profiles"
  ON business_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business profiles"
  ON business_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ... similar policies for all tables

-- Create functions for vector search
CREATE OR REPLACE FUNCTION match_frameworks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  name text,
  structure jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $
BEGIN
  RETURN QUERY
  SELECT
    writing_frameworks.id,
    writing_frameworks.name,
    writing_frameworks.structure,
    1 - (writing_frameworks.embedding <=> query_embedding) AS similarity
  FROM writing_frameworks
  WHERE 1 - (writing_frameworks.embedding <=> query_embedding) > match_threshold
  ORDER BY writing_frameworks.embedding <=> query_embedding
  LIMIT match_count;
END;
$;

-- Similar function for brand voice matching
CREATE OR REPLACE FUNCTION match_brand_voice(
  query_embedding vector(1536),
  user_uuid uuid
)
RETURNS TABLE (
  tone text,
  style text,
  personality jsonb,
  sample_phrases text[],
  similarity float
)
LANGUAGE plpgsql
AS $
BEGIN
  RETURN QUERY
  SELECT
    brand_voices.tone,
    brand_voices.style,
    brand_voices.personality,
    brand_voices.sample_phrases,
    1 - (brand_voices.embedding <=> query_embedding) AS similarity
  FROM brand_voices
  WHERE brand_voices.user_id = user_uuid
  ORDER BY brand_voices.embedding <=> query_embedding
  LIMIT 1;
END;
$;

-- Create indexes for performance
CREATE INDEX idx_business_profiles_user ON business_profiles(user_id);
CREATE INDEX idx_keywords_user_priority ON keywords(user_id, priority, search_volume DESC);
CREATE INDEX idx_content_user_status ON content(user_id, status, created_at DESC);
CREATE INDEX idx_competitors_user ON competitors(user_id);

-- Vector indexes
CREATE INDEX idx_frameworks_embedding ON writing_frameworks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_brand_voice_embedding ON brand_voices 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Full text search indexes
CREATE INDEX idx_content_search ON content USING gin(to_tsvector('english', title || ' ' || COALESCE(meta_description, '')));

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ language 'plpgsql';

CREATE TRIGGER update_business_profiles_updated_at BEFORE UPDATE ON business_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitors_updated_at BEFORE UPDATE ON competitors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keywords_updated_at BEFORE UPDATE ON keywords
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Monitoring & Analytics

### Application Monitoring

```typescript
// lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})

// Track custom events
export function trackContentGeneration(params: {
  userId: string
  keyword: string
  duration: number
  success: boolean
}) {
  Sentry.captureMessage('Content Generation', {
    level: 'info',
    tags: {
      feature: 'content_generation',
      success: params.success,
    },
    extra: params,
  })
}

// lib/monitoring/posthog.ts
import posthog from 'posthog-js'

export function initPostHog() {
  if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: 'https://app.posthog.com',
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') posthog.debug()
      },
    })
  }
}

// Track user events
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  posthog.capture(eventName, properties)
}

// Track onboarding completion
export function trackOnboardingComplete(userId: string, durationSeconds: number) {
  trackEvent('onboarding_completed', {
    user_id: userId,
    duration_seconds: durationSeconds,
    timestamp: new Date().toISOString(),
  })
}

// Track content generation
export function trackContentGenerated(params: {
  userId: string
  keyword: string
  contentType: string
  wordCount: number
  seoScore: number
}) {
  trackEvent('content_generated', params)
}
```

### Performance Monitoring

```typescript
// lib/monitoring/performance.ts
export function measurePerformance(metricName: string) {
  const start = performance.now()
  
  return {
    end: () => {
      const duration = performance.now() - start
      
      // Send to monitoring service
      trackEvent('performance_metric', {
        metric: metricName,
        duration_ms: duration,
      })
      
      // Log slow operations
      if (duration > 5000) {
        console.warn(`Slow operation: ${metricName} took ${duration}ms`)
      }
      
      return duration
    },
  }
}

// Usage
const timer = measurePerformance('keyword_analysis')
await analyzeKeyword('sustainable fashion')
timer.end()
```

### Health Checks

```typescript
// app/api/health/route.ts
export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      ai: 'unknown',
      cache: 'unknown',
    },
  }
  
  try {
    // Check Supabase connection
    const { error: dbError } = await supabase
      .from('business_profiles')
      .select('count')
      .limit(1)
    
    health.services.database = dbError ? 'unhealthy' : 'healthy'
  } catch (error) {
    health.services.database = 'unhealthy'
  }
  
  try {
    // Check AI service
    await generateText({
      model: google('gemini-2.0-flash-exp'),
      prompt: 'health check',
      maxTokens: 5,
    })
    
    health.services.ai = 'healthy'
  } catch (error) {
    health.services.ai = 'unhealthy'
  }
  
  try {
    // Check Redis/cache
    await redis.ping()
    health.services.cache = 'healthy'
  } catch (error) {
    health.services.cache = 'unhealthy'
  }
  
  const isHealthy = Object.values(health.services).every(s => s === 'healthy')
  health.status = isHealthy ? 'healthy' : 'degraded'
  
  return Response.json(health, {
    status: isHealthy ? 200 : 503,
  })
}
```

---

## Cost Optimization Strategies

### API Call Optimization

```typescript
// lib/optimization/api-budget.ts

// Batch DataForSEO requests
export async function batchKeywordAnalysis(keywords: string[]) {
  // Instead of 10 separate calls, make 1 batch call
  return await dataForSEOClient.batch([
    keywords.map(keyword => ({
      endpoint: '/keywords_data',
      method: 'POST',
      data: { keyword }
    }))
  ])
}

// Cache expensive operations
const CACHE_TTL = {
  keyword_data: 24 * 60 * 60, // 24 hours
  competitor_analysis: 7 * 24 * 60 * 60, // 7 days
  trending_topics: 1 * 60 * 60, // 1 hour
}

export async function getCachedOrFetch<T>(
  cacheKey: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)
  
  const fresh = await fetchFn()
  await redis.set(cacheKey, JSON.stringify(fresh), 'EX', ttl)
  
  return fresh
}

// Implement request deduplication
const pendingRequests = new Map<string, Promise<any>>()

export async function deduplicatedRequest<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!
  }
  
  const promise = fn().finally(() => {
    pendingRequests.delete(key)
  })
  
  pendingRequests.set(key, promise)
  return promise
}
```

### Database Query Optimization

```typescript
// Use connection pooling
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        'x-connection-pool-size': '10',
      },
    },
  }
)

// Batch database operations
export async function batchInsertKeywords(userId: string, keywords: Array<any>) {
  // Instead of 100 separate inserts, do 1 batch
  return await supabase
    .from('keywords')
    .insert(keywords.map(k => ({ ...k, user_id: userId })))
}

// Use materialized views for expensive aggregations
// Refresh periodically instead of computing on every request
export async function getDashboardStats(userId: string) {
  // Query pre-computed materialized view instead of live aggregation
  return await supabase
    .from('dashboard_stats')
    .select('*')
    .eq('user_id', userId)
    .single()
}
```

### AI Token Optimization

```typescript
// Use shorter prompts when possible
export function buildEfficientPrompt(context: any) {
  // Instead of verbose instructions, use concise directives
  return `Write SEO article. Keyword: ${context.keyword}. Tone: ${context.tone}. Length: ${context.wordCount}w.`
}

// Use appropriate models for different tasks
export function selectModel(task: 'simple' | 'complex' | 'creative') {
  switch (task) {
    case 'simple':
      return google('gemini-2.0-flash-exp') // Faster, cheaper
    case 'complex':
      return google('gemini-2.0-pro-exp') // More capable
    case 'creative':
      return google('gemini-1.5-pro') // Best quality
  }
}

// Implement token counting and budgets
import { encode } from 'gpt-tokenizer'

export function estimateTokens(text: string): number {
  return encode(text).length
}

export async function generateWithBudget(
  prompt: string,
  maxTokens: number,
  budget: number
) {
  const promptTokens = estimateTokens(prompt)
  
  if (promptTokens + maxTokens > budget) {
    throw new Error('Exceeds token budget')
  }
  
  return await generateText({ prompt, maxTokens })
}
```

---

## Success Metrics & KPIs

### Product Metrics

```typescript
// Track these metrics in your analytics
export const productMetrics = {
  // Activation
  onboarding_completion_rate: 0, // % of signups that complete onboarding
  time_to_first_value: 0, // Minutes until user sees first insight
  
  // Engagement
  daily_active_users: 0,
  weekly_active_users: 0,
  monthly_active_users: 0,
  content_generation_per_user: 0, // Average pieces generated per month
  chat_messages_per_session: 0,
  
  // Retention
  day_1_retention: 0,
  day_7_retention: 0,
  day_30_retention: 0,
  
  // Value Delivery
  avg_seo_score: 0, // Average SEO score of generated content
  avg_ranking_improvement: 0, // Position change for tracked keywords
  content_published_rate: 0, // % of generated content that gets published
  
  // Technical
  api_response_time: 0, // P95 response time
  content_generation_time: 0, // Average seconds to generate content
  error_rate: 0, // % of requests that error
  uptime: 0, // % uptime
}

// Dashboard for team
export function MetricsDashboard() {
  return (
    <div>
      <h2>Product Health</h2>
      
      <MetricCard
        title="Onboarding Completion"
        value="73%"
        trend="+5%"
        target="80%"
      />
      
      <MetricCard
        title="Time to First Value"
        value="4.2 min"
        trend="-0.8 min"
        target="<5 min"
      />
      
      <MetricCard
        title="Day 7 Retention"
        value="45%"
        trend="+3%"
        target="50%"
      />
      
      <MetricCard
        title="Content Generated/User"
        value="8.3"
        trend="+1.2"
        target="10"
      />
    </div>
  )
}
```

---

## Future Enhancements (Phase 6+)

### Advanced Features Roadmap

**Q1 2026:**
- Multi-language support (Spanish, French, German)
- AI-powered image generation for articles
- Advanced A/B testing for headlines/meta descriptions
- Team collaboration features (comments, approvals, roles)
- White-label solution for agencies

**Q2 2026:**
- Video content optimization (YouTube SEO)
- Podcast transcription and SEO optimization
- Schema markup automation
- Local SEO enhancements (Google Business Profile integration)
- Advanced competitor alerts (real-time notifications)

**Q3 2026:**
- AI-powered content refresh recommendations
- Predictive SEO (forecast ranking potential before publishing)
- Content cluster automation (pillar pages + supporting content)
- Integration marketplace (Zapier, Make, custom integrations)
- Mobile app (iOS/Android)

**Q4 2026:**
- E-commerce SEO features (product optimization)
- Technical SEO crawler and fixes
- Link building outreach automation (CRM-like features)
- Advanced analytics (attribution, ROI tracking)
- AI SEO consultant (voice interface)                                 │