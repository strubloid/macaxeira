export const STYLE_PRESETS = [
  {
    id: "photo",
    label: "Photo",
    suffix:
      "photorealistic, natural lighting, 35mm film grain, shallow depth of field",
  },
  {
    id: "cinematic",
    label: "Cinematic",
    suffix:
      "cinematic still, dramatic lighting, anamorphic lens, rich color grading",
  },
  {
    id: "illustration",
    label: "Illustration",
    suffix:
      "hand-painted illustration, expressive brushwork, textured paper",
  },
  {
    id: "3d",
    label: "3D",
    suffix: "stylized 3D render, soft studio lighting, high detail",
  },
  {
    id: "anime",
    label: "Anime",
    suffix:
      "anime key visual, clean line art, vibrant cel shading, detailed background",
  },
  {
    id: "product",
    label: "Product",
    suffix:
      "commercial product photography, seamless backdrop, crisp highlights, studio softbox",
  },
] as const;

export type StyleId = (typeof STYLE_PRESETS)[number]["id"];

export const ASPECTS = [
  { id: "square", label: "1:1", width: 1024, height: 1024 },
  { id: "landscape", label: "3:2", width: 1152, height: 768 },
  { id: "portrait", label: "2:3", width: 768, height: 1152 },
  { id: "wide", label: "16:9", width: 1280, height: 720 },
  { id: "tall", label: "9:16", width: 720, height: 1280 },
] as const;

export type AspectId = (typeof ASPECTS)[number]["id"];

export function randomSeed() {
  return Math.floor(Math.random() * 1_000_000_000);
}

export function buildPrompt(idea: string, styleId: StyleId) {
  const style = STYLE_PRESETS.find((preset) => preset.id === styleId);
  const cleanIdea = idea.trim().replace(/[.\s]+$/, "");
  return style ? `${cleanIdea}. ${style.suffix}` : cleanIdea;
}

export async function listOllamaModels(
  baseUrl: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const response = await fetch(`${baseUrl}/api/tags`, { signal });
  if (!response.ok) {
    throw new Error(`Ollama responded with ${response.status}.`);
  }
  const data = (await response.json()) as {
    models?: Array<{ name?: string }>;
  };
  return (data.models ?? [])
    .map((model) => model.name)
    .filter((name): name is string => Boolean(name));
}

type EnhanceInput = {
  idea: string;
  styleId: StyleId;
  model: string;
  baseUrl: string;
  signal: AbortSignal;
};

export async function enhancePrompt({
  idea,
  styleId,
  model,
  baseUrl,
  signal,
}: EnhanceInput): Promise<string> {
  const style = STYLE_PRESETS.find((preset) => preset.id === styleId);

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      model,
      stream: false,
      think: false,
      system:
        "You are an image prompt engineer. Rewrite the user's idea into one vivid, concrete prompt for a text-to-image model. Keep the subject, then add camera, lighting, composition, texture, and mood. Respect the requested style. Return only the prompt, no labels, no quotation marks, no preamble. Maximum 80 words.",
      prompt: `Idea: ${idea}\nStyle: ${style?.label ?? "cinematic"}`,
      options: {
        temperature: 0.9,
        top_p: 0.9,
        num_predict: 180,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama responded with ${response.status}.`);
  }

  const data = (await response.json()) as { response?: string };
  const prompt = (data.response ?? "")
    .trim()
    .replace(/^prompt:\s*/i, "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim();

  if (!prompt) {
    throw new Error("The local model returned an empty prompt.");
  }

  return prompt;
}
