const env = import.meta.env as Record<string, string | undefined>;

export const config = {
  ollamaUrl: env.VITE_OLLAMA_URL ?? "http://localhost:11434",
  ollamaModel: env.VITE_OLLAMA_MODEL ?? "qwen3.5:9b",
};
