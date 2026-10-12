import { useEffect, useState } from 'react';

/**
 * Loads the illustration manifest produced by `npm run art` (server script).
 *
 * When the generated anime artwork is present, `client/public/art/manifest.json`
 * describes the hero image and each student portrait. When it is absent (the
 * default, no API key), the fetch fails quietly and the site falls back to its
 * built-in illustrations. The promise is cached so the manifest is requested
 * only once per page load.
 */

let manifestPromise;

export function getArtManifest() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (!manifestPromise) {
    manifestPromise = fetch('/art/manifest.json', { cache: 'no-cache' })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
  }
  return manifestPromise;
}

/** React hook returning the manifest, or null while loading / when absent. */
export function useArtManifest() {
  const [manifest, setManifest] = useState(null);
  useEffect(() => {
    let alive = true;
    getArtManifest().then((data) => {
      if (alive) setManifest(data);
    });
    return () => {
      alive = false;
    };
  }, []);
  return manifest;
}

/** Filename-safe slug. Must match `slugify` in server/src/services/artService.js. */
export function slugifyName(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
