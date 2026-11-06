import http from "node:http";
import https from "node:https";
import path from "node:path";
import express from "express";

const app = express();
const port = Number(process.env.PORT) || 5173;
const isProduction =
  process.argv.includes("--prod") || process.env.NODE_ENV === "production";

const imageBase =
  process.env.POLLINATIONS_BASE ?? "https://image.pollinations.ai/prompt";
const imageModel = process.env.IMAGE_MODEL ?? "flux";
const imageToken = process.env.POLLINATIONS_TOKEN ?? "";

function dimension(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.min(Math.max(Math.round(number), 256), 1536);
}

app.get("/api/image", (request, response) => {
  const prompt =
    typeof request.query.prompt === "string" ? request.query.prompt.trim() : "";

  if (!prompt) {
    response.status(400).json({ error: "Missing prompt." });
    return;
  }

  const params = new URLSearchParams({
    width: String(dimension(request.query.width, 1024)),
    height: String(dimension(request.query.height, 1024)),
    seed: String(Number(request.query.seed) || Math.floor(Math.random() * 1e9)),
    model: imageModel,
    nologo: "true",
    safe: "false",
  });

  if (imageToken) {
    params.set("token", imageToken);
  }

  const target = new URL(`${imageBase}/${encodeURIComponent(prompt)}`);
  target.search = params.toString();

  const client = target.protocol === "http:" ? http : https;
  const upstream = client.get(
    target,
    {
      family: 4,
      autoSelectFamily: false,
      headers: { "User-Agent": "macaxeira/0.1" },
    },
    (upstreamResponse) => {
      const status = upstreamResponse.statusCode ?? 502;
      const contentType = String(upstreamResponse.headers["content-type"] ?? "");

      if (status < 200 || status >= 300 || !contentType.startsWith("image/")) {
        let body = "";
        upstreamResponse.setEncoding("utf8");
        upstreamResponse.on("data", (chunk) => {
          body += chunk;
        });
        upstreamResponse.on("end", () => {
          let message = "The image service did not return an image.";
          let parsed = null;

          try {
            parsed = JSON.parse(body);
          } catch {
            parsed = null;
          }

          if (parsed) {
            message =
              (typeof parsed.error === "string"
                ? parsed.error
                : parsed.error?.message) ?? message;
          }

          if (status === 403 && message.toLowerCase().includes("turnstile")) {
            message =
              "The free image service asked for browser verification. Wait a moment and try again, or set POLLINATIONS_TOKEN.";
          }

          response.status(status).json({ error: message });
        });
        return;
      }

      response.status(200);
      response.setHeader("Content-Type", contentType);
      response.setHeader("Cache-Control", "no-store");
      upstreamResponse.pipe(response);
    },
  );

  upstream.setTimeout(120_000, () => {
    upstream.destroy(new Error("The image service timed out."));
  });

  upstream.on("error", (error) => {
    if (response.headersSent) {
      response.end();
      return;
    }
    response
      .status(502)
      .json({ error: `Image service unreachable: ${error.message}` });
  });

  response.on("close", () => {
    if (!response.writableEnded) {
      upstream.destroy();
    }
  });
});

if (isProduction) {
  const dist = path.resolve(process.cwd(), "dist");
  app.use(express.static(dist));
  app.use((request, response) => {
    response.sendFile(path.join(dist, "index.html"));
  });
} else {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

app.listen(port, () => {
  console.log(`macaxeira listening on http://localhost:${port}`);
});
