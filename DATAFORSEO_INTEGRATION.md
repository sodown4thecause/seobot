# DataForSEO Integration with Gemini Function Calling

## Status: Ready for Implementation

All DataForSEO functions are created and ready. Final step is integrating Gemini function calling into the chat API.

## What's Complete

✅ **13 DataForSEO service functions** (`lib/api/dataforseo-service.ts`)
- AI Optimization (3): aiKeywordSearchVolume, chatGPTLLMScraper, chatGPTLLMResponses
- Keyword Research (3): keywordResearch, keywordsForKeywords, bulkKeywordDifficulty
- SERP Analysis (2): serpAnalysis, serpCompetitors  
- Competitor Analysis (2): competitorAnalysis, domainIntersection
- Domain Analysis (3): domainRankOverview, rankedKeywords, relevantPages

✅ **13 Gemini function definitions** (`lib/ai/dataforseo-tools.ts`)
- All functions have proper schemas and handlers
- Returns formatted JSON data ready for AI consumption

## What's Needed

Update `app/api/chat/route.ts` to add Gemini function calling:

```typescript
import { dataForSEOFunctions, handleDataForSEOFunctionCall } from '@/lib/ai/dataforseo-tools'

// In POST function, update model creation:
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',
  tools: [{
    functionDeclarations: dataForSEOFunctions
  }]
})

// After getting initial response, check for function calls:
const response = await chat.sendMessage(lastMessage.content)

// Check if Gemini wants to call functions
if (response.functionCalls) {
  // Execute each function call
  const functionResults = await Promise.all(
    response.functionCalls.map(async (call) => {
      const result = await handleDataForSEOFunctionCall(call.name, call.args)
      return {
        functionResponse: {
          name: call.name,
          response: { result }
        }
      }
    })
  )

  // Send function results back to Gemini
  const finalResponse = await chat.sendMessageStream([{ functionResponse: functionResults[0].functionResponse }])
  const stream = GoogleGenerativeAIStream(finalResponse)
  return new StreamingTextResponse(stream)
}

// Otherwise stream normally
const stream = GoogleGenerativeAIStream(response.stream)
return new StreamingTextResponse(stream)
```

## Testing Queries

Once integrated, test with:

1. **AI Optimization**
   - "What's the search volume for 'AI tools' in ChatGPT?"
   - "Show me ChatGPT results for 'best CRM software'"

2. **Keyword Research**
   - "Get search volume for keywords: AI, machine learning, deep learning"
   - "Find keyword ideas related to 'seo tools'"
   - "What's the difficulty for ranking 'content marketing'?"

3. **SERP Analysis**
   - "Who ranks for 'project management software'?"
   - "Show me Google rankings for 'seo audit tool'"

4. **Competitor Analysis**
   - "Find competitors of example.com"
   - "What keywords do hubspot.com and semrush.com both rank for?"

5. **Domain Analysis**
   - "Analyze domain metrics for example.com"
   - "What keywords does ahrefs.com rank for?"
   - "Show me top pages of moz.com"

## Implementation Notes

- Gemini 2.0 supports function calling natively
- Function calls are synchronous (wait for result before continuing)
- Can handle multiple function calls in sequence
- Results are injected back into conversation context
- AI formats the raw data into human-readable responses

## Alternative: Simpler Approach

If Gemini function calling is complex, you can use **prompt-based tool selection**:

Add to system prompt:
```
You have access to these SEO data tools:
[list all 13 tools with descriptions]

To use a tool, respond with:
TOOL_CALL: tool_name
ARGS: {"param": "value"}
```

Then parse the response for TOOL_CALL patterns and execute manually.

This is simpler but less elegant than native function calling.
