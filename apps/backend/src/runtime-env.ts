/** Read deployment env directly from the process — do not rely on Nest's validate(config) payload. */
export function readRuntimeEnv(): Record<string, unknown> {
  return {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    FRONTEND_URL: process.env.FRONTEND_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };
}

export function openAiKeyFromProcessEnv(): string {
  return process.env.OPENAI_API_KEY?.trim() ?? '';
}
