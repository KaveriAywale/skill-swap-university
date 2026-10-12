'use strict';

const env = require('../config/env');

/**
 * AI illustration service (anime movie style).
 *
 * Generates original anime-movie-style artwork for the platform:
 *   - a wide cinematic campus hero image, and
 *   - per-student character portraits.
 *
 * Provider is configurable. With `ART_IMAGE_PROVIDER=openai` and an
 * `OPENAI_API_KEY` set, real images are generated via the OpenAI Images API
 * (`gpt-image-1` by default, `dall-e-3` also supported). Without a key the
 * service throws a clear, actionable error and the website keeps its built-in
 * illustrated fallback (animated avatars + gradient hero), so nothing breaks.
 *
 * All prompts and the shared art-direction live here so the whole site can be
 * regenerated with a consistent look by running `npm run art`.
 */

const ART_DIRECTION = [
  'High-quality 2D Japanese anime movie illustration, theatrical anime film quality.',
  'Clean crisp linework, soft cel shading, delicate restrained detail, natural soft lighting, gentle atmospheric depth and subtle bokeh.',
  'Beautifully drawn well-proportioned faces, expressive detailed eyes, clean hair shapes, correct believable anatomy and hands with five well-formed fingers.',
  'Youthful, friendly, confident and welcoming. Harmonious colour palette of soft blues, whites and warm golden sunlight.',
  'Original artwork. No text, no logos, no watermark, no UI elements, no signatures.',
  'Avoid: deformed faces, asymmetrical eyes, distorted or extra fingers, stiff poses, blurry or muddy detail, 3D render look, glossy plastic, chibi proportions, generic AI artifacts.',
].join(' ');

const HERO_PROMPT = [
  'Wide cinematic key visual for a university website hero section.',
  ART_DIRECTION,
  'Scene: a bright, airy university library and collaborative study space with tall windows, wooden desks, bookshelves, laptops, notebooks, whiteboards and green plants.',
  'A diverse group of friendly college students (male and female, varied ethnicities) learn and help one another: one explains something on a laptop screen, two discuss a project, one sketches in a notebook, another smiles while sharing a skill, another listens and takes notes.',
  'Natural, believable poses and warm facial expressions that communicate friendship, teamwork, creativity and personal growth.',
  'Composition: place the students mainly on the right side and toward the edges, leaving a large clean, uncluttered negative space on the left for website headline, description and call-to-action buttons.',
].join(' ');

const PORTRAIT_PROMPT_SUFFIX = [
  'Upper-body portrait of a friendly, confident university student, facing the viewer with a gentle natural smile.',
  'Plain soft light-blue gradient background. Centred composition, head and shoulders clearly visible, crisp clean edges.',
].join(' ');

function buildHeroPrompt() {
  return HERO_PROMPT;
}

function buildCharacterPrompt(student = {}) {
  const name = student.name || 'a student';
  const department = student.department || 'their department';
  const year = student.year ? `Year ${student.year}` : '';
  const interests = Array.isArray(student.teach) && student.teach.length
    ? student.teach.slice(0, 3).join(', ')
    : 'a mix of campus subjects';
  return [
    PORTRAIT_PROMPT_SUFFIX,
    ART_DIRECTION,
    `Character: ${name}, ${[year, department].filter(Boolean).join(' ')}.
Interests and strengths: ${interests}.
Give the character a distinct, appealing and consistent design suitable as a profile picture.`,
  ].join(' ');
}

/** Deterministic filename-safe slug. Kept identical to the front-end helper. */
function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function providerConfig() {
  const provider = (process.env.ART_IMAGE_PROVIDER || 'openai').toLowerCase();
  const model = process.env.ART_IMAGE_MODEL || 'gpt-image-1';
  const isGptImage = model.startsWith('gpt-image');
  const outputFormat = (process.env.ART_IMAGE_OUTPUT_FORMAT || (isGptImage ? 'webp' : 'png')).toLowerCase();
  return {
    provider,
    model,
    isGptImage,
    outputFormat,
    heroSize: process.env.ART_IMAGE_SIZE_HERO || (isGptImage ? '1536x1024' : '1792x1024'),
    avatarSize: process.env.ART_IMAGE_SIZE_AVATAR || '1024x1024',
    quality: process.env.ART_IMAGE_QUALITY || (isGptImage ? 'high' : 'hd'),
  };
}

function isEnabled() {
  return providerConfig().provider === 'openai' && Boolean(env.openaiApiKey);
}

function describeConfig() {
  const c = providerConfig();
  return {
    enabled: Boolean(env.openaiApiKey) && c.provider === 'openai',
    provider: c.provider,
    model: c.model,
    outputFormat: c.outputFormat,
    heroSize: c.heroSize,
    avatarSize: c.avatarSize,
    quality: c.quality,
    hasApiKey: Boolean(env.openaiApiKey),
  };
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a single image and return an object with the encoded buffer and the
 * file extension that matches the encoded format.
 */
async function generateImage(prompt, { size, kind = 'avatar', retries = 3 } = {}) {
  const cfg = providerConfig();
  if (cfg.provider !== 'openai') {
    throw new Error(`Unsupported ART_IMAGE_PROVIDER "${cfg.provider}". Set ART_IMAGE_PROVIDER=openai.`);
  }
  if (!env.openaiApiKey) {
    throw new Error(
      'Missing OPENAI_API_KEY. Set it in server/.env to generate illustrations, or skip `npm run art` and use the built-in illustrated fallback.'
    );
  }

  const body = { model: cfg.model, prompt, n: 1, size: size || cfg.avatarSize };
  if (cfg.isGptImage) {
    body.quality = cfg.quality;
    body.output_format = cfg.outputFormat;
    if (cfg.outputFormat === 'webp' || cfg.outputFormat === 'jpeg') {
      body.output_compression = 82;
    }
  } else {
    // dall-e-3
    body.quality = cfg.quality;
    body.response_format = 'b64_json';
  }

  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.openaiApiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        const err = new Error(`Image provider error (${res.status}) for ${kind}: ${text.slice(0, 300)}`);
        err.status = res.status;
        throw err;
      }

      const data = await res.json();
      const b64 = data.data?.[0]?.b64_json;
      if (!b64) throw new Error(`No image data returned for ${kind}`);

      const ext = cfg.isGptImage ? cfg.outputFormat : 'png';
      return { buffer: Buffer.from(b64, 'base64'), ext };
    } catch (err) {
      lastErr = err;
      const retryable = !err.status || err.status === 429 || err.status >= 500;
      if (!retryable || attempt === retries) break;
      await sleep(1500 * attempt * attempt);
    }
  }
  throw lastErr;
}

module.exports = {
  buildHeroPrompt,
  buildCharacterPrompt,
  generateImage,
  describeConfig,
  isEnabled,
  slugify,
  ART_DIRECTION,
};
