import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { serverEnv } from '@/lib/config/env';

// Initialize providers conditionally
const google = serverEnv.GOOGLE_API_KEY 
  ? createGoogleGenerativeAI({
      apiKey: serverEnv.GOOGLE_API_KEY,
    })
  : null;

const openai = serverEnv.OPENAI_API_KEY
  ? createOpenAI({
      apiKey: serverEnv.OPENAI_API_KEY,
    })
  : null;

// Vercel AI Gateway client (OpenAI-compatible)
const gateway = serverEnv.AI_GATEWAY_API_KEY
  ? createOpenAI({
      baseURL: serverEnv.AI_GATEWAY_BASE_URL || 'https://ai-gateway.vercel.sh/v1',
      apiKey: serverEnv.AI_GATEWAY_API_KEY,
      headers: {
        'Authorization': `Bearer ${serverEnv.AI_GATEWAY_API_KEY}`,
      },
    })
  : null;

export const vercelGateway = {
  languageModel(modelId: string): any {
    // 1. Use Gateway if configured and explicitly requested or for supported models
    if (gateway && (modelId.includes('gemini-2.0-pro') || modelId === 'openai/gpt-4o' || serverEnv.AI_GATEWAY_API_KEY)) {
       return gateway(modelId);
    }

    // 2. Use Google provider directly for other Gemini models
    if (modelId.startsWith('google/')) {
      if (google) return google(modelId.replace('google/', ''));
      // Fallback to Gateway if Google key missing but Gateway exists
      if (gateway) return gateway(modelId);
    }
    
    if (modelId.startsWith('openai/')) {
      if (openai) return openai(modelId.replace('openai/', ''));
      // Fallback to Gateway if OpenAI key missing but Gateway exists
      if (gateway) return gateway(modelId);
    }
    
    throw new Error(`Unsupported model ID: ${modelId} or missing configuration (Gateway/API Keys)`);
  },

  textEmbeddingModel(modelId: string): any {
    // Use Gateway for OpenAI embeddings if configured
    if (modelId.startsWith('openai/') && gateway) {
      return gateway.textEmbeddingModel(modelId.replace('openai/', ''));
    }

    if (modelId.startsWith('google/')) {
      if (google) return google.textEmbeddingModel(modelId.replace('google/', ''));
      if (gateway) return gateway.textEmbeddingModel(modelId); // Try via gateway
    }
    if (modelId.startsWith('openai/')) {
      if (openai) return openai.textEmbeddingModel(modelId.replace('openai/', ''));
    }
    throw new Error(`Unsupported embedding model ID: ${modelId}`);
  },

  imageModel(modelId: string): any {
    if (modelId.startsWith('openai/')) {
      if (openai) return openai.image(modelId.replace('openai/', ''));
      if (gateway) return gateway.image(modelId.replace('openai/', ''));
    }
    
    if (modelId.startsWith('google/')) {
       if (google) return google(modelId.replace('google/', '')) as any;
    }
    throw new Error(`Unsupported image model ID: ${modelId}`);
  }
};
