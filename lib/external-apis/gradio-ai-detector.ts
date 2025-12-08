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
 * Uses SzegedAI/AI_Detector space
 */
export async function detectAIContentWithGradio(
  text: string
): Promise<GradioAIDetectionResult> {
  try {
    console.log('[Gradio AI] Detecting AI content...');
    
    const client = await Client.connect("SzegedAI/AI_Detector");
    
    const result = await client.predict("/classify_text", { 
      text: text
    });
    
    // Result format: List of 2 elements
    // [0] String: "**The text is** <span ...>**PERCENT%** likely <b>LABEL written</b>.</span>"
    // [1] Plot object (ignored)
    
    const resultString = (result.data as unknown[])[0] as string;
    console.log('[Gradio AI] Raw result:', resultString);

    // Extract percentage
    const percentageMatch = resultString.match(/\*\*([\d.]+)%\*\*/);
    const percentage = percentageMatch ? parseFloat(percentageMatch[1]) : 0;

    // Extract label (Human or AI)
    const labelMatch = resultString.match(/<b>(Human|AI)\s*written<\/b>/i);
    const label = labelMatch ? labelMatch[1].toLowerCase() : 'human'; // Default to human if parsing fails

    let aiLikelihood = 0;
    let humanLikelihood = 0;

    if (label === 'ai') {
      aiLikelihood = percentage;
      humanLikelihood = 100 - percentage;
    } else {
      // Label is Human
      humanLikelihood = percentage;
      aiLikelihood = 100 - percentage;
    }
    
    console.log('[Gradio AI] Detection complete:', {
      label,
      percentage,
      aiLikelihood,
      humanLikelihood
    });
    
    return {
      aiLikelihood,
      humanLikelihood,
      score: aiLikelihood, // Normalized 0-100 where higher = more AI-like
      humanProbability: humanLikelihood
    };
  } catch (error) {
    console.error('[Gradio AI] Detection failed:', error);
    // Return conservative default
    return {
      aiLikelihood: 50, // Uncertain
      humanLikelihood: 50,
      score: 50,
      humanProbability: 50
    };
  }
}

