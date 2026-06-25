import fetch from 'node-fetch';

/**
 * Shared utility helper for interacting with the OpenAI-compatible Featherless.ai Messages API.
 * Leverages deepseek-ai/DeepSeek-V3.2 as default model.
 * Enforces JSON output and strips markdown fences cleanly.
 */
export async function askClaudeJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4000
): Promise<T> {
  const apiKey = process.env.FEATHERLESS_API_KEY;
  if (!apiKey) {
    throw new Error('FEATHERLESS_API_KEY environment variable is required but not set');
  }
  const model = process.env.FEATHERLESS_MODEL || 'deepseek-ai/DeepSeek-V3.2';

  // System instruction to strictly demand JSON formatting
  const enrichedSystem = `${systemPrompt}\nReturn ONLY a valid JSON object. Do NOT wrap it in markdown block quotes (no \`\`\`json code blocks). Do NOT output any preamble, extra text, or conversation context. Return pure parsable JSON text.`;

  try {
    const response = await fetch('https://api.featherless.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        max_tokens: maxTokens,
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: enrichedSystem,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Featherless API Error (Status ${response.status}): ${errorText}`);
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
    console.error('💥 Shared Featherless Helper Error:', error.message);
    throw error;
  }
}
