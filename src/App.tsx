import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { config } from "./config";
import { buildImageUrl, renderImage } from "./lib/image";
import {
  ASPECTS,
  STYLE_PRESETS,
  buildPrompt,
  enhancePrompt,
  listOllamaModels,
  randomSeed,
} from "./lib/prompt";
import type { AspectId, StyleId } from "./lib/prompt";

type Phase = "idle" | "enhancing" | "rendering" | "done" | "error";

type Generation = {
  imageUrl: string;
  prompt: string;
  idea: string;
  style: StyleId;
  seed: number;
  width: number;
  height: number;
  enhanced: boolean;
  mime: string;
};

type RenderInput = {
  prompt: string;
  seed: number;
  enhanced: boolean;
  styleId: StyleId;
  idea: string;
  width: number;
  height: number;
};

export function App() {
  const [idea, setIdea] = useState("");
  const [style, setStyle] = useState<StyleId>("cinematic");
  const [aspect, setAspect] = useState<AspectId>("square");
  const [enhance, setEnhance] = useState(true);
  const [model, setModel] = useState(config.ollamaModel);
  const [models, setModels] = useState<string[]>([]);
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const imageUrlRef = useRef<string | null>(null);

  const busy = phase === "enhancing" || phase === "rendering";

  const examples = [
    "A lighthouse keeper's cottage swallowed by wildflowers at dusk",
    "Portrait of an astronaut botanist tending a garden on Mars",
    "A tiny street food stall floating in the clouds, rain below",
    "An old bookshop where the shelves grow into trees",
  ];

  const activeStyle =
    STYLE_PRESETS.find((preset) => preset.id === generation?.style)?.label ?? "";

  useEffect(() => {
    const controller = new AbortController();

    listOllamaModels(config.ollamaUrl, controller.signal)
      .then((names) => {
        setModels(names);
        setOllamaOnline(true);
        setModel((current) =>
          names.includes(current) ? current : (names[0] ?? current),
        );
      })
      .catch(() => setOllamaOnline(false));

    return () => controller.abort();
  }, []);

  useEffect(() => {
    return () => {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }
    };
  }, []);

  function startRequest() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    return controller;
  }

  async function generateImage(input: RenderInput) {
    const controller = startRequest();
    setError(null);
    setCopied(false);
    setPhase("rendering");

    try {
      const url = buildImageUrl({
        prompt: input.prompt,
        width: input.width,
        height: input.height,
        seed: input.seed,
      });
      const blob = await renderImage(url, controller.signal);
      const objectUrl = URL.createObjectURL(blob);

      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }
      imageUrlRef.current = objectUrl;

      let width = input.width;
      let height = input.height;
      const bitmap = await createImageBitmap(blob).catch(() => null);

      if (bitmap) {
        width = bitmap.width;
        height = bitmap.height;
        bitmap.close();
      }

      setGeneration({
        imageUrl: objectUrl,
        prompt: input.prompt,
        idea: input.idea,
        style: input.styleId,
        seed: input.seed,
        width,
        height,
        enhanced: input.enhanced,
        mime: blob.type || "image/jpeg",
      });
      setPhase("done");
    } catch (cause) {
      if (controller.signal.aborted) {
        return;
      }
      setError(
        cause instanceof Error
          ? cause.message
          : "The image could not be rendered.",
      );
      setPhase("error");
    }
  }

  async function handleGenerate(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (busy) {
      return;
    }

    const trimmed = idea.trim();
    if (!trimmed) {
      setError("Write a few words first. A feeling is enough.");
      setPhase("error");
      return;
    }

    setError(null);
    setNotice(null);

    const chosenAspect =
      ASPECTS.find((option) => option.id === aspect) ?? ASPECTS[0];
    let prompt = buildPrompt(trimmed, style);
    let enhanced = false;

    if (enhance && ollamaOnline) {
      const controller = startRequest();
      setPhase("enhancing");

      try {
        prompt = await enhancePrompt({
          idea: trimmed,
          styleId: style,
          model,
          baseUrl: config.ollamaUrl,
          signal: controller.signal,
        });
        enhanced = true;
      } catch (cause) {
        if (controller.signal.aborted) {
          return;
        }
        setNotice(
          "The local model didn't answer, so your words went straight to the renderer.",
        );
      }
    }

    await generateImage({
      prompt,
      seed: randomSeed(),
      enhanced,
      styleId: style,
      idea: trimmed,
      width: chosenAspect.width,
      height: chosenAspect.height,
    });
  }

  async function handleRemix() {
    if (!generation || busy) {
      return;
    }

    setNotice(null);
    await generateImage({
      prompt: generation.prompt,
      seed: randomSeed(),
      enhanced: generation.enhanced,
      styleId: generation.style,
      idea: generation.idea,
      width: generation.width,
      height: generation.height,
    });
  }

  function handleDownload() {
    if (!generation) {
      return;
    }

    const extension = generation.mime.includes("png") ? "png" : "jpg";
    const link = document.createElement("a");
    link.href = generation.imageUrl;
    link.download = `macaxeira-${generation.seed}.${extension}`;
    link.click();
  }

  async function handleCopy() {
    if (!generation) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generation.prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setNotice("Clipboard access was blocked by the browser.");
    }
  }

  function handleSurprise() {
    const nextIdea = examples[Math.floor(Math.random() * examples.length)];
    const nextStyle =
      STYLE_PRESETS[Math.floor(Math.random() * STYLE_PRESETS.length)];

    setIdea(nextIdea);
    setStyle(nextStyle.id);
    setError(null);
    setPhase(generation ? "done" : "idle");
    textareaRef.current?.focus();
  }

  function handleIdeaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void handleGenerate();
    }
  }

  function dismissError() {
    setError(null);
    setPhase(generation ? "done" : "idle");
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <SparkleMark />
          <span className="brand__name">macaxeira</span>
          <span className="brand__tag">prompt alchemy</span>
        </div>
        <div
          className={`status ${
            ollamaOnline === null
              ? "status--checking"
              : ollamaOnline
                ? "status--online"
                : "status--offline"
          }`}
          role="status"
          title={
            ollamaOnline === false
              ? "Start Ollama and reload to enable prompt alchemy."
              : undefined
          }
        >
          <span className="status__dot" aria-hidden="true" />
          {ollamaOnline === null
            ? "Checking local model"
            : ollamaOnline
              ? "Local model ready"
              : "Local model offline"}
        </div>
      </header>

      <main className="workspace">
        <form className="panel" onSubmit={handleGenerate}>
          <div className="field">
            <div className="field__head">
              <label htmlFor="idea">Your idea</label>
              <button
                type="button"
                className="link-button"
                onClick={handleSurprise}
                disabled={busy}
              >
                <SparkleIcon />
                Surprise me
              </button>
            </div>
            <textarea
              id="idea"
              ref={textareaRef}
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              onKeyDown={handleIdeaKeyDown}
              placeholder="A lighthouse keeper's cottage swallowed by wildflowers at dusk…"
              rows={5}
              maxLength={600}
            />
            <div className="field__meta">
              <span>{idea.trim().length}/600</span>
              <span>⌘/Ctrl ↵ to generate</span>
            </div>
          </div>

          <fieldset className="field">
            <legend>Style</legend>
            <div className="chips">
              {STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="chip"
                  aria-pressed={style === preset.id}
                  onClick={() => setStyle(preset.id)}
                  disabled={busy}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="field">
            <legend>Frame</legend>
            <div className="chips">
              {ASPECTS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="chip"
                  aria-pressed={aspect === option.id}
                  onClick={() => setAspect(option.id)}
                  disabled={busy}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="alchemy">
            <label className="switch">
              <input
                type="checkbox"
                checked={enhance && ollamaOnline !== false}
                onChange={(event) => setEnhance(event.target.checked)}
                disabled={ollamaOnline === false || busy}
              />
              <span className="switch__track" aria-hidden="true">
                <span className="switch__thumb" />
              </span>
              <span className="switch__copy">
                <span className="switch__title">Alchemize the prompt</span>
                <span className="switch__hint">
                  A local model rewrites your idea before rendering.
                </span>
              </span>
            </label>
            <label className="select">
              <span>Model</span>
              <select
                value={model}
                onChange={(event) => setModel(event.target.value)}
                disabled={!ollamaOnline || busy}
              >
                {models.length === 0 ? (
                  <option value={model}>{model}</option>
                ) : (
                  models.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))
                )}
              </select>
            </label>
          </div>

          {notice ? (
            <p className="notice" role="status">
              {notice}
            </p>
          ) : null}

          <button
            type="submit"
            className="generate"
            disabled={busy || idea.trim().length === 0}
          >
            {busy
              ? phase === "enhancing"
                ? "Alchemizing…"
                : "Rendering…"
              : "Generate image"}
            <kbd>↵</kbd>
          </button>

          <p className="fineprint">
            Rendered by{" "}
            <a href="https://pollinations.ai" target="_blank" rel="noreferrer">
              Pollinations
            </a>
            . Prompts refined by your local Ollama model. The free image tier
            allows roughly one render every 15 seconds.
          </p>
        </form>

        <section className="stage" aria-label="Generated image" aria-busy={busy}>
          {phase === "error" ? (
            <div className="state state--error" role="alert">
              <AlertIcon />
              <h2>That didn't render</h2>
              <p>{error}</p>
              <div className="state__actions">
                <button type="button" className="button" onClick={dismissError}>
                  Dismiss
                </button>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => void handleGenerate()}
                  disabled={!idea.trim()}
                >
                  Try again
                </button>
              </div>
            </div>
          ) : generation && !busy ? (
            <figure className="result">
              <img
                src={generation.imageUrl}
                alt={`Generated image for: ${generation.idea}`}
                style={{
                  aspectRatio: `${generation.width} / ${generation.height}`,
                }}
              />
              <figcaption className="recipe">
                <div className="recipe__meta">
                  <span
                    className={`badge ${
                      generation.enhanced ? "badge--alchemy" : ""
                    }`}
                  >
                    {generation.enhanced ? "Alchemized" : "Direct"}
                  </span>
                  <span>
                    {generation.width} × {generation.height}
                  </span>
                  <span>seed {generation.seed}</span>
                  <span>{activeStyle}</span>
                </div>
                <p className="recipe__prompt">{generation.prompt}</p>
                <div className="recipe__actions">
                  <button
                    type="button"
                    className="button"
                    onClick={() => void handleCopy()}
                  >
                    {copied ? "Copied" : "Copy prompt"}
                  </button>
                  <button
                    type="button"
                    className="button"
                    onClick={() => void handleRemix()}
                  >
                    Remix
                  </button>
                  <button
                    type="button"
                    className="button"
                    onClick={handleDownload}
                  >
                    Download
                  </button>
                </div>
              </figcaption>
            </figure>
          ) : busy ? (
            <div className="state state--loading" role="status">
              <SparkleMark className="pulse-mark" />
              <h2>
                {phase === "enhancing"
                  ? "Alchemizing your idea"
                  : "Rendering your image"}
              </h2>
              <p>
                {phase === "enhancing"
                  ? "The local model is writing a richer prompt…"
                  : "Usually a few seconds. The free tier can take a little longer."}
              </p>
            </div>
          ) : (
            <div className="state state--empty">
              <div className="state__art" aria-hidden="true">
                <SparkleMark />
              </div>
              <h1>A rough idea is enough.</h1>
              <p>
                Write a feeling. Your local model turns it into a rich prompt,
                then the renderer makes the image.
              </p>
              <div className="examples">
                <span>try one</span>
                <div className="chips">
                  {examples.map((example) => (
                    <button
                      key={example}
                      type="button"
                      className="chip chip--example"
                      onClick={() => {
                        setIdea(example);
                        textareaRef.current?.focus();
                      }}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
              <ol className="steps">
                <li>
                  <span>1</span> Write an idea
                </li>
                <li>
                  <span>2</span> Alchemize it locally
                </li>
                <li>
                  <span>3</span> Render the frame
                </li>
              </ol>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function SparkleMark({ className }: { className?: string }) {
  return (
    <svg
      className={className ? `mark ${className}` : "mark"}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 2c.6 4.9 2.1 6.4 7 7-4.9.6-6.4 2.1-7 7-.6-4.9-2.1-6.4-7-7 4.9-.6 6.4-2.1 7-7Z"
        fill="currentColor"
      />
      <path
        d="M18.6 14.4c.3 2.2 1 2.9 3.2 3.2-2.2.3-2.9 1-3.2 3.2-.3-2.2-1-2.9-3.2-3.2 2.2-.3 2.9-1 3.2-3.2Z"
        fill="currentColor"
        opacity=".55"
      />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3c.5 4.2 1.8 5.5 6 6-4.2.5-5.5 1.8-6 6-.5-4.2-1.8-5.5-6-6 4.2-.5 5.5-1.8 6-6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 7.5v5.2M12 16.4v.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
