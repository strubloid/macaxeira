# macaxeira

A one-screen prompt-to-image studio. You type a rough idea, a local Ollama model
rewrites it into a rich image prompt, and the image is rendered by Pollinations.

The twist: the prompt is not thrown at the image model raw. Your own local model
acts as the "prompt alchemist", and the app shows you the exact prompt it used so
you can copy it, tweak it, or remix the seed.

## Why not Ollama image generation?

Ollama's image generation was an experimental, macOS-only feature (January 2026,
`x/z-image-turbo` and `x/flux2-klein`). It was temporarily removed in Ollama
v0.32.6 (August 2026) and is still not available on Linux as of November 2026.
The Ollama instance on this machine is v0.22.0 and only has text models.

So this app splits the job:

- **Prompt writing** → your local Ollama text model (`/api/generate`).
- **Image rendering** → Pollinations' free image endpoint, which needs no API key.

If Ollama is not running, the app still works; it just sends your words to the
renderer directly. The header shows whether the local model was found.

## Why is there a small server?

Pollinations rejects requests that look like they come from a browser (it asks
for a Cloudflare Turnstile token), but accepts the same request from a
server-side client. The tiny Node server in `server.js`:

- serves the Vite app in development (Vite middleware) and the built app in
  production,
- proxies `GET /api/image` to Pollinations without browser headers,
- keeps an optional `POLLINATIONS_TOKEN` on the server instead of the bundle.

No database, no accounts, no keys required.

## Stack

- Vite + React 19 + TypeScript
- Node + Express for the image proxy and static serving
- Plain CSS with OKLCH tokens (no Tailwind/shadcn setup)
- Ollama HTTP API for prompt enhancement
- Pollinations HTTP API for image generation

## Requirements

- Node.js 20.19+ or 22.12+
- Ollama running locally (optional, recommended) with at least one text model
- Internet access for the image renderer

## Run

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. This starts `server.js`, which boots Vite in
middleware mode.

To make the "Alchemize the prompt" step work, Ollama must be running:

```bash
ollama serve
ollama pull qwen3.5:9b   # or use any text model you already have
```

The app reads `http://localhost:11434/api/tags` on load. If the model list
appears in the header and the model dropdown, alchemy is available.

If you run the app on a different origin and Ollama rejects the request, start
Ollama with that origin allowed:

```bash
OLLAMA_ORIGINS=http://localhost:5173 ollama serve
```

## Production

```bash
npm run build
npm start
```

`npm start` serves `dist/` and the `/api/image` proxy on port `5173` (or `PORT`).
`npm run preview` does both in one go.

## How a render works

1. You type an idea and pick a style and frame.
2. `buildPrompt()` appends style/camera/lighting language to your idea.
3. If alchemy is on, `enhancePrompt()` asks the local Ollama model to rewrite it
   into one vivid, concrete prompt (max ~80 words, `think: false`).
4. `buildImageUrl()` builds a local `/api/image` URL with the prompt, size, and
   seed.
5. `server.js` fetches the upstream image (IPv4, no browser headers) and streams
   it back.
6. `renderImage()` fetches the image as a blob, so loading and errors are real
   UI states rather than a broken `<img>`.
7. The app reads the actual returned dimensions and shows them with the prompt.

"Remix" re-renders the same prompt with a new seed. "Copy prompt" copies the
alchemized prompt. "Download" saves the generated JPEG.

## Configuration

Frontend values (Vite env vars in `.env.local`, not committed):

| Variable            | Default                  | Purpose                              |
| ------------------- | ------------------------ | ------------------------------------ |
| `VITE_OLLAMA_URL`   | `http://localhost:11434` | Ollama server                        |
| `VITE_OLLAMA_MODEL` | `qwen3.5:9b`             | Preferred model for prompt rewriting |

Server values (real environment variables):

| Variable              | Default                                | Purpose                                |
| --------------------- | -------------------------------------- | -------------------------------------- |
| `PORT`                | `5173`                                 | App and proxy port                     |
| `IMAGE_MODEL`         | `flux`                                 | Model name sent to Pollinations        |
| `POLLINATIONS_BASE`   | `https://image.pollinations.ai/prompt` | Image endpoint                         |
| `POLLINATIONS_TOKEN`  | empty                                  | Optional token for higher limits       |

Examples:

```bash
VITE_OLLAMA_MODEL=qwen3.6:27b npm run dev
PORT=3000 npm start
POLLINATIONS_TOKEN=your-token npm run dev
```

## Quality and limits

- The anonymous Pollinations tier currently serves the **Sana** model, even if
  `model=flux` is requested. It is rate-limited to roughly one new image every
  15–45 seconds and may add a watermark. A Pollinations token can unlock FLUX
  and better limits.
- The service caps requested dimensions (for example, `1024x1024` may come back
  as `768x768`). The app displays the real dimensions it received.
- Ollama's prompt rewriting is only as good as the selected text model. A 27B
  model usually writes a richer prompt than a 9B model, at the cost of speed.
- This is a demo, not a production image pipeline. The keyless endpoint is
  explicitly "borrowed time" per Pollinations' own documentation.

## Better quality later

See [`research.md`](./research.md) for the full comparison of free and local
options. The image work is isolated in `server.js` and `src/lib/image.ts`. If
you want stronger output:

1. **Pollinations token** — cheapest change; FLUX is a clear step up from Sana.
2. **Cloudflare Workers AI** — ~10,000 free neurons/day, FLUX.1 schnell; replace
   the upstream request in `server.js`.
3. **ComfyUI locally** — best control and privacy. Run ComfyUI, then replace the
   proxy's upstream call with `POST /prompt` + history polling. Keep the same UI.
4. **fal.ai / Replicate / Gemini** — paid, highest quality and fastest. Keep the
   key in `server.js` (never in the React bundle).

## Commands

```bash
npm run dev        # server.js + Vite middleware on :5173
npm run build      # typecheck + production build
npm start          # serve dist/ + proxy (production)
npm run preview    # build then start
npm run typecheck  # TypeScript only
```

## Structure

```
server.js            Express app, /api/image proxy, Vite/static serving
src/
  App.tsx            one screen: controls + stage + all UI states
  config.ts          Ollama defaults
  index.css          design tokens and layout
  lib/
    prompt.ts        styles, aspect ratios, Ollama prompt rewriting
    image.ts         local image URL builder + blob renderer
```
