# Guided Chat Workflows

This document explains the guided workflow system that powers the dashboard Quick Start actions.

## Overview

The guided workflow system allows users to start complex SEO tasks directly from the dashboard. When a user clicks a "Start" button on any Quick Start card, it:

1. Loads a pre-written guided prompt into the chat
2. Automatically sends it to the AI
3. Starts a conversational workflow to guide the user through the task

## Architecture

### Components

```
Dashboard Page (app/dashboard/page.tsx)
    ↓
QuickStartGrid (components/dashboard/quick-start-grid.tsx)
    ↓
Workflow Prompts (lib/workflows/guided-prompts.ts)
    ↓
AIChatInterface (components/chat/ai-chat-interface.tsx)
    ↓
Chat API (app/api/chat/route.ts)
```

### Flow

1. **User Action**: User clicks "Start" on a workflow card
2. **Workflow Selection**: `QuickStartGrid` calls `onWorkflowSelect(workflowId)`
3. **Prompt Loading**: Dashboard loads the workflow prompt using `getWorkflowPrompt(workflowId)`
4. **Message Injection**: Dashboard sets `autoSendMessage` prop on `AIChatInterface`
5. **Auto-Send**: Chat interface automatically sends the message when ready
6. **AI Response**: AI responds with guided questions and instructions
7. **Scroll to Chat**: Page scrolls to chat section for user interaction

## Available Workflows

### 1. SEO Tools (`seo-tools`)
- Keyword analysis
- Content gap analysis
- AI search volume insights
- Competitor keyword research

### 2. Create Ranking Content (`complete-ranking-campaign`)
- Topic research
- Content outline generation
- SEO-optimized writing
- EEAT optimization
- Image generation

### 3. Audit My Website (`technical-seo-audit`)
- Page speed analysis
- Mobile responsiveness check
- Crawlability issues
- Technical SEO problems
- Fix recommendations

### 4. Analyze Competitors (`competitor-analysis`)
- Competitor identification
- Content gap discovery
- Backlink analysis
- Traffic estimation
- Strategy insights

### 5. Build Links (`link-building-campaign`)
- Link opportunity discovery
- Guest posting prospects
- Broken link building
- Outreach email templates
- Domain authority analysis

### 6. Rank on ChatGPT (`rank-on-chatgpt`)
- AI visibility assessment
- AEO optimization
- Citation opportunities
- Structured data recommendations
- Authority signals

## AI SDK 6 Best Practices

This implementation follows AI SDK 6 best practices:

### 1. **Proper Message Flow**
```typescript
// ✅ Correct: Auto-send as user message
<AIChatInterface autoSendMessage={workflowPrompt} />

// ❌ Wrong: Show as assistant message
<AIChatInterface initialMessage={workflowPrompt} />
```

### 2. **State Management**
```typescript
const [workflowMessage, setWorkflowMessage] = useState<string>()

// Update when workflow selected
const handleWorkflowSelect = (id: string) => {
  const workflow = getWorkflowPrompt(id)
  setWorkflowMessage(workflow?.initialPrompt)
}
```

### 3. **Auto-Send Implementation**
```typescript
useEffect(() => {
  if (autoSendMessage && status === 'ready') {
    setTimeout(() => {
      sendMessage({ text: autoSendMessage })
    }, 300)
  }
}, [autoSendMessage, status, sendMessage])
```

### 4. **Context Passing**
Each workflow includes context metadata:
```typescript
context: {
  workflowType: 'content-creation',
  expectedSteps: ['topic', 'research', 'writing', 'optimization']
}
```

## Adding New Workflows

To add a new guided workflow:

1. **Define the workflow** in `lib/workflows/guided-prompts.ts`:

```typescript
export const GUIDED_WORKFLOWS: Record<string, GuidedWorkflow> = {
  'my-new-workflow': {
    id: 'my-new-workflow',
    title: 'My Workflow',
    description: 'What this workflow does',
    initialPrompt: `Your guided prompt here...
    
    Ask questions to gather info.
    Explain what you'll do.
    Set expectations.`,
    context: {
      workflowType: 'my-type',
      expectedSteps: ['step1', 'step2']
    }
  }
}
```

2. **Add to QuickStartGrid** in `components/dashboard/quick-start-grid.tsx`:

```typescript
{
  title: 'My Workflow',
  description: 'Short description',
  workflow: 'my-new-workflow',
  icon: YourIcon,
  color: 'text-blue-400'
}
```

3. **Test the workflow**:
   - Click the "Start" button
   - Verify the prompt appears in chat
   - Ensure smooth conversation flow
   - Check that the AI understands the context

## Visual Feedback

The implementation includes visual feedback:

- **Loading State**: Shows spinner when workflow is loading
- **Card Highlight**: Active workflow card is highlighted
- **Smooth Scroll**: Auto-scrolls to chat section
- **Animation**: 2-second highlight animation

## Error Handling

The system gracefully handles errors:

- If workflow not found, nothing happens
- If chat is bootstrapping, waits for ready state
- If auto-send fails, user can manually send
- No breaking changes to existing chat functionality

## Performance Considerations

- **Lazy Loading**: Prompts loaded only when needed
- **Memoization**: Workflow lookup is O(1) using object keys
- **Debouncing**: Auto-send includes 300ms delay
- **State Isolation**: Each workflow uses React keys for fresh state

## Future Enhancements

Potential improvements:

1. **Workflow Progress Tracking**: Show steps completed
2. **Workflow Persistence**: Save workflow state across sessions
3. **Workflow Templates**: Allow users to create custom workflows
4. **Multi-step Validation**: Validate user inputs at each step
5. **Workflow Analytics**: Track completion rates and bottlenecks
6. **Workflow Branching**: Dynamic paths based on user responses
