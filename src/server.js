import express from "express";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";
import {
  RELEASES_DIR,
  readManifest,
  getPlatformRelease,
  fileIsAvailable,
} from "./releases.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", true);

// Security headers. CSP is tuned to allow the inline theme bootstrap and the
// self-hosted assets used by the landing page.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// --- API ---------------------------------------------------------------

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), ts: Date.now() });
});

app.get("/api/releases", (_req, res) => {
  const manifest = readManifest();
  const platforms = {};
  for (const [key, entry] of Object.entries(manifest.platforms)) {
    platforms[key] = {
      ...entry,
      available: fileIsAvailable(entry),
      downloadUrl: `/download/${key}`,
    };
  }
  res.json({
    product: manifest.product,
    updated: manifest.updated,
    platforms,
  });
});

// Direct download endpoint. Streams the binary with a sane filename, or returns
// 404 with a clear message when the build has not been published yet.
app.get("/download/:platform", (req, res) => {
  const platform = req.params.platform;
  const entry = getPlatformRelease(platform);

  if (!entry) {
    return res
      .status(404)
      .json({ error: `Unknown platform '${platform}'.` });
  }
  if (!fileIsAvailable(entry)) {
    return res.status(404).json({
      error: `No published build for '${platform}' yet.`,
      hint: "Drop the build into the /releases folder and update releases.json.",
    });
  }

  const filePath = path.join(RELEASES_DIR, path.basename(entry.file));
  res.download(filePath, path.basename(entry.file));
});

// Proxy download: stream the latest GitHub release asset through this server.
// The phone reaches Railway fine, while GitHub's asset CDN
// (release-assets.githubusercontent.com) is blocked by some ISPs — so we fetch it
// server-side (cloud → GitHub is unrestricted) and pipe it to the client.
const RELEASE_ASSETS = {
  windows: {
    url: "https://github.com/simba-stack/orbit-remote-desktop/releases/latest/download/OrbitRemote-Setup.exe",
    filename: "OrbitRemote-Setup.exe",
    type: "application/octet-stream",
  },
  android: {
    url: "https://github.com/simba-stack/orbit-remote-android/releases/latest/download/orbit-remote.apk",
    filename: "orbit-remote.apk",
    type: "application/vnd.android.package-archive",
  },
};

app.get("/dl/:platform", async (req, res) => {
  const asset = RELEASE_ASSETS[req.params.platform];
  if (!asset) return res.status(404).json({ error: "unknown platform" });

  // Abort a hung GitHub fetch instead of pinning a socket indefinitely.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const upstream = await fetch(asset.url, { redirect: "follow", signal: controller.signal });
    if (!upstream.ok || !upstream.body) {
      clearTimeout(timeout);
      return res.status(502).json({ error: `upstream ${upstream.status}` });
    }
    res.setHeader("Content-Type", asset.type);
    res.setHeader("Content-Disposition", `attachment; filename="${asset.filename}"`);
    const len = upstream.headers.get("content-length");
    if (len) res.setHeader("Content-Length", len);

    const stream = Readable.fromWeb(upstream.body);
    // If the upstream connection drops mid-download, fail cleanly instead of
    // throwing an unhandled 'error' on the pipe (which can crash the process).
    stream.on("error", () => {
      if (!res.headersSent) res.status(502).end();
      else res.destroy();
    });
    res.on("close", () => stream.destroy());
    stream.once("end", () => clearTimeout(timeout));
    stream.pipe(res);
  } catch (e) {
    clearTimeout(timeout);
    if (!res.headersSent) res.status(502).json({ error: "download proxy failed" });
  }
});

// --- Static + pages ----------------------------------------------------

app.use(
  express.static(PUBLIC_DIR, {
    extensions: ["html"],
    maxAge: process.env.NODE_ENV === "production" ? "1h" : 0,
  })
);

app.get("/", (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// SPA-style fallback to the landing page for unknown non-API routes.
app.use((req, res) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/download")) {
    return res.status(404).json({ error: "Not found" });
  }
  res.status(404).sendFile(path.join(PUBLIC_DIR, "404.html"));
});

app.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`Orbit Remote website listening on http://${HOST}:${PORT}`);
});
