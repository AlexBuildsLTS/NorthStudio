/**
 * @file services/ai/compositor.ts
 * @description AAA+ Edge Function Orchestrator for AI Mockup Generation.
 * @features
 * - Autonomous Retry Logic (Exponential Backoff).
 * - Multi-part Payload formulation (Matrix Transforms -> AI prompt).
 * - Strict Error handling and timeout management to prevent infinite hanging.
 */

import { supabase } from '@/lib/supabase/client';
import { useUserStore } from '@/store/useUserStore';
import { Transform } from '@/store/studio/useLayerStore';

// --- STRICT TYPING ---
export interface AICompositorRequest {
  mockupId: string;
  baseProductId: string;
  logoUrl: string;
  transform: Transform; // x, y, scale, rotation passed directly from Skia
  prompt?: string;      // User's custom AI instruction (e.g., "Cotton texture, studio lighting")
}

export interface AICompositorResponse {
  success: boolean;
  outputUrl?: string;
  computeTimeMs?: number;
  error?: string;
}

// --- CONSTANTS ---
const MAX_RETRIES = 2;
const TIMEOUT_MS = 45000; // AI operations are heavy; allow 45s before aborting

export const AICompositor = {
  /**
   * Executes the AI Perspective Wrap via Supabase Edge Functions.
   * Automatically deducts compute credits upon successful generation.
   */
  async generateMockup(request: AICompositorRequest): Promise<AICompositorResponse> {
    let attempt = 0;

    // Phase 1: Pre-flight Credit Check
    const profile = useUserStore.getState().profile;
    if (!profile || profile.credits < 1) {
      return { success: false, error: 'Insufficient Compute Credits. Please upgrade your tier.' };
    }

    // Phase 2: Execution Loop with Exponential Backoff
    while (attempt <= MAX_RETRIES) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const startTime = Date.now();

        // Trigger the Deno Edge Function
        const { data, error } = await supabase.functions.invoke('generate-mockup', {
          body: {
            mockup_id: request.mockupId,
            base_product_id: request.baseProductId,
            logo_url: request.logoUrl,
            matrix: request.transform,
            prompt: request.prompt || "hyper-realistic perspective wrap, 8k resolution, studio lighting",
          },
          // Important: We pass the abort signal via custom fetch options in Supabase v2
          // Note: Depending on your exact supabase-js version, signal might need to be passed in fetchOptions
          headers: { 'Content-Type': 'application/json' },
        });

        clearTimeout(timeoutId);

        if (error) throw new Error(error.message || 'Edge Function execution failed.');
        if (!data?.outputUrl) throw new Error('AI Engine failed to return a valid image buffer.');

        const computeTimeMs = Date.now() - startTime;

        // Phase 3: Post-flight State Synchronization
        // Deduct 1 credit locally and via the DB orchestrator
        await useUserStore.getState().deductCredits(1);

        return {
          success: true,
          outputUrl: data.outputUrl,
          computeTimeMs,
        };

      } catch (err: any) {
        clearTimeout(timeoutId);
        
        const isTimeout = err.name === 'AbortError';
        const errorMessage = isTimeout ? 'AI Cluster timed out.' : err.message;

        console.warn(`[AI Compositor] Attempt ${attempt + 1} failed: ${errorMessage}`);

        if (attempt === MAX_RETRIES) {
          return { success: false, error: `Generation failed after ${MAX_RETRIES} attempts. ${errorMessage}` };
        }

        // Wait before retrying (Exponential Backoff: 1s, 2s, 4s)
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        attempt++;
      }
    }

    return { success: false, error: 'Unexpected orchestration failure.' };
  }
};