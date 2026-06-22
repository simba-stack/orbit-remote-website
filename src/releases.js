import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const RELEASES_DIR = path.resolve(__dirname, "..", "releases");
const MANIFEST_PATH = path.join(RELEASES_DIR, "releases.json");

/**
 * Reads and validates the releases manifest from disk. Re-read on every call so
 * that dropping a new build into /releases is picked up without a redeploy.
 * @param {string} [releasesDir] override directory (used by tests)
 */
export function readManifest(releasesDir = RELEASES_DIR) {
  const manifestPath = path.join(releasesDir, "releases.json");
  try {
    const raw = fs.readFileSync(manifestPath, "utf8");
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object" || !data.platforms) {
      throw new Error("manifest missing 'platforms'");
    }
    return data;
  } catch (err) {
    return {
      product: "Orbit Remote",
      updated: null,
      platforms: {},
      error: `Manifest unavailable: ${err.message}`,
    };
  }
}

/** Returns the release descriptor for a platform, or null if unavailable. */
export function getPlatformRelease(platform, releasesDir = RELEASES_DIR) {
  const manifest = readManifest(releasesDir);
  const entry = manifest.platforms[platform];
  return entry || null;
}

/** True only when the referenced binary actually exists on disk. */
export function fileIsAvailable(entry, releasesDir = RELEASES_DIR) {
  if (!entry || !entry.file) return false;
  const filePath = path.join(releasesDir, path.basename(entry.file));
  return fs.existsSync(filePath);
}
