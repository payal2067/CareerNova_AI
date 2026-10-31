import axios from "axios";

// Cache the last verified working model to avoid repeated failover latency
let activeWorkingModel = null;

/**
 * Returns an ordered deduplicated list of candidate Gemini models to try.
 */
export const getCandidateModels = () => {
  const envModel = process.env.GEMINI_MODEL?.trim();
  // Filter out known deprecated/broken models (e.g., gemini-2.5-flash)
  const validEnvModel =
    envModel && !/gemini-2\.5-flash/i.test(envModel) ? envModel : null;

  const pool = [
    activeWorkingModel,
    validEnvModel,
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
  ].filter(Boolean);

  return Array.from(new Set(pool));
};

/**
 * Executes a Gemini generateContent request with automatic multi-model failover.
 * If the active or configured model returns 404 (model not found/deprecated) or 400,
 * it automatically falls back to alternative stable models (gemini-1.5-flash, gemini-2.0-flash, etc.).
 */
export const callGeminiWithFallback = async (
  apiKey,
  prompt,
  generationConfig = {},
  timeoutMs = 45000
) => {
  const key = apiKey || process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured in .env");
  }

  const models = getCandidateModels();
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
      };

      if (generationConfig && Object.keys(generationConfig).length > 0) {
        // Clone generationConfig and remove thinkingConfig if calling flash models that don't support it
        const cleanConfig = { ...generationConfig };
        if (cleanConfig.thinkingConfig && !model.includes("pro")) {
          delete cleanConfig.thinkingConfig;
        }
        payload.generationConfig = cleanConfig;
      }

      const response = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: timeoutMs,
      });

      const data = response.data;
      if (!data) throw new Error(`Empty response from Gemini model ${model}`);
      if (data.error) throw new Error(data.error.message || `Error from model ${model}`);
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error(
          `No candidates returned by model ${model}. Block reason: ${data.promptFeedback?.blockReason || "Unknown"}`
        );
      }

      const candidate = data.candidates[0];
      const text = candidate.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error(
          `Empty candidate text from model ${model}. Finish reason: ${candidate.finishReason || "Unknown"}`
        );
      }

      // Successfully resolved: cache this working model for future calls
      activeWorkingModel = model;
      return { text, model };
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      const errorMsg = err.response?.data?.error?.message || err.message;

      // Failover on 404 (Not Found), 400 (Deprecated / Invalid Model), or 429 (Rate Limit)
      if (
        status === 404 ||
        status === 400 ||
        status === 429 ||
        /not found|no longer available|unsupported|deprecated|resource has been exhausted/i.test(errorMsg)
      ) {
        console.warn(
          `⚠️ Model "${model}" failed (${status || "error"}: ${errorMsg}). Falling back to next candidate model...`
        );
        continue;
      }

      console.warn(`⚠️ Model "${model}" warning: ${errorMsg}. Trying next model...`);
    }
  }

  throw new Error(`All Gemini models failed. Last error: ${lastError?.message || "Unknown"}`);
};

export default callGeminiWithFallback;

