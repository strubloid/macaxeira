# Image generators to test now

Research date: **6 November 2026**. Target: replace the current Pollinations/Sana
render with something that actually follows a detailed prompt, ideally without
paying. Hardware available: **RTX 4070 Ti, 12 GB VRAM**, i9-11900F, 23 GB RAM.

## Short answer

There is no free API that matches ChatGPT Images 2.5/2.6 or Nano Banana 2.1
quality with unlimited use. The honest ranking is:

1. **Best free quality right now** — Google Gemini app (Nano Banana 2) or
   ChatGPT Free. Use these to judge what "good" looks like before integrating
   anything. Both are consumer apps, not APIs.
2. **Best free API to integrate** — **Cloudflare Workers AI, FLUX.2 [klein] 4B**.
   Apache 2.0, 4 steps, no credit card, roughly **80 images/day** inside the
   10,000-neuron free allowance. A clear upgrade from Sana.
3. **Best free "unlimited" API** — **AI Horde** (anonymous key, Flux.1 Schnell /
   Z-Image Turbo / SDXL). Queue-dependent and slower, but no account and no cap.
4. **Best local setup for 12 GB** — **ComfyUI + Z-Image Turbo FP8**, then
   FLUX.2 [klein] 4B FP8. Unlimited, private, no rate limits; quality is close to
   mid-tier hosted models but below Nano Banana 2.1.
5. **Best quality if you will pay ~$0.03/image** — **Gemini API Nano Banana 2.1**,
   or GPT Image 2.6 through **Puter.js** (user-pays, no developer key).

The current Pollinations classic endpoint still works anonymously, but it is
capped at **768×768**, one image per **45 s per IP**, adds a small logo, and
serves a weak model. It is a fallback, not the destination.

## Ranked options

### Tier 1 — test these first (free, no integration)

| Option | What you get | Free allowance | Catch |
| --- | --- | --- | --- |
| **Google Gemini app** (Nano Banana 2) | Best free prompt adherence and editing; 1K–4K, strong text | Free tier has "standard limits"; AI Studio is free to try | Consumer app, no free image API |
| **ChatGPT Free** (Images 2.5/2.6) | Best instruction following and text; up to 2048 px | ~2–5 images/24 h (unpublished, varies) | Rolling limit; slow at peak |
| **Bing Image Creator** | MAI-Image-2.5-Flash / MAI-Image-2e; good general quality | **15 fast/day**, then standard speed, **200 prompts/24 h** | Personal Microsoft account; watermark |
| **Qwen Chat** (`chat.qwen.ai`) | Qwen-Image 3.0; excellent multilingual text and dense layouts | Free account, unpublished fair-use caps | No seed/reproducibility |
| **Ideogram** | Best-in-class typography | ~10 generations/day | Weaker photoreal than Gemini/ChatGPT |
| **Grok Imagine** | Grok Imagine 2.0; fast, stylised | 2–4 images/day on some accounts | Watermark, account-cohort dependent, unreliable |

Use these to build a reference set. If Gemini/ChatGPT already gives you what you
want, the integration question becomes "how close can a free API get?", not
"which model is best?".

### Tier 2 — free APIs worth integrating

| Option | Model | Free allowance | Key/card | Quality | Notes |
| --- | --- | --- | --- | --- | --- |
| **Cloudflare Workers AI** | FLUX.2 [klein] 4B | ~**80 images/day** (10k neurons) | Account + API token, no card | Good; fast 4-step | Apache 2.0, commercial OK, OpenAI-compatible endpoint |
| Cloudflare Workers AI | FLUX.2 [klein] 9B | ~**7 images/day** | Same | Better detail | Non-commercial licence |
| Cloudflare Workers AI | FLUX.2 [dev] 32B | ~**1–2 images/day** | Same | Best Cloudflare quality | Non-commercial, slow, multipart form |
| Cloudflare Workers AI | FLUX.1 schnell | ~**170 images/day** | Same | Below Klein 4B | Cheapest per image, 4 steps |
| **AI Horde** | Flux.1 Schnell fp8, Z-Image Turbo, SDXL | No fixed cap; queue priority | Anonymous key `0000000000` | Good on Flux/Z-Image | No watermark; volunteer supply; can be slow |
| **Hugging Face ZeroGPU Spaces** | Whatever the Space runs (FLUX.2, Qwen-Image 2.1, Z-Image) | **5 min GPU/day** free account, 2 min anonymous | HF token for 5 min | Model-dependent | Great for testing exact checkpoints; Spaces can sleep/change |
| **OVHcloud AI Endpoints** | Stable Diffusion XL | Reported **2 req/min anonymous**, 400/min with key | None for anonymous | Dated | Zero-signup fallback; not ChatGPT-level |
| **Pollinations classic** | Sana (anonymous) | 1 image/45 s per IP | None | Weak | 768×768 cap, logo; current fallback |
| **Puter.js** | GPT Image 2.6, Nano Banana 2.1, FLUX.2, Grok, Qwen | User's free monthly allowance (reported ~$0.50 ≈ 15–20 GPT Image images) | User signs into Puter; no developer key | **Best available** | User-pays model; requires client-side sign-in |

Cloudflare image counts are estimates from the official neuron pricing:

- Klein 4B: `4 tiles × ($0.000059 in + $0.000287 out)` ≈ **$0.00138/image**
  → ~80 images per $0.11 free daily allowance.
- Klein 9B: ~$0.015 per 1 MP → ~7 images/day.
- FLUX.2 dev: ~$0.05–0.07 per 1024² at 20–28 steps → ~1–2 images/day.
- FLUX.1 schnell: ~$0.00063 per 1024² at 4 steps → ~170 images/day.

Puter.js is the sleeper option. It puts GPT Image 2.6, Nano Banana 2.1, FLUX.2,
Grok Imagine, and Qwen behind one browser call, with no API keys and no
developer bill. The trade-off: each user needs a Puter account and only gets the
free monthly allowance before topping up. For a single-user local app, that is
roughly 15–20 top-tier images per month free.

### Tier 3 — local, unlimited, private

ComfyUI is the reference runtime for all of these. The 4070 Ti's 12 GB is enough
if you use FP8 or GGUF and let the text encoder offload.

| Model | Licence | Steps / settings | VRAM on 12 GB | Quality | Verdict |
| --- | --- | --- | --- | --- | --- |
| **Z-Image Turbo 6B** | Apache 2.0 | 8 steps, CFG 1.0, euler/simple | FP8 ~8 GB; BF16 needs 14–16 GB | Strong prompt adherence, good text, photoreal | **Best local default** |
| **FLUX.2 [klein] 4B** | Apache 2.0 | 4 steps, CFG 1.0 | Distilled 8.4 GB; BF16 ~13 GB; FP8 ~4 GB + encoder | Less fine detail than Z-Image, better editing/multi-reference | **Best fast local / commercial** |
| FLUX.2 [klein] 9B | Non-commercial | 4 steps | 19.6 GB; FP8 ~15 GB | Better than 4B | Possible with offload, not ideal |
| Qwen-Image 2.1 7B | Research only | 20–40 steps | ~20 GB+; GGUF possible | Excellent text, editing | Licence blocks commercial; slow on 12 GB |
| FLUX.1 schnell 12B | Apache 2.0 | 4 steps | ~12 GB FP8/GGUF | Below Z-Image | Fallback |
| SDXL | OpenRAIL | 20–30 steps | ~6–8 GB | Dated prompt adherence | Only for LoRA ecosystem |
| Sana | Apache 2.0 | 1–4 steps | <8 GB | Current Pollinations model | Not an upgrade |

**Recommended local order:**

1. Z-Image Turbo FP8 + `qwen_3_4b` text encoder (FP8 if BF16 OOMs) + `ae.safetensors`.
2. FLUX.2 [klein] 4B FP8 + `qwen_3_4b` + `flux2-vae.safetensors`.
3. Keep SDXL only if you need a specific LoRA.

Z-Image setup notes:

```
ComfyUI/models/
├── diffusion_models/  z_image_turbo_fp8.safetensors   (or bf16 ~12.3 GB)
├── text_encoders/     qwen_3_4b.safetensors           (~8 GB BF16, FP8 available)
└── vae/               ae.safetensors
```

- 1024×1024, multiples of 16.
- 8 steps, CFG **1.0** (do not raise it; CFG 7 produces blown-out images).
- `euler` + `simple`, denoise 1.0.
- No negative prompt; it is ignored at CFG 1.
- On 12 GB, the BF16 Qwen3-4B encoder can OOM at prompt-encode time. Use the FP8
  encoder or `--lowvram`.

FLUX.2 Klein 4B setup notes:

```
ComfyUI/models/
├── diffusion_models/  flux-2-klein-4b-fp8.safetensors
├── text_encoders/     qwen_3_4b.safetensors
└── vae/               flux2-vae.safetensors
```

- 4 steps, CFG 1.0; distilled model, more steps buy nothing.
- FP8 file is ~4.07 GB; BF16 is ~7.75 GB; text encoder is the 8 GB stage.
- Apache 2.0, so it is the only FLUX.2 variant safe for commercial work.

### Tier 4 — cheap paid (only if free is not enough)

| Option | Price | Why |
| --- | --- | --- |
| Gemini API Nano Banana 2.1 | **$0.0336** / 1K image | Best quality-per-dollar, strong editing |
| Gemini API Nano Banana 2 | $0.067 / 1K | Slightly better than 2.1 in some cases |
| Gemini API Nano Banana Pro | $0.134 / 1–2K | Highest fidelity, text, complex scenes |
| GPT Image 2.6 via Puter | ~$0.0247 / image | ChatGPT-level instruction following |
| GPT Image 2.5 Flare via Puter | ~$0.0059 / image | Much cheaper, still good |
| Seedream 5 Lite via Orylia | 35 credits/image, 50 free/day | ~1 free image/day; strong multilingual text |

## What "ChatGPT-quality" actually costs

- **Free ChatGPT** gives you the model, but only a handful of images per day.
- **Free Gemini** gives you Nano Banana 2 in the consumer app, also limited.
- **Free APIs** are one tier below: FLUX.2 Klein 4B is good, not GPT Image 2.6.
- **Puter.js** is the only way to get GPT Image 2.6 / Nano Banana 2.1 into your
  own app without a developer key, but each user pays beyond a small free
  allowance.
- **Local Z-Image Turbo** is unlimited and private, but it is not Nano Banana
  quality. It is, however, clearly better than Sana and most SDXL setups.

## Test protocol

Use the same six prompts everywhere. Score 1–5 on each axis, and record time,
dimensions, and watermark.

| # | Prompt | What it tests |
| --- | --- | --- |
| 1 | "A red bicycle leaning against a blue door, a cat on the seat, morning light, 35mm photo" | Subject count, spatial relations, realism |
| 2 | "A café chalkboard reading 'FRESH BREAD — 2€' in neat handwriting" | Text rendering |
| 3 | "Close-up portrait of a 70-year-old fisherman, weathered skin, hands visible" | Anatomy, skin, hands |
| 4 | "Four rows of three round buttons on a control panel, labelled 1–12" | Counting and layout |
| 5 | "A poster in Portuguese and Japanese advertising a summer festival" | Multilingual text |
| 6 | "Same character, three expressions: happy, surprised, annoyed" | Consistency and editing |

Axes: **prompt adherence**, **text accuracy**, **anatomy**, **aesthetics**,
**speed**, **watermark/logo**. Use a fixed seed where the tool supports it.

Suggested first pass:

1. Gemini app, ChatGPT Free, Bing, Qwen Chat — same six prompts. This is your
   quality ceiling and takes under an hour.
2. Cloudflare FLUX.2 Klein 4B — same prompts via API. Compare directly.
3. AI Horde Flux.1 Schnell / Z-Image Turbo — same prompts, note queue time.
4. Local Z-Image Turbo FP8 — same prompts, same seeds. Compare to Cloudflare.
5. Pick the winner, then wire it into `server.js` behind `/api/image`.

## Integration notes for macaxeira

The app already isolates image work in `server.js` and `src/lib/image.ts`. The UI
does not need to change.

### Cloudflare Workers AI (recommended free API)

- Endpoint: `POST https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/black-forest-labs/flux-2-klein-4b`
- Auth: `Authorization: Bearer $CLOUDFLARE_API_TOKEN`
- Input: multipart form data (`prompt`, `width`, `height`, `steps`).
- Output: JSON with a base64 image or an image URL, depending on the model.
- Env: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`.
- Add a branch in `/api/image`; keep Pollinations as fallback when the token is
  missing or the daily neurons are exhausted.
- Klein 4B is fixed at 4 steps; do not expose a steps slider for it.

### AI Horde (recommended free unlimited fallback)

- Endpoint: `POST https://aihorde.net/api/v2/generate/async`
- Auth: `apikey: 0000000000` for anonymous, or a registered key for priority.
- Flow: submit job → poll `/generate/check/{id}` → fetch `/generate/status/{id}`.
- Model: `Flux.1-Schnell fp8 (Compact)` or `Z-Image-Turbo`.
- No watermark; queue time varies with volunteer supply.
- Good as a second fallback when Cloudflare is out of neurons.

### Puter.js (best quality, user-pays)

- Add `https://js.puter.com/v2/` or `@heyputer/puter.js`.
- `puter.ai.txt2img(prompt, { model: 'openai/gpt-image-2.6-flare', quality: 'low' })`.
- The browser handles auth and billing; no server key.
- Requires a Puter sign-in and a free monthly allowance; show the user their
  remaining credit and an upgrade path.
- Best fit if you want ChatGPT-quality without paying per image yourself.

### Local ComfyUI (unlimited, private)

- Run ComfyUI on `127.0.0.1:8188`.
- `POST /prompt` with a Z-Image or Klein workflow, then poll `/history/{prompt_id}`.
- Keep the same `/api/image` contract so the React app is unchanged.
- Add a `RENDERER=comfy|cloudflare|pollinations` switch in `server.js`.

## Bottom line

- **Test Gemini and ChatGPT first.** They define the quality bar and cost nothing.
- **Integrate Cloudflare FLUX.2 Klein 4B next.** It is the best free API with a
  real allowance, a permissive licence, and a simple HTTP call.
- **Add AI Horde as the unlimited fallback.** No key, no cap, queue-dependent.
- **Install ComfyUI + Z-Image Turbo FP8 for daily use.** 12 GB is enough, and it
  removes the rate limit entirely.
- **Keep Pollinations classic as the last-resort fallback.** It still works, but
  it is the weakest link.

## Sources

- Cloudflare Workers AI pricing and FLUX.2 model pages (checked 6 Nov 2026)
- Google Gemini API pricing — all Nano Banana image models: "Free tier: Not available"
- OpenAI ChatGPT Free FAQ and Images 2.5 coverage — no published image count
- Microsoft Bing Image Creator FAQ — 15 fast/day, 200 prompts/24 h
- Qwen Chat / Qwen-Image 3.0 and 2.1 coverage
- Puter.js docs and pricing — user-pays, free monthly allowance
- AI Horde docs — anonymous key `0000000000`, Flux.1 Schnell / Z-Image Turbo
- Hugging Face Spaces ZeroGPU docs — 5 min/day free, 2 min anonymous
- Pollinations APIDOCS — classic free tier: 768×768, 1 image/45 s, logo
- ComfyUI FLUX.2 Klein guide; BFL model card (Apache 2.0, 4 steps, 8.4 GB)
- Z-Image Turbo self-hosting guides (FP8 ~8 GB, 8 steps, CFG 1, euler/simple)
