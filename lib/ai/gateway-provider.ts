import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createGateway } from '@ai-sdk/gateway';
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

// Vercel AI Gateway client (use @ai-sdk/gateway, not @ai-sdk/openai)
const gateway = serverEnv.AI_GATEWAY_API_KEY
  ? createGateway({
      apiKey: serverEnv.AI_GATEWAY_API_KEY,
      baseURL: serverEnv.AI_GATEWAY_BASE_URL || 'https://ai-gateway.vercel.sh/v1',
    })
  : null;

export const vercelGateway = {
  languageModel(modelId: string): any {
    console.log('[Gateway] Requested model:', modelId);
    console.log('[Gateway] Gateway configured:', !!gateway);
    console.log('[Gateway] OpenAI configured:', !!openai);
    console.log('[Gateway] Google configured:', !!google);
    
    // TEMP: Prefer direct providers over gateway for testing streaming
    if (modelId.startsWith('openai/')) {
      // Try direct OpenAI first
      if (openai) {
        console.log('[Gateway] Using direct OpenAI provider for:', modelId);
        return openai(modelId.replace('openai/', ''));
      }
      // Fallback to Gateway if OpenAI key missing
      if (gateway) {
        console.log('[Gateway] Using gateway for:', modelId);
        return gateway(modelId);
      }
      throw new Error('Neither OPENAI_API_KEY nor AI_GATEWAY_API_KEY is configured');
    }

    // Google provider
    if (modelId.startsWith('google/')) {
      if (google) {
        console.log('[Gateway] Using Google provider for:', modelId);
        return google(modelId.replace('google/', ''));
      }
      // Fallback to Gateway if Google key missing but Gateway exists
      if (gateway) {
        console.log('[Gateway] Falling back to gateway for Google model:', modelId);
        return gateway(modelId);
      }
      throw new Error('Neither GOOGLE_API_KEY nor AI_GATEWAY_API_KEY is configured');
    }
    
    // Try gateway for other models
    if (gateway) {
       console.log('[Gateway] Using gateway for:', modelId);
       return gateway(modelId);
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
    // Image generation is not supported through Gateway, only through direct providers
    if (modelId.startsWith('openai/')) {
      if (openai) return openai.image(modelId.replace('openai/', ''));
      throw new Error('OpenAI API key required for image generation');
    }
    
    if (modelId.startsWith('google/')) {
       if (google) return google(modelId.replace('google/', '')) as any;
       throw new Error('Google API key required for image generation');
    }
    throw new Error(`Unsupported image model ID: ${modelId}`);
  }
};
