type ImageRequest = {
  prompt: string;
  width: number;
  height: number;
  seed: number;
};

export function buildImageUrl({ prompt, width, height, seed }: ImageRequest) {
  const params = new URLSearchParams({
    prompt,
    width: String(width),
    height: String(height),
    seed: String(seed),
  });

  return `/api/image?${params.toString()}`;
}

export async function renderImage(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    const retryAfter = response.headers.get("retry-after");
    let detail = "";

    try {
      const data = (await response.json()) as {
        error?: string | { message?: string };
      };
      detail =
        typeof data.error === "string"
          ? data.error
          : (data.error?.message ?? "");
    } catch {
      detail = "";
    }

    if (response.status === 402) {
      throw new Error(
        retryAfter
          ? `The free image tier is cooling down. Try again in ${retryAfter} seconds.`
          : "The free image tier is rate-limited. Wait a few seconds and try again.",
      );
    }

    throw new Error(detail || `The image service returned ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error("The image service returned something that wasn't an image.");
  }

  return response.blob();
}
