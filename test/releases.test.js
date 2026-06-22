import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  readManifest,
  getPlatformRelease,
  fileIsAvailable,
} from "../src/releases.js";

function makeTempReleases(manifest, files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "orbit-rel-"));
  if (manifest !== undefined) {
    fs.writeFileSync(path.join(dir, "releases.json"), JSON.stringify(manifest));
  }
  for (const [name, contents] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), contents);
  }
  return dir;
}

test("readManifest parses a valid manifest", () => {
  const dir = makeTempReleases({
    product: "Orbit Remote",
    updated: "2026-06-22",
    platforms: { windows: { file: "x.exe" } },
  });
  const m = readManifest(dir);
  assert.equal(m.product, "Orbit Remote");
  assert.ok(m.platforms.windows);
  assert.equal(m.error, undefined);
});

test("readManifest returns safe fallback on missing file", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "orbit-empty-"));
  const m = readManifest(dir);
  assert.deepEqual(m.platforms, {});
  assert.match(m.error, /Manifest unavailable/);
});

test("readManifest returns safe fallback on invalid JSON", () => {
  const dir = makeTempReleases(undefined);
  fs.writeFileSync(path.join(dir, "releases.json"), "{ not json ");
  const m = readManifest(dir);
  assert.deepEqual(m.platforms, {});
  assert.match(m.error, /Manifest unavailable/);
});

test("getPlatformRelease returns entry or null", () => {
  const dir = makeTempReleases({
    platforms: { android: { file: "a.apk", version: "1.0.0" } },
  });
  assert.equal(getPlatformRelease("android", dir).version, "1.0.0");
  assert.equal(getPlatformRelease("windows", dir), null);
});

test("fileIsAvailable is false when binary is absent", () => {
  const dir = makeTempReleases({
    platforms: { windows: { file: "missing.exe" } },
  });
  assert.equal(fileIsAvailable({ file: "missing.exe" }, dir), false);
});

test("fileIsAvailable is true when binary exists", () => {
  const dir = makeTempReleases(
    { platforms: { windows: { file: "present.exe" } } },
    { "present.exe": "binary-bytes" }
  );
  assert.equal(fileIsAvailable({ file: "present.exe" }, dir), true);
});

test("fileIsAvailable guards against missing entry/file", () => {
  const dir = makeTempReleases({ platforms: {} });
  assert.equal(fileIsAvailable(null, dir), false);
  assert.equal(fileIsAvailable({}, dir), false);
});

test("fileIsAvailable resolves only by basename (no path traversal)", () => {
  const dir = makeTempReleases(
    { platforms: {} },
    { "safe.apk": "x" }
  );
  // A traversal attempt collapses to the basename within the releases dir.
  assert.equal(fileIsAvailable({ file: "../../etc/passwd" }, dir), false);
  assert.equal(fileIsAvailable({ file: "sub/dir/safe.apk" }, dir), true);
});
