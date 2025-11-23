/**
 * Gradio AI Content Detector
 * 
 * Uses the Hugging Face Gradio API to detect AI-generated content
 * Primary replacement for Winston AI detector
 */

import { Client } from "@gradio/client";

export interface GradioAIDetectionResult {
  aiLikelihood: number;
  humanLikelihood: number;
  score: number; // Normalized 0-100 where higher = more AI-like
  humanProbability: number;
}

/**
 * Detect AI-generated content using Gradio API
 * Returns AI likelihood score (0-100, higher = more likely AI)
 */
export async function detectAIContentWithGradio(
  text: string
): Promise<GradioAIDetectionResult> {
  try {
    console.log('[Gradio AI] Detecting AI content...');
    
    const client = await Client.connect("Hiridharan10/ai_content_detector_20025");
    
    const result = await client.predict("/classify_text", { 
      text: text
    });
    
    // Result format: [aiLikelihood%, humanLikelihood%]
    const aiPercentage = parseFloat(result.data[0]);
    const humanPercentage = parseFloat(result.data[1]);
    
    console.log('[Gradio AI] Detection complete:', {
      aiLikelihood: aiPercentage,
      humanLikelihood: humanPercentage
    });
    
    return {
      aiLikelihood: aiPercentage,
      humanLikelihood: humanPercentage,
      score: aiPercentage, // Already 0-100 format
      humanProbability: humanPercentage
    };
  } catch (error) {
    console.error('[Gradio AI] Detection failed:', error);
    // Return conservative default
    return {
      aiLikelihood: 80,
      humanLikelihood: 20,
      score: 80,
      humanProbability: 20
    };
  }
}

