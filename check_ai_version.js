const { streamText } = require('ai');
const { createOpenAI } = require('@ai-sdk/openai');

console.log('AI Package Version Check');
try {
    const packageJson = require('ai/package.json');
    console.log('Resolved ai version:', packageJson.version);
} catch (e) {
    console.log('Could not read ai/package.json');
}

console.log('streamText type:', typeof streamText);

// Mock a streamText call to check return type
// We can't easily mock the model without a real key, but we can check the prototype if possible
// Or just check if the function exists.

// Actually, let's try to inspect the streamText function or its result if we can mock it.
// But streamText requires a model.

// Let's just check if toDataStreamResponse is exported? No, it's a method on the result.

// Let's check if we can import CoreMessage
const { convertToCoreMessages } = require('ai');
console.log('convertToCoreMessages exists:', !!convertToCoreMessages);
