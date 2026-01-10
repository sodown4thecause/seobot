import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createDeepSeek } from '@ai-sdk/deepseek';
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

const anthropic = serverEnv.ANTHROPIC_API_KEY
  ? createAnthropic({
    apiKey: serverEnv.ANTHROPIC_API_KEY,
  })
  : null;

const deepseek = serverEnv.DEEPSEEK_API_KEY
  ? createDeepSeek({
    apiKey: serverEnv.DEEPSEEK_API_KEY,
  })
  : null;

// Vercel AI Gateway client (use @ai-sdk/gateway, not @ai-sdk/openai)
const gateway = serverEnv.AI_GATEWAY_API_KEY
  ? createGateway({
    apiKey: serverEnv.AI_GATEWAY_API_KEY,
    baseURL: serverEnv.AI_GATEWAY_BASE_URL || 'https://ai-gateway.vercel.sh/v1/ai',
  })
  : null;


export const vercelGateway = {
  languageModel(modelId: string): any {
    console.log('[Gateway] Requested model:', modelId);
    console.log('[Gateway] Gateway configured:', !!gateway);
    console.log('[Gateway] OpenAI configured:', !!openai);
    console.log('[Gateway] Google configured:', !!google);
    console.log('[Gateway] Anthropic configured:', !!anthropic);
    console.log('[Gateway] Moonshot (via Gateway) configured:', !!gateway);

    // OpenAI models
    if (modelId.startsWith('openai/')) {
      if (openai) {
        console.log('[Gateway] Using direct OpenAI provider for:', modelId);
        return openai(modelId.replace('openai/', ''));
      }
      if (gateway) {
        console.log('[Gateway] Using gateway for:', modelId);
        return gateway(modelId);
      }
      throw new Error('Neither OPENAI_API_KEY nor AI_GATEWAY_API_KEY is configured');
    }

    // Google models
    if (modelId.startsWith('google/')) {
      if (google) {
        console.log('[Gateway] Using Google provider for:', modelId);
        return google(modelId.replace('google/', ''));
      }
      if (gateway) {
        console.log('[Gateway] Falling back to gateway for Google model:', modelId);
        return gateway(modelId);
      }
      throw new Error('Neither GOOGLE_API_KEY nor AI_GATEWAY_API_KEY is configured');
    }

    // Anthropic models
    if (modelId.startsWith('anthropic/')) {
      if (anthropic) {
        console.log('[Gateway] Using Anthropic provider for:', modelId);
        return anthropic(modelId.replace('anthropic/', ''));
      }
      if (gateway) {
        console.log('[Gateway] Falling back to gateway for Anthropic model:', modelId);
        return gateway(modelId);
      }
      throw new Error('Neither ANTHROPIC_API_KEY nor AI_GATEWAY_API_KEY is configured');
    }

    // DeepSeek models (legacy support)
    if (modelId.startsWith('deepseek/')) {
      if (deepseek) {
        console.log('[Gateway] Using DeepSeek provider for:', modelId);
        return deepseek(modelId.replace('deepseek/', ''));
      }
      if (gateway) {
        console.log('[Gateway] Falling back to gateway for DeepSeek model:', modelId);
        return gateway(modelId);
      }
      throw new Error('Neither DEEPSEEK_API_KEY nor AI_GATEWAY_API_KEY is configured');
    }

    // Moonshot AI models (Kimi K2)
    if (modelId.startsWith('moonshotai/')) {
      if (gateway) {
        console.log('[Gateway] Using gateway for Moonshot model:', modelId);
        return gateway(modelId);
      }
      throw new Error('AI_GATEWAY_API_KEY is required for Moonshot AI models');
    }

    // Try gateway for other models
    if (gateway) {
      console.log('[Gateway] Using gateway for:', modelId);
      return gateway(modelId);
    }

    throw new Error(`Unsupported model ID: ${modelId} or missing configuration (Gateway/API Keys)`);
  },

  textEmbeddingModel(modelId: string): any {
    console.log('[Gateway] Requested embedding model:', modelId);

    // Only OpenAI embeddings supported (text-embedding-3-small)
    if (modelId.startsWith('openai/')) {
      // Prefer Gateway for OpenAI embeddings (for monitoring/caching)
      if (gateway) {
        console.log('[Gateway] Using gateway for embedding:', modelId);
        return gateway.textEmbeddingModel(modelId);
      }
      // Fallback to direct OpenAI
      if (openai) {
        console.log('[Gateway] Using direct OpenAI for embedding:', modelId);
        return openai.textEmbeddingModel(modelId.replace('openai/', ''));
      }
      throw new Error('Neither AI_GATEWAY_API_KEY nor OPENAI_API_KEY is configured for embeddings');
    }

    throw new Error(`Unsupported embedding model: ${modelId}. Only OpenAI embeddings are supported.`);
  },

  imageModel(modelId: string): any {
    console.log('[Gateway] Image generation requested for:', modelId);

    // Prefer Vercel AI Gateway for observability and routing
    if (gateway?.imageModel) {
      try {
        console.log('[Gateway] Using gateway image model for:', modelId);
        return gateway.imageModel(modelId as any);
      } catch (error) {
        console.warn('[Gateway] Gateway imageModel failed, falling back to direct providers', error);
      }
    }

    if (modelId.startsWith('google/')) {
      if (google) {
        console.log('[Gateway] Using Google provider for image:', modelId);
        return google(modelId.replace('google/', '')) as any;
      }
      throw new Error('Google API key required for image generation');
    }

    if (modelId.startsWith('openai/')) {
      if (openai?.image) {
        console.log('[Gateway] Using direct OpenAI for image:', modelId);
        return openai.image(modelId.replace('openai/', ''));
      }
      throw new Error('OpenAI API key required for image generation');
    }

    throw new Error(`Unsupported image model ID: ${modelId}`);
  }
};
