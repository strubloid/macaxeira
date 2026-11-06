# Image generators to test now

**Research date: 6 November 2026.** Goal: replace the current Pollinations/Sana render
with something that actually follows a detailed prompt, ideally without paying.

Target machine: **RTX 4070 Ti, 12 GB VRAM** (Ada, sm_89), i9-11900F, 23 GB RAM,
735 GB free disk, NVIDIA driver 610.88, Python 3.12.3. Ollama v0.22.0 with
`qwen3.5:9b` and `qwen3.6:27b`.

This revision replaces the first pass. Several claims in it were wrong and are
now corrected — see [What changed](#what-changed-in-this-revision).

---

## Short answer

There is **no free API** that gives you GPT Image 2.6 / Nano Banana 2.1 quality
with unlimited use. The honest ladder, in order of what to actually do:

| # | Route | Cost | Why |
|---|-------|------|-----|
| 1 | **Cloudflare Workers AI** — `flux-2-klein-4b` | $0, ~80 img/day | Best free API. Real allowance, no card, Apache 2.0, simple HTTP call |
| 2 | **Local ComfyUI** — FLUX.3 Klein INT8 | $0, unlimited | Best open model that fits 12 GB. ~9 s/image on this exact card |
| 3 | **Gemini app / ChatGPT Free** (manual) | $0 | The quality ceiling. Use to judge what "good" looks like |
| 4 | **AI Horde** (anonymous) | $0 | ⚠️ **Not usable at 1024px** — verified, see below |
| 5 | **Puter.js** | user-pays | Only route to GPT Image 2.6 without a developer key |

If you want *ChatGPT-quality* specifically, the answer is Gemini/ChatGPT by hand,
or $0.0336/image via the Gemini API. Free APIs are one tier down.

---

## What changed in this revision

Corrections found by live-probing the endpoints from this machine and by
pulling official leaderboards:

| Claim in v1 | Reality (verified) |
|---|---|
| "AI Horde: free, no cap, best unlimited fallback" | **Wrong.** Anonymous requests over 576×576 are rejected with `KudosUpfront`. At 512×512 the request was served by a worker running `stable_diffusion` (SD 1.5) instead of the requested Flux/Z-Image, and the returned image was a **CENSORED placeholder**. Anonymous AI Horde is unusable for this app. |
| "Pollinations classic: 45 s per image, 768px, Sana" | **Confirmed.** 768×768, `image/jpeg`, 6.6 s cold. `/models` returns exactly `["sana"]`. Requesting `model=flux` returns byte-identical output to `model=flux.2-klein-4b` — **the model parameter is ignored**. It also watermarks even with `nologo=true`. |
| "Pollinations gen API is key-required but has free models" | **Confirmed, and worse.** Key required for *every* model including the 15 `paid_only: false` ones. Those still cost Pollen (z-image-turbo 0.004, flux.2-klein-4b 0.005, flux.1-schnell 0.002). GPT Image 2.6 and Nano Banana 2.1 are `paid_only: true`. |
| "Cloudflare ~80 Klein 4B images/day" | **Confirmed exactly** from official pricing: 5.37 in + 26.05 out neurons per 512² tile → 10,000/day ÷ 125.7 ≈ 79.5 images at 1024². |
| "FLUX.2 klein 4B is the best local default" | **Outdated.** FLUX.3 Image Klein (Oct 2026) now exists, scores higher on both arenas, and runs at ~9 s on this card. |
| "Puter free allowance ≈ $0.50" | Not published by Puter. Docs only say "every account gets a free monthly allowance" with the amount dashboard-only. Treat as **unverified**. |
| "No benchmark data available" | Two live leaderboards exist (LMArena 6.96M votes; Artificial Analysis 106 models). Now used below. |

---

## The quality bar: what "ChatGPT-quality" means numerically

There is no public *prompt-adherence-only* benchmark, but there are two
large human-preference arenas and one text-rendering category.

**Artificial Analysis — AA-Image-T2I v2.1** (retrieved 6 Nov 2026; FLUX.2
[dev] is the 1000 anchor):

| Rank | Model | Elo | Class |
|---|---|---|---|
| 1 | GPT Image 2.5 Sunburst (max) | 1227 ±10 | hosted |
| 2 | GPT Image 2.5 Flare (max) | 1208 ±10 | hosted |
| 3 | GPT Image 2 (high) | 1188 ±11 | hosted |
| 4 | **Nano Banana 2.1** | 1176 ±12 | hosted |
| 5 | MAI-Image-2.6 | 1168 ±12 | hosted |
| 6 | Grok Imagine Image 2.0 | 1166 ±12 | hosted |
| 7 | Nano Banana 2 (Gemini 3.1 Flash Image) | 1142 ±10 | hosted |
| 10 | MAI-Image-2.6-Flash | 1122 ±12 | hosted |
| 13 | **FLUX 3 Image** | 1117 ±12 | hosted |
| 16 | Seedream 5.0 Pro | 1101 ±12 | hosted |
| 17 | Qwen-Image-3.0-Pro | 1095 ±12 | hosted |
| 22 | **FLUX 3 Image Klein** | 1043 ±12 | **open** |
| 23 | Fibo 2.0 | 1039 ±12 | open |
| 32 | Ideogram 4.0 (Quality) | 1027 ±10 | open |
| 44 | FLUX.2 [pro] | 1003 ±10 | hosted |
| 47 | FLUX.2 [dev] | 1000 (anchor) | open (NCL) |
| 72 | **Z-Image Turbo** | 936 ±11 | **open** |
| 74 | **FLUX.2 [klein] 9B** | 932 ±10 | open (NCL) |
| 96 | **FLUX.2 [klein] 4B** | 840 ±12 | **open** |

**LMArena — Text-to-Image** (snapshot 2–5 Nov 2026, 6,961,993 votes, 84 models):

| Rank | Model | Elo | Rank | Model | Elo |
|---|---|---|---|---|---|
| 1 | GPT-Image-2.5 Sunburst | 1427 | 14 | Qwen-Image-3.0-Pro | 1254 |
| 2 | GPT-Image-2.6 Sunburst | 1409 | 16 | Seedream 5.0 Pro | 1251 |
| 6 | MAI-Image-2.6 | 1331 | 21 | **Qwen-Image-2.1** (open) | 1227 |
| 7 | **Nano Banana 2.1** | 1325 | 22 | Ideogram 4.0 (open) | 1199 |
| 8 | Grok Imagine 2.0 | 1317 | 40 | FLUX.2 [dev] | 1145 |
| 13 | Nano Banana 2 | 1257 | 61 | **Z-Image-Turbo** | 1082 |
| | | | 64 | **FLUX.2 [klein] 9B** | 1070 |
| | | | 72 | **FLUX.2 [klein] 4B** | 1030 |

**LMArena — Text Rendering category** (25 models, updated 2026.11.04):

GPT Image 2.5 Sunburst 1462 → Flare 1432 → GPT Image 2 1424 → MAI-Image-2.6
1366 → **Nano Banana 2.1 1360** → Grok Imagine 2.0 1330 → … → Recraft V4.1
1160 → **FLUX.2 Klein 4B 1015 (last)**.

### What the numbers say

- The best open-weight model (**Qwen-Image-2.1, 1227/1045**) trails the best
  hosted model by **~200 Elo on LMArena and ~180 on AA**. That is roughly the
  gap between "preferred 64% of the time" and "preferred 50% of the time".
- Local 12 GB options (FLUX.3 Klein 1043, Z-Image 936, FLUX.2 klein 4B 840)
  sit **one to two tiers below** the hosted frontier.
- **FLUX.3 Klein (1043) has overtaken Qwen-Image-2.1 (1045) on AA and FLUX.2
  klein 4B (840) by a wide margin.** This changes the local recommendation.
- The "prompt rewriting" mechanism is a major part of the gap — see below.

### Why hosted models "understand you"

This is the single most important finding for macaxeira, because the app
*already* has the right architecture.

Frontier "understanding" is not better text encoding. It is a **separate
LLM/VLM stage that rewrites a short request into a dense literal spec**
(composition, lighting, camera, palette, exact text strings) before the
renderer sees it:

- **Qwen ships the rewriter as open weights**: `Qwen/Qwen-Image-2.1-PE-T2I`,
  a fine-tuned Qwen3.5-VL 9B that returns `{rewritten_prompt, wh_ratio}`. The
  prompt is written in the user's language, but the *text painted into the
  image* follows a strict priority (named text → existing image text →
  instruction language).
- **Qwen's API exposes it as a knob**: `prompt_extend` (default `true`),
  `prompt_extend_mode` = `direct` or `agent`.
- **Gemini's "thinking" mode** generates interim thought images to refine
  composition. Google measured **+35 Elo** and **+0.193 factuality** from
  thinking on vs off for the same model.
- **OpenAI's Responses API** auto-revises prompts via the mainline model and
  returns `revised_prompt`. A `complexity` parameter (low/medium/high) controls
  planning compute separately from rendering quality.
- **Z-Image's "Prompt Enhancer" is NOT in the downloadable weights** — which
  partly explains why open models score lower.

> **This validates macaxeira's design.** The local Ollama "alchemy" step is
> exactly the mechanism that separates frontier models. macaxeira is not
> missing a feature; it is missing a better *renderer*. The Ollama rewriter
> should be pointed at a stronger local model (Qwen3.5-VL-class) rather than
> replaced.

---

## Tier 1 — free consumer products (test these by hand first)

Use these to build a reference set before integrating anything.

| Product | Model today | Free allowance | Refs | Watermark | Commercial on free |
|---|---|---|---|---|---|
| **ChatGPT Free** | Images 2.6 | "Limited" — **not published**, ~2–5/day in community reports | Yes | C2PA metadata | Not stated on free page |
| **Gemini app** | Nano Banana 2 | "Standard limits" — **not published**; UI shows % + reset time | Yes, multi-image | SynthID + visible | Generally permitted |
| **Bing Image Creator** | MAI-Image-2.6-Flash | **15 fast/day**, then standard speed, **200 prompts/24 h** | 1 image | Optional toggle | Third-party reading: yes |
| **Krea** | Krea 3 + many partners | **100 compute units/day**, no card | Yes | No | **Yes — commercial license on Free** |
| **Qwen Chat** | Qwen-Image 3.0 | **Not published**; UI shows daily quota | Yes | Not stated | 3.0 is closed, unlicensed |
| **Overchat** | GPT Image 2.5, Nano Banana 2.1, Seedream 5 Pro | **100 credits/day** | **up to 16 reference photos** | Not stated | Not stated |
| **Ideogram** | Ideogram 4.0 / 4.5 | **30 credits/week** (only with Google/Apple/Microsoft signup) | Yes, costs credits | No | Paid-plan benefit |
| **Leonardo** | Lucid Origin / Phoenix / FLUX | **150 Fast Tokens/day** | Limited | Not stated | Yes, non-exclusive royalty-free |
| **Recraft** | Recraft V4.1 | 3 gens per style per day | 3 uploads/day | No | **No — Recraft owns free images** |
| **Playground** | Playground v3 + Nano Banana | **5 images/rolling 3 h**; 3 monthly credits | Canvas | No | **Yes — royalty-free on Free** |
| **Grok Imagine** | Grok Imagine 2.0 | "Limited", shared weekly pool, **no published count** | up to 5 | **Permanent Grok watermark** | Not stated |
| **Adobe Firefly** | Firefly Image 5 | "a limited number" — **not published** | Yes | C2PA | Not verified for free |
| **Midjourney** | V7 / Niji 7 | **No free trial on web or Discord** | Paid | — | Owns output |
| Perchance | Flux | Unlimited, no signup | No | No | Not published |

### Krea deserves a second look — verified from its pricing page

Krea's Free plan gives **100 compute units/day, no credit card, commercial
license included**, and its compare table publishes exact daily counts per
model:

| Model on Krea Free | Images/day |
|---|---|
| Z Image (no LoRA) | **~31** |
| Flux.1 Dev | ~30 |
| Flux 2 Klein | ~25 |
| Krea 2 Turbo | ~50 |
| Krea 3 | ~5 |
| Flux 2 | 5 |
| Flux Kontext Dev | 6 |
| Qwen Image | ~11 |
| Wan 2.2 Image | ~6 |
| Edit (any model) | 33 |
| Realtime | 900 |

That is **~31 Z-Image + ~25 Flux 2 Klein + 33 edits per day, free, with a
commercial license** — with no API, but a browser. This is the best free
*consumer* volume available and it beats what a free API can give.

### Free multi-image composition (confirmed on free tiers)

Gemini app, Overchat (16 refs), Qwen Chat, Tencent 元宝, Krea (Edit 33/day),
Scenario (50 CU/day), Ideogram (credits), Recraft (3 uploads/day), Firefly
Boards (Firefly's own models only — partner models need premium).

### Free products with a free official API

Only two, and both are Asian platforms:

1. **Zhipu / 智谱 — `cogview-3-flash` is officially a free model.** $0/image,
   OpenAI-compatible `POST /v1/images/generations`, `watermark_enabled` flag.
   The only *standing* free image API found.
2. **Alibaba Cloud Model Studio — Qwen-Image signup quotas**: 10 images each
   for `qwen-image-3.0`, `qwen-image-3.0-pro`, `qwen-image-2.1-pro`,
   `qwen-image-2.1-turbo`. **Singapore region only, 90 days.**

Every Western provider requires a card: Google (all four Nano Banana models
list Free Tier = "Not available"), OpenAI, xAI, Adobe, Recraft, Ideogram,
Leonardo, Playground, BFL.

---

## Tier 2 — free APIs

| Provider | Best free model | Free allowance | Card? | Commercial | Verified |
|---|---|---|---|---|---|
| **Cloudflare Workers AI** | `@cf/black-forest-labs/flux-2-klein-4b` | **10,000 neurons/day** → ~80 img/day at 1024² | No | Yes (Apache 2.0) | Pricing page read 6 Nov |
| Cloudflare Workers AI | `flux-1-schnell` | ~173 img/day at 4 steps | No | Yes (Apache 2.0) | Same |
| Cloudflare Workers AI | `flux-2-klein-9b` | ~7 img/day | No | **No** (FLUX NCL) | Same |
| Cloudflare Workers AI | `leonardo/lucid-origin` | ~3.5 img/day | No | Per Leonardo ToS | Same |
| Cloudflare Workers AI | `leonardo/phoenix-1.0` | ~4 img/day | No | Per Leonardo ToS | Same |
| Cloudflare Workers AI | `flux-2-dev` | ~1.6 img/day at 28 steps | No | **No** (FLUX NCL) | Same |
| **Zhipu CogView-3-Flash** | `cogview-3-flash` | Free model, $0/image | No | Not stated | Official docs |
| Alibaba Model Studio | `qwen-image-3.0` | 10 images / 90 days, SG region | No | Yes | Official docs |
| ModelScope API-Inference | `Qwen/Qwen-Image-2.1` | ~250 calls/day | No | **No — non-commercial** | Third-party on JS docs |
| **AI Horde (anonymous)** | — | ⚠️ **Capped at 576×576, wrong models, censored output** | No | Per model | **Live-probed 6 Nov** |
| Hugging Face ZeroGPU Spaces | Whatever the Space runs | 5 GPU-min/day logged in, 2 anonymous | No | Per model | Official docs |
| Pollinations classic | `sana` only | 1 image / 45 s / IP | No | Per ToS | **Live-probed** |
| Pollinations `gen.` | 15 non-paid models, but **all cost Pollen** | ~3 Pollen from one-off quests | No | Per model | **Live-probed (401)** |
| Puter.js | GPT Image 2.6, Nano Banana 2.1, FLUX.2 | User's own free allowance (amount **unpublished**) | User signs in | Per model | Official docs |
| Stability AI | SD3.5 Large Turbo | 25 credits, **one-time** | No | — | Official pricing |
| Runware | GPT Image 2.6 Flare | $2 with business email, one-time | No | — | Official FAQ |
| SiliconFlow | Z-Image-Turbo | $1, one-time | No | Yes | Official pricing |
| Replicate | flux-dev, imagen-4, ideogram-v3-turbo | "a limited number of runs" | No | Yes | Official pricing |
| Novita | FLUX/SD/Qwen/Seedream | "$100 sandbox credits, 90 days" | No | Yes | Landing page |
| OVHcloud AI Endpoints | SDXL | Anonymous, 2 req/min/IP | No | Yes | Third-party |
| Together / DeepInfra / Segmind / fal / Eden AI / Baseten / OpenRouter | — | **No free tier** (OpenRouter has image models but none at $0) | — | — | Official pricing |

### Cloudflare image-count math (official pricing, 20 Oct 2026)

Free tier: **10,000 neurons/day**, resets 00:00 UTC, then $0.011/1,000 neurons.

| Model | Per 512² tile | Per image at 1024² (4 tiles) | Images/day |
|---|---|---|---|
| flux-2-klein-4b | 5.37 in + 26.05 out | 125.7 neurons | **~79.5** |
| flux-1-schnell | 4.80/tile + 9.60/step | 57.6 (4 steps) | ~173 |
| flux-2-klein-9b | 1363.64/first MP | 1363.6 | ~7.3 |
| flux-2-dev | 18.75 in + 37.5 out, per tile **per step** | 6300 (28 steps) | ~1.6 |
| lucid-origin | 636/tile + 12/step | 2904 (30 steps) | ~3.4 |
| phoenix-1.0 | 530/tile + 10/step | 2420 (30 steps) | ~4.1 |

**Recommendation: `flux-2-klein-4b`.** Apache 2.0 (commercial OK), fastest of
the quality options, exactly 4 steps (fixed — don't expose a steps slider),
256–1920 px per side, no watermark, no queue, no card.

> **Licence trap:** `flux-2-klein-9b` and `flux-2-dev` are FLUX
> Non-Commercial. Only the **4B** variant is Apache 2.0.

---

## Tier 3 — local, unlimited, private

Verified file sizes from the Hugging Face API on 6 Nov 2026. 12 GB = 11.18 GiB
usable, ~10.5 GiB free after the desktop.

| Model | Repo + exact file | Size | Licence | VRAM split | Settings | 4070 Ti @1024² | Elo (AA) |
|---|---|---|---|---|---|---|---|
| **FLUX.3 Image Klein** ⭐ | `black-forest-labs/flux-3-image-klein-comfy` → `diffusion_models/flux3-image-klein-int8-convrot.safetensors` | 5.43 GiB | **FLUX Kommunity — free commercial only < $5M revenue** | 5.43 + TE 4.52 (`qwen3vl_4b_int8_convrot`) + VAE 0.31 | **16 steps, cfg 1, `er_sde`/`simple`** (template uses 15) | **~8.9 s** (NVIDIA-measured on RTX 4070) | **1043** |
| **Z-Image-Turbo** | `Comfy-Org/Z-Image-Turbo` → `split_files/diffusion_models/z_image_turbo_int8_convrot.safetensors` | 5.78 GiB | **Apache 2.0 — safest** | 5.78 + TE 5.25 (`qwen_3_4b_fp8_mixed`) + VAE 0.31; with `fp4_mixed` TE 3.24 → 9.33 total | **9 steps (=8 NFE), cfg 1.0, `euler`/`simple`**, no negative prompt | ~3–6 s | 936 |
| **FLUX.2 klein 4B** | `black-forest-labs/FLUX.2-klein-4b-fp8` → `flux-2-klein-4b-fp8.safetensors` | 3.79 GiB | **Apache 2.0** | 3.79 + TE 3.58 (`qwen_3_4b_fp4_flux2`) + VAE 0.31 = 7.7 | **4 steps, cfg 1.0**, `euler`/`Flux2Scheduler` | ~3–5 s | 840 |
| MOSS-Image SFT | `Comfy-Org/MOSS-Image` → `moss_image_sft_int8_convrot.safetensors` | 5.04 GiB | Apache 2.0 | 5.04 + TE 6.84 → offload | 50 steps, or 4-step LoRA | ~12–20 s | — |
| Qwen-Image-2.1 | `Comfy-Org/Qwen-Image-2.1` → `qwen_image_2.1_int8_convrot.safetensors` | 6.76 GiB | **Qwen Research — non-commercial** | 6.76 + TE 5.88 → must offload | base 40 steps / turbo 8 steps | ~15–30 s | **1045** |
| SDXL base | `stabilityai/stable-diffusion-xl-base-1.0` | 6.46 GiB | OpenRAIL++-M | 6.46 | 25–30 steps, cfg 5–7, dpmpp_2m+karras | ~4–6 s | — |

**Does not fit 12 GB** (don't waste disk): FLUX.1-schnell single-file (16–22
GiB), FLUX.2 klein 9B (19.6 GiB), Qwen-Image-Edit (19–38 GiB, and 28 GiB
would exceed your 23 GB RAM), Chroma (16.6 GiB), HiDream-I1 (17B + gated),
SD3.5 Large (~21.5 GiB), Ideogram 4 (8.6–9.9 + TE 5.9–9.9 = marginal),
Fibo-2.0 (23.7 GiB, CC BY-NC), LongCat-Image (11.7 + 16.6).

**There are no Stable Diffusion 4 open weights.** The entire `stabilityai` HF
org has no `stable-diffusion-4*` repo. Blogs claiming otherwise are wrong.

**Wan has no open text-to-image model** — only video.

### Hardware traps on this card

- **Ada (sm_89) has FP8 tensor cores but no FP4.** Never use `*_nvfp4*`
  files (`z_image_turbo_nvfp4`, `flux3-image-klein-nvfp4`,
  `flux-2-klein-4b-nvfp4`, `ideogram4_nvfp4_mixed`) — they need Blackwell
  (sm_100/120).
- **`--lowvram` is a no-op** while DynamicVRAM is enabled, which is the
  default. What actually helps: quantised encoder files, `--fp8_e4m3fn-text-enc`,
  `--reserve-vram`, `--vram-headroom`, `CLIPLoader.device="cpu"`.
- **Avoid `--force-fp16`** (black/NaN images). Ada's native BF16 is correct.
- **Z-Image's `CLIPLoader.type` must NOT be `flux2`** — with `flux2` ComfyUI
  loads the Klein text encoder instead of the Z-Image one. Use `lumina2`.
  For FLUX.3 use `type: "flux3"`.
- ComfyUI current `master` supports `flux2`, `flux3`, `lumina2`, `qwen_image`,
  `ideogram4`, `moss_image`, `fibo2` CLIP types.

### Sharing the card with Ollama

`qwen3.6:27b` is 17 GB — **it does not fit in 12 GB VRAM** and will
partial-offload to your 23 GB RAM, leaving ~2 GB for ComfyUI. Practical
policy:

1. Never keep the 27B resident: send `{"model":"qwen3.6:27b","keep_alive":0}`
   to `POST /api/generate` to unload it before rendering.
2. Set `OLLAMA_MAX_LOADED_MODELS=1`.
3. If Ollama must stay warm, cap it: `options.num_gpu: 4`, `num_ctx: 4096`,
   `keep_alive: "10m"`, and start ComfyUI with `--reserve-vram 3.0
   --vram-headroom 1.0`.
4. **Best combination:** use `qwen3.5:9b` (6.6 GB) for prompt rewriting and
   **FLUX.2 klein 4B FP8** (7.7 GiB total) — 10.4 GiB fits together. This is
   the only pairing that truly coexists.
5. **Bonus:** FLUX.3 Klein's prompt upsampler is `qwen3.5_9b` — the same
   family you already run in Ollama. Point your Express proxy at Ollama
   `qwen3.5:9b` for prompt expansion instead of loading a 6.26 GiB upsampler
   into ComfyUI.

### Cost

| Item | Size |
|---|---|
| ComfyUI + venv + torch cu130 | ~15–20 GB |
| FLUX.3 Klein INT8 stack | 10.3 GB |
| Z-Image Turbo INT8 stack | 9.3–11.3 GB |
| **Realistic total (recommended setup)** | **~60–70 GB of 735 GB free** |

Install-to-first-image: **~25–45 min** on a normal connection. Steady state:
4–10 s/image. **No subscription, no API key, no card, $0 per image.**

### ComfyUI headless API (for the Express proxy)

- `POST /prompt` — body `{"prompt": <API-format graph>, "client_id": "<uuid>"}`
  → `{"prompt_id": "...", "number": <queue pos>, "node_errors": {}}`.
  API format is `{node_id: {class_type, inputs, _meta}}` — numeric ids, links
  as `["<node_id>", <slot>]`. The UI "Save" format is **not** accepted.
- `GET /history/{prompt_id}` → `outputs[node_id].images[].{filename,subfolder,type}`
- `GET /view?filename=…&subfolder=…&type=output` → raw PNG bytes
- `GET /ws?clientId=<uuid>` → progress events; `executing` with `node: null`
  = finished; binary frames are preview PNGs
- `POST /upload/image` (multipart `image`, `subfolder`, `type`, `overwrite`) →
  `{"name":"ref.png",...}` for reference images
- `GET /object_info/<ClassName>` → authoritative widget schema and combo lists;
  validate every graph against it before shipping

Keep ComfyUI on `127.0.0.1:8188` and expose only the Express proxy.

---

## Tier 4 — cheap paid (only if free is not enough)

| Option | Price/image | Note |
|---|---|---|
| **Gemini `gemini-nano-banana-2.1`** | **$0.0336** (1K) / $0.0504 (2K) / $0.113 (4K) | Best quality-per-dollar. Batch ≈ half. **No free tier** |
| Gemini `gemini-3.1-flash-image` | $0.067 (1K) | Nano Banana 2 |
| Gemini `gemini-3-pro-image` | $0.134 (1K–2K) | Highest fidelity |
| GPT Image 2.6 Flare (via Puter) | ~$0.0247 | ChatGPT-level instruction following |
| GPT Image 2.5 Flare (via Puter) | ~$0.0059 | 4× cheaper, still good |
| SiliconFlow Z-Image-Turbo | $0.005 | Cheapest good open model |
| fal FLUX.1 schnell | $0.003/MP | Cheapest per image |
| Seedream 5 Lite (Orylia) | 35 credits, 50 free/day | ~1 free image/day |

At 30 images/day, Nano Banana 2.1 costs **$1.01/day, ~$30/month**. Cloudflare
Workers Paid is $5/month minimum and gives the same thing in FLUX.2 Klein.

---

## Test protocol

Same eight prompts everywhere. Score 1–5 on each axis; record time,
dimensions, watermark.

| # | Prompt | Tests |
|---|---|---|
| 1 | "A red bicycle leaning against a blue door, a cat on the seat, morning light, 35mm photo" | Subject count, spatial relations |
| 2 | "A café chalkboard reading 'FRESH BREAD — 2€' in neat handwriting" | Text rendering |
| 3 | "Close-up portrait of a 70-year-old fisherman, weathered skin, hands visible" | Anatomy, skin, hands |
| 4 | "Four rows of three round buttons on a control panel, labelled 1–12" | Counting, layout |
| 5 | "A poster in Portuguese and Japanese advertising a summer festival" | Multilingual text |
| 6 | "Same character, three expressions: happy, surprised, annoyed" | Consistency, editing |
| 7 | "A vintage travel poster for 'LISBOA — CIDADE DE LUZ', Art Deco, 1930s" | Poster layout, legible text |
| 8 | "Macro shot of a dew-covered spider web at dawn, bokeh" | Fine texture, photorealism |

Axes: **prompt adherence**, **text accuracy**, **anatomy**, **aesthetics**,
**speed**, **watermark**. Fixed seed where supported.

Suggested order:

1. ChatGPT Free, Gemini app, Bing, Krea, Overchat — same eight prompts
   (under an hour). This is your ceiling.
2. Cloudflare `flux-2-klein-4b` — same prompts via API, compare directly.
3. Local ComfyUI + FLUX.3 Klein INT8 (or Z-Image INT8) — same prompts, fixed seeds.
4. Pollinations classic — same prompts, to quantify the current gap.
5. Pick the winner, wire it into `server.js`.

---

## Integration plan for macaxeira

The UI does not need to change. Image work is already isolated in `server.js`
and `src/lib/image.ts`.

### 1. Cloudflare Workers AI (recommended free API)

- Endpoint: `POST https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/black-forest-labs/flux-2-klein-4b`
- Auth: `Authorization: Bearer $CLOUDFLARE_API_TOKEN`
- Input: multipart form (`prompt`, `width`, `height`); prompt ≤2048 chars
- Output: JSON, `result.image` is a **base64 string**
- Env: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`
- Keep Pollinations as automatic fallback when the token is missing or the
  daily neurons are exhausted (error is a 4xx JSON body)
- Klein 4B is fixed at 4 steps — no steps slider
- At 1024² this is ~80 images/day, so add a per-day counter to the UI

### 2. Local ComfyUI (unlimited)

- Run ComfyUI on `127.0.0.1:8188`
- `POST /prompt` with the workflow JSON → poll `GET /history/{prompt_id}` →
  `GET /view?filename=…&subfolder=…&type=output`
- `POST /upload/image` for reference images
- Add `RENDERER=cloudflare|comfy|pollinations` to `server.js`
- **Unload Ollama before rendering** (`keep_alive: 0`) or use klein 4B FP8
  which coexists with `qwen3.5:9b`

### 3. Puter.js (best quality, user-pays)

- `puter.ai.txt2img(prompt, { model: 'openai/gpt-image-2.6-flare', quality: 'low' })`
- Browser handles auth and billing; no server key
- Requires a Puter sign-in; show remaining credit and the upgrade path
- Puter's OpenAI-compatible endpoints (`/puterai/openai/v1/*`) require a paid
  plan — use `puter.ai.*` only

### 4. Keep Pollinations classic as last-resort fallback

It still works, but it is the weakest link: 768×768, Sana only, model param
ignored, watermarked even with `nologo=true`, 1 image/45 s/IP.

---

## Bottom line

1. **Test Gemini and ChatGPT first** — they define the bar, cost nothing.
2. **Add Krea and Overchat to the benchmark** — Krea's Free plan gives
   ~31 Z-Image + ~25 Flux 2 Klein + 33 edits per day with a commercial
   license; Overchat gives 4× GPT Image 2.5 Flare per day.
3. **Integrate Cloudflare `flux-2-klein-4b`** — best free API, ~80 images/day,
   Apache 2.0, no card.
4. **Install ComfyUI + FLUX.3 Klein INT8** for unlimited local rendering
   (~9 s/image on this card). Z-Image Turbo INT8 if you want the cleanest
   licence. Free forever, no subscription.
5. **Point the Ollama rewriter at a stronger model** — the rewriter is the
   mechanism behind frontier "understanding", and you already have it.
6. **If you will pay ~$0.03/image, use Gemini Nano Banana 2.1** ($30/month
   for 30/day). That is the only way to actually match ChatGPT quality.
7. **Drop AI Horde from the fallback list** — verified broken for anonymous
   use at usable resolution.

---

## Sources

All checked **6 November 2026** unless noted.

**Leaderboards**
- LMArena Text-to-Image — https://arena.ai/leaderboard/image/text-to-image
  (snapshot 2–5 Nov 2026, 6,961,993 votes, 84 models; 403 to direct fetch —
  read via search render + mirrors canaryarena.ai, aib.vote, theknowngood.com)
- LMArena open-weights board — https://arena.ai/leaderboard/image/text-to-image?license=open-source
- LMArena Image Edit — https://arena.ai/leaderboard/image-edit (via aib.vote, 2026.11.04)
- LMArena Text Rendering — 25 models, via https://www.aib.vote/en/benchmarks/arena-image-text-rendering
- Artificial Analysis Image T2I v2.1 — https://artificialanalysis.ai/image/leaderboard/text-to-image
- Artificial Analysis Image Editing v2.1 — https://artificialanalysis.ai/image/leaderboard/editing
- DesignArena — https://www.designarena.ai/leaderboard/image
- IMG.LY text-reliability benchmark (third-party) — https://img.ly/ai-benchmarks/findings/text-reliability/
- ImageBench V1 (third-party) — https://imagebench.ai/best-ai-image-generator-for-text

**Official docs**
- Cloudflare Workers AI pricing — https://developers.cloudflare.com/workers-ai/platform/pricing/ (updated 20 Oct 2026)
- Cloudflare FLUX.2 klein 4B model page — https://developers.cloudflare.com/workers-ai/models/flux-2-klein-4b/
- Google Gemini API pricing (all image models "Free tier: Not available") — https://ai.google.dev/gemini-api/docs/pricing
- Google Nano Banana 2.1 model card — https://deepmind.google/models/model-cards/nano-banana-2-1/
- Google Gemini Apps limits — https://support.google.com/gemini/answer/16275805
- Google AI Studio image generation — https://ai.google.dev/gemini-api/docs/image-generation
- OpenAI images in ChatGPT — https://help.openai.com/en/articles/11084440-images-in-chatgpt
- OpenAI Free tier FAQ — https://help.openai.com/en/articles/9275245-chatgpt-free-tier-faq
- OpenAI image generation guide — https://developers.openai.com/api/docs/guides/image-generation
- OpenAI Images 2.6 announcement (4 Nov 2026) — https://openai.com/index/introducing-images-2-6/
- Microsoft Bing Image Creator FAQ — https://www2.bing.com/images/create/ai-image-generator/faq
- MAI-Image-2.5-Flash model card — https://microsoft.ai/pdf/MAI-Image-2.5-Flash-Model-Card.pdf
- xAI Grok FAQ — https://docs.x.ai/grok/faq
- xAI image generation docs (8 Oct 2026) — https://docs.x.ai/developers/model-capabilities/images/generation
- Krea pricing (100 units/day, per-model daily counts) — https://www.krea.ai/pricing
- Overchat pricing (100 credits/day, per-model credit costs) — https://overchat.ai/pricing
- Qwen Image API reference (11 Oct 2026) — https://www.alibabacloud.com/help/en/model-studio/qwen-image-generation-and-editing-api-reference
- Alibaba Model Studio pricing — https://www.alibabacloud.com/help/en/model-studio/model-pricing
- Qwen-Image-2.1 GitHub — https://github.com/QwenLM/Qwen-Image-2.1
- Qwen PE-T2I prompt rewriter — https://huggingface.co/Qwen/Qwen-Image-2.1-PE-T2I
- Ideogram plans — https://docs.ideogram.ai/plans-and-billing/available-plans
- Leonardo pricing — https://leonardo.ai/pricing/
- Recraft pricing + free plan docs — https://www.recraft.ai/pricing · https://www.recraft.ai/docs/plans-and-billing/free-plan
- Playground free plan limits — https://help.playgroundai.com/en/articles/11434147-what-are-the-limits-on-the-free-plan
- Adobe Firefly credits FAQ — https://helpx.adobe.com/creative-cloud/apps/generative-ai/generative-credits-faq.html
- Midjourney free trials (none on web) — https://docs.midjourney.com/hc/en-us/articles/27870399350173
- Puter.js user-pays model — https://docs.puter.com/user-pays-model/
- Puter.js rate limits — https://docs.puter.com/rate-limits-and-quotas/
- Puter txt2img docs — https://docs.puter.com/AI/txt2img/
- AI Horde FAQ / usage — https://stablehorde.net/faq/ · https://stablehorde.net/details/usage/
- Hugging Face Spaces as API endpoints — https://huggingface.co/docs/hub/spaces-api-endpoints
- HF ZeroGPU quotas — https://huggingface.co/docs/hub/spaces-zerogpu
- HF Inference Providers pricing (free tier = $0 credits) — https://huggingface.co/docs/inference-providers/pricing
- Pollinations classic API docs — https://github.com/pollinations/pollinations/blob/master/APIDOCS.md
- Pollinations gen API — https://gen.pollinations.ai/docs/llm.txt
- Pollinations Pollen FAQ — https://github.com/pollinations/pollinations/blob/master/enter.pollinations.ai/POLLEN_FAQ.md
- BFL FLUX.3 Image Klein — https://bfl.ai/blog/flux-3-image-klein
- ComfyUI FLUX.2 Klein guide — https://docs.comfy.org/tutorials/flux/flux-2-klein
- ComfyUI manual install — https://docs.comfy.org/installation/manual_install
- ComfyUI server routes — https://docs.comfy.org/development/comfyui-server/comms_routes
- ComfyUI API-format graph spec — https://docs.comfy.org/development/api-development/workflow-api-format
- ComfyUI startup flags — https://docs.comfy.org/development/comfyui-server/startup-flags
- Z-Image HF + report — https://huggingface.co/Tongyi-MAI/Z-Image-Turbo · https://arxiv.org/html/2511.22699v5
- Ollama API (keep_alive, num_gpu) — https://github.com/ollama/ollama/blob/main/docs/api.md
- Prompt-rewriting research: arXiv 2510.12041 (ByteDance) · CVPR 2026 PromptEnhancer · CVPR 2026 ThinkGen

**Live-probed from this machine, 6 Nov 2026** (all reproduced in-session)
- `image.pollinations.ai/prompt/...` → HTTP 200, `image/jpeg`, **768×768**,
  6.6 s cold; `/models` → `["sana"]`; `model=flux` and `model=flux.2-klein-4b`
  returned **byte-identical** images; watermark present despite `nologo=true`;
  45 s/IP limit returns HTTP 402 `FREE_LIMIT`
- `gen.pollinations.ai/v1/images/generations` → **HTTP 401** without a key;
  `/image/models` → 102 models, 15 with `paid_only: false`, all priced in Pollen
- `aihorde.net/api/v2/generate/async` with `apikey: 0000000000` →
  **HTTP 400 `KudosUpfront`** at 768² and 1024²; **accepted at 512²** but
  served by worker `esson-arch-gemini-sd15` running `stable_diffusion`, and
  returned a **"CENSORED" placeholder image** (512×512 WebP) for a benign
  prompt
- `aihorde.net/api/v2/status/models?type=image` → 151 image models; current
  workers: Z-Image-Turbo 7 (ETA 141 s), Flux.1-Schnell fp8 4 (ETA 67 s),
  Anima-Turbo-v1.1 5 (ETA 94 s), Krea2-Turbo_fp8 1 (ETA 193 s)
- HF Space `black-forest-labs/FLUX.2-klein-4B` → runtime RUNNING on
  `zero-a10g`; anonymous `POST /gradio_api/call/infer` returns an event_id,
  and the SSE stream completed — confirming the API path works without a token
- Hugging Face model file sizes via `huggingface.co/api/models/<repo>/tree/main`
- Local: RTX 4070 Ti, 12282 MiB, driver 610.88, Python 3.12.3, 735 GB free

**Not verified / treat as unverified**
- Puter's free monthly allowance amount (dashboard only)
- Replicate's exact "Try for Free" run count (no figure published)
- ModelScope's ~250 calls/day (third-party reading of a JS-rendered page)
- Gemini app / ChatGPT / Qwen Chat / Grok daily image counts — **none
  published by the vendors**; every number in circulation is community report
- Which model Qwen Chat's image tool serves on a given day
- Whether Bing's fast allowance is 10 or 15 — Microsoft's own pages disagree
- Overchat's free tier: the pricing card says "1 image a day" while the FAQ
  says 100 credits/day — official pages contradict each other
- Midjourney Niji mobile trial size (App Store listing only)
- No LMArena/AA scores exist for Midjourney v7/v8, Adobe Firefly, Sana,
  Lumina or Chroma on the current boards
