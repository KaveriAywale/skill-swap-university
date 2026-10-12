'use strict';

/**
 * Generate original anime-movie-style illustrations for Skill Swap University.
 *
 * Usage (from the project root or the server folder):
 *   npm run art                 # generate hero + all demo student portraits
 *   npm run art -- --hero       # only the cinematic hero background
 *   npm run art -- --avatars    # only the student portraits
 *   npm run art -- --limit=4    # first N students (useful to test / save cost)
 *   npm run art -- --names="Aarav Sharma,Sana Khan"
 *   npm run art -- --force      # regenerate even if files already exist
 *
 * Requires ART_IMAGE_PROVIDER=openai and OPENAI_API_KEY in server/.env.
 * Output is written to client/public/art and a manifest.json is maintained so
 * the front-end can discover the generated assets (and fall back gracefully
 * when they are absent).
 */

const fs = require('fs');
const path = require('path');

const art = require('../src/services/artService');
const { demoStudents } = require('../src/constants/demoStudents');

const OUT_ROOT = path.resolve(__dirname, '../../client/public/art');
const AVATAR_DIR = path.join(OUT_ROOT, 'avatars');
const MANIFEST_PATH = path.join(OUT_ROOT, 'manifest.json');

function parseArgs(argv) {
  const args = { hero: false, avatars: false, force: false, limit: null, names: null };
  for (const raw of argv) {
    if (raw === '--hero') args.hero = true;
    else if (raw === '--avatars') args.avatars = true;
    else if (raw === '--force') args.force = true;
    else if (raw.startsWith('--limit=')) args.limit = parseInt(raw.split('=')[1], 10) || null;
    else if (raw.startsWith('--names=')) args.names = raw.split('=')[1];
  }
  if (!args.hero && !args.avatars) {
    args.hero = true;
    args.avatars = true;
  }
  return args;
}

function readManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  } catch {
    return { style: 'anime', hero: null, avatars: {} };
  }
}

function writeManifest(manifest) {
  fs.mkdirSync(OUT_ROOT, { recursive: true });
  const payload = { ...manifest, style: 'anime', generatedAt: new Date().toISOString() };
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function rel(p) {
  return `/${path.relative(path.resolve(__dirname, '../../client/public'), p).split(path.sep).join('/')}`;
}

function findExisting(baseName) {
  for (const ext of ['webp', 'png', 'jpg', 'jpeg']) {
    const candidate = `${baseName}.${ext}`;
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

async function generateHero(manifest, force) {
  const base = path.join(OUT_ROOT, 'hero');
  const existing = findExisting(base);
  if (existing && !force) {
    manifest.hero = rel(existing);
    console.log(`[art] hero exists, skipping (${rel(existing)})`);
    return;
  }
  const cfg = art.describeConfig();
  console.log(`[art] generating hero (${cfg.model}, ${cfg.heroSize})…`);
  const { buffer, ext } = await art.generateImage(art.buildHeroPrompt(), { size: cfg.heroSize, kind: 'hero' });
  const target = `${base}.${ext}`;
  fs.writeFileSync(target, buffer);
  manifest.hero = rel(target);
  console.log(`[art] hero written → ${rel(target)} (${(buffer.length / 1024).toFixed(0)} KB)`);
}

async function generateAvatars(manifest, force, limit, names) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
  let students = demoStudents;
  if (names) {
    const wanted = new Set(names.split(',').map((n) => art.slugify(n)));
    students = students.filter((s) => wanted.has(art.slugify(s.name)));
  }
  if (limit && limit > 0) students = students.slice(0, limit);

  const cfg = art.describeConfig();
  for (let i = 0; i < students.length; i += 1) {
    const student = students[i];
    const slug = art.slugify(student.name);
    const base = path.join(AVATAR_DIR, slug);
    const existing = findExisting(base);
    if (existing && !force) {
      manifest.avatars[slug] = rel(existing);
      console.log(`[art] ${i + 1}/${students.length} ${student.name} exists, skipping`);
      continue;
    }
    try {
      console.log(`[art] ${i + 1}/${students.length} generating portrait for ${student.name} (${cfg.model})…`);
      const { buffer, ext } = await art.generateImage(art.buildCharacterPrompt(student), {
        size: cfg.avatarSize,
        kind: `avatar:${slug}`,
      });
      const target = `${base}.${ext}`;
      fs.writeFileSync(target, buffer);
      manifest.avatars[slug] = rel(target);
      console.log(`[art] ${student.name} → ${rel(target)} (${(buffer.length / 1024).toFixed(0)} KB)`);
      // Keep an up-to-date manifest as we go, so partial runs are still usable.
      writeManifest(manifest);
    } catch (err) {
      console.error(`[art] failed for ${student.name}: ${err.message}`);
    }
  }
}

function writePlaceholderNote() {
  const note = path.join(OUT_ROOT, '.gitkeep');
  if (!fs.existsSync(note)) fs.writeFileSync(note, '');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cfg = art.describeConfig();

  console.log('[art] config:', JSON.stringify({ ...cfg, hasApiKey: cfg.hasApiKey ? 'yes' : 'no' }));
  if (!cfg.enabled) {
    console.error(
      '\n[art] Image generation is not configured.\n' +
        '    Set ART_IMAGE_PROVIDER=openai and OPENAI_API_KEY in server/.env, then re-run `npm run art`.\n' +
        '    Without a key the website still works using its built-in illustrated fallback.\n'
    );
    process.exitCode = 1;
    return;
  }

  fs.mkdirSync(OUT_ROOT, { recursive: true });
  const manifest = readManifest();

  if (args.hero) await generateHero(manifest, args.force);
  if (args.avatars) await generateAvatars(manifest, args.force, args.limit, args.names);

  writeManifest(manifest);
  writePlaceholderNote();
  console.log('[art] done. Manifest →', rel(MANIFEST_PATH));
}

main().catch((err) => {
  console.error('[art] failed:', err);
  process.exit(1);
});
