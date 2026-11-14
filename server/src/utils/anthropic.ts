const MAX_RESPONSE_BYTES = 512 * 1024;
const REQUEST_TIMEOUT_MS = 15_000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const unavailable = () => Object.assign(new Error('AI service unavailable. Please try again later.'), { statusCode: 503 });

/** Read an upstream response with a hard byte budget, including chunked bodies. */
const readJson = async (response: Response): Promise<unknown> => {
  if (!response.body) throw unavailable();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw unavailable();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

/**
 * Native Node fetch; configured providers are attempted in a deterministic order.
 * Callers must validate the domain-specific structure of the returned JSON object.
 */
export async function askFeatherlessJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4000
): Promise<T> {
  if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 4000) {
    throw new Error('AI token budget must be an integer between 1 and 4000');
  }
  const providers = [
    { name: 'Featherless', url: 'https://api.featherless.ai/v1/chat/completions', key: process.env.FEATHERLESS_API_KEY, model: process.env.FEATHERLESS_MODEL || 'deepseek-ai/DeepSeek-V3.2' },
    { name: 'OpenRouter', url: 'https://openrouter.ai/api/v1/chat/completions', key: process.env.OPENROUTER_API_KEY, model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat' },
  ].filter((provider) => provider.key);
  if (!providers.length) throw unavailable();
  const enrichedSystem = `${systemPrompt}\nReturn ONLY a valid JSON object. Do not wrap it in markdown or include a preamble.`;

  for (const provider of providers) {
    try {
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.key}` },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        redirect: 'error',
        body: JSON.stringify({
          model: provider.model,
          max_tokens: maxTokens,
          temperature: 0.1,
          messages: [{ role: 'system', content: enrichedSystem }, { role: 'user', content: userPrompt }],
          response_format: { type: 'json_object' },
        }),
      });
      if (!response.ok) {
        await response.body?.cancel();
        throw unavailable();
      }
      const data = await readJson(response);
      const choice = isRecord(data) && Array.isArray(data.choices) ? data.choices[0] : undefined;
      const message = isRecord(choice) && isRecord(choice.message) ? choice.message : undefined;
      if (!message || typeof message.content !== 'string' || message.content.length > 64 * 1024) {
        throw unavailable();
      }
      const content = message.content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed: unknown = JSON.parse(content);
      if (!isRecord(parsed)) throw unavailable();
      return parsed as T;
    } catch {
      // Provider bodies may contain private prompts or credentials. Never log them.
      console.warn(`[${provider.name}] AI request failed`);
    }
  }
  throw unavailable();
}
