import fetch from 'node-fetch';

/**
 * Shared utility helper for interacting with the Anthropic Messages API.
 * Leverages claude-3-5-sonnet-latest or claude-3-5-sonnet-20241022 as fallback.
 * Enforces JSON output and strips markdown fences cleanly.
 */
export async function askClaudeJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4000
): Promise<T> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('❌ ANTHROPIC_API_KEY is not defined in environment variables.');
  }

  // System instruction to strictly demand JSON formatting
  const enrichedSystem = `${systemPrompt}\nReturn ONLY a valid JSON object. Do NOT wrap it in markdown block quotes (no \`\`\`json code blocks). Do NOT output any preamble, extra text, or conversation context. Return pure parsable JSON text.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: maxTokens,
        system: enrichedSystem,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API Error (Status ${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as any;
    let content = data.content?.[0]?.text || '';

    // Strip out markdown code block fences if Claude returned them
    content = content.replace(/^```json\s*/i, '');
    content = content.replace(/^```\s*/i, '');
    content = content.replace(/\s*```$/i, '');
    content = content.trim();

    const parsedJson = JSON.parse(content) as T;
    return parsedJson;
  } catch (error: any) {
    console.error('💥 Shared Anthropic Helper Error:', error.message);
    throw error;
  }
}
