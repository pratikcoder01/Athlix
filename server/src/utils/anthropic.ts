import fetch from 'node-fetch';

/**
 * Shared utility helper for interacting with the OpenAI-compatible Featherless.ai Messages API.
 * Leverages the model configured via FEATHERLESS_MODEL environment variable (defaults to deepseek-ai/DeepSeek-V3.2).
 * Enforces JSON output and strips markdown fences cleanly.
 */
export async function askFeatherlessJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4000
): Promise<T> {
  const featherlessKey = process.env.FEATHERLESS_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!featherlessKey && !openRouterKey) {
    throw new Error('At least one of FEATHERLESS_API_KEY or OPENROUTER_API_KEY environment variables must be set');
  }

  // System instruction to strictly demand JSON formatting
  const enrichedSystem = `${systemPrompt}\nReturn ONLY a valid JSON object. Do NOT wrap it in markdown block quotes (no \`\`\`json code blocks). Do NOT output any preamble, extra text, or conversation context. Return pure parsable JSON text.`;

  // Define providers
  const providers = [];
  
  if (featherlessKey) {
    providers.push({
      name: 'Featherless',
      url: 'https://api.featherless.ai/v1/chat/completions',
      key: featherlessKey,
      model: process.env.FEATHERLESS_MODEL || 'deepseek-ai/DeepSeek-V3.2'
    });
  }

  if (openRouterKey) {
    providers.push({
      name: 'OpenRouter',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: openRouterKey,
      model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat'
    });
  }

  // Shuffle providers for basic load distribution if both exist
  if (providers.length > 1 && Math.random() > 0.5) {
    providers.reverse();
  }

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.key}`,
          ...(provider.name === 'OpenRouter' && {
            'HTTP-Referer': 'https://athlix.com',
            'X-Title': 'Athlix Premium',
          })
        },
        body: JSON.stringify({
          model: provider.model,
          max_tokens: maxTokens,
          temperature: 0.1,
          messages: [
            { role: 'system', content: enrichedSystem },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${provider.name} API Error (Status ${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as any;
      let content = data.choices?.[0]?.message?.content || '';

      // Strip out markdown code block fences if returned
      content = content.replace(/^```json\s*/i, '');
      content = content.replace(/^```\s*/i, '');
      content = content.replace(/\s*```$/i, '');
      content = content.trim();

      const parsedJson = JSON.parse(content) as T;
      return parsedJson;
    } catch (error: any) {
      console.warn(`⚠️ [${provider.name}] Attempt Failed:`, error.message);
      lastError = error;
      // If there's another provider in the array, it will try the next one automatically!
    }
  }

  // If all providers failed, throw the last error
  console.error('💥 All AI Providers Failed. Last Error:', lastError?.message);
  throw lastError || new Error('AI Providers unavailable');
}
