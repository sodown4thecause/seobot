const { streamText } = require('ai');
const { createOpenAI } = require('@ai-sdk/openai');

// Mock model
const mockModel = {
    specificationVersion: 'v1',
    provider: 'mock',
    modelId: 'mock-model',
    doStream: async () => ({
        stream: new ReadableStream({
            start(controller) {
                controller.enqueue({ type: 'text-delta', textDelta: 'Hello' });
                controller.close();
            },
        }),
    }),
};

async function checkStreamText() {
    console.log('Checking streamText return value...');
    try {
        const result = streamText({
            model: mockModel,
            messages: [{ role: 'user', content: 'Hello' }],
        });

        console.log('Result type:', result.constructor.name);
        console.log('Result keys:', Object.keys(result));
        console.log('toDataStreamResponse exists:', typeof result.toDataStreamResponse);

        if (result instanceof Promise) {
            console.log('Result IS A PROMISE');
        } else {
            console.log('Result is NOT a promise');
        }

    } catch (error) {
        console.error('Error calling streamText:', error);
    }
}

checkStreamText();
